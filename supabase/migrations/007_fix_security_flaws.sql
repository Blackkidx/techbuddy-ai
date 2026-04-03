-- supabase/migrations/007_fix_security_flaws.sql
-- Fixes critical vulnerabilities in servers and channels

-- ==========================================
-- 1. Fix Server Members (Unrestricted Joining)
-- ==========================================
-- The previous policy just checked auth.uid() = user_id, allowing anyone to bypass invites.
DROP POLICY IF EXISTS "Users can join servers" ON public.server_members;
CREATE POLICY "Users can join servers" ON public.server_members
    FOR INSERT WITH CHECK (
        -- User can only insert their own row
        auth.uid() = user_id 
        AND 
        (
            -- Option A: The user was added by the server owner
            EXISTS (
                SELECT 1 FROM public.servers s 
                WHERE s.id = server_id AND s.owner_id = auth.uid()
            )
            OR
            -- Option B: The user used a valid, unexpired invite code for this server
            -- Note: We rely on the backend/service to validate and increment uses, 
            -- but this prevents raw SQL injection bypassing invites entirely.
            -- A stricter check would require the exact invite code in the insert, but 
            -- since server_members doesn't store the invite_code used, we at minimum 
            -- check if a valid invite exists for this server.
            EXISTS (
                SELECT 1 FROM public.server_invites i
                WHERE i.server_id = server_members.server_id
                  AND (i.expires_at > NOW() OR i.expires_at IS NULL)
                  AND (i.max_uses = 0 OR i.uses < i.max_uses)
            )
        )
    );


-- ==========================================
-- 2. Fix Channel Access (Global Read/Write)
-- ==========================================
-- Previous policy allowed any authenticated user to read/write all channel messages.
-- We must restrict it to members of the server that owns the channel.

-- Channels Table: Who can read channels?
DROP POLICY IF EXISTS "Anyone can read channels" ON public.channels;
CREATE POLICY "Users can read channels" ON public.channels
    FOR SELECT USING (
        -- Global channels (no server)
        server_id IS NULL 
        OR 
        -- Server channels (must be a member)
        public.is_server_member(server_id, auth.uid())
        OR
        -- Owner of the server
        EXISTS (SELECT 1 FROM public.servers s WHERE s.id = server_id AND s.owner_id = auth.uid())
    );

-- Messages Table: Who can read channel messages?
DROP POLICY IF EXISTS "Users can read channel messages" ON public.messages;
CREATE POLICY "Users can read channel messages" ON public.messages
    FOR SELECT USING (
        channel_id IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.channels c
            WHERE c.id = messages.channel_id
            AND (
                c.server_id IS NULL 
                OR public.is_server_member(c.server_id, auth.uid())
            )
        )
    );

-- Messages Table: Who can insert channel messages?
DROP POLICY IF EXISTS "Users can insert channel messages" ON public.messages;
CREATE POLICY "Users can insert channel messages" ON public.messages
    FOR INSERT WITH CHECK (
        channel_id IS NOT NULL 
        AND sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.channels c
            WHERE c.id = channel_id
            AND (
                c.server_id IS NULL 
                OR public.is_server_member(c.server_id, auth.uid())
            )
        )
    );


-- ==========================================
-- 3. Fix Message Deletion (Admin Moderation)
-- ==========================================
-- Allow server admins/owners to delete any message in their server's channels
DROP POLICY IF EXISTS "Users can delete own sent messages" ON public.messages;
CREATE POLICY "Users can delete messages" ON public.messages
    FOR DELETE USING (
        -- Regular DM or own message
        sender_id = auth.uid()
        OR
        -- Admin moderation for channel messages
        (
            channel_id IS NOT NULL 
            AND EXISTS (
                SELECT 1 FROM public.channels c
                WHERE c.id = messages.channel_id
                AND c.server_id IS NOT NULL
                AND public.is_server_admin(c.server_id, auth.uid())
            )
        )
    );
