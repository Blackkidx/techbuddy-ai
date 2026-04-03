-- supabase/migrations/004_discord_like_servers.sql
-- Migration to introduce Discord-like servers (guilds) and categories

-- 1. Create servers table
CREATE TABLE IF NOT EXISTS public.servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create server_members table
CREATE TABLE IF NOT EXISTS public.server_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(server_id, user_id)
);

-- 3. Create server_invites table
CREATE TABLE IF NOT EXISTS public.server_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER DEFAULT 0, -- 0 = unlimited
    uses INTEGER DEFAULT 0
);

-- 4. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Alter channels table to support servers and categories
ALTER TABLE public.channels 
    ADD COLUMN IF NOT EXISTS server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS channel_type TEXT DEFAULT 'text' CHECK (channel_type IN ('text', 'voice')),
    ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Optional: Create a default 'TechBuddy Global' server and assign existing channels to it.
-- This requires a stored procedure or manual update if you want to migrate existing data.

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 7. Helper Functions for RLS (Avoids Infinite Recursion)

CREATE OR REPLACE FUNCTION public.is_server_member(_server_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM server_members
    WHERE server_id = _server_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_server_admin(_server_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM server_members
    WHERE server_id = _server_id AND user_id = _user_id AND role IN ('owner', 'admin')
  );
$$;

-- 8. Add Policies

-- Servers: Anyone can read a server if they are a member OR if they are the owner
DROP POLICY IF EXISTS "Members can view servers" ON public.servers;
CREATE POLICY "Members can view servers" ON public.servers
    FOR SELECT USING (owner_id = auth.uid() OR public.is_server_member(id, auth.uid()));

-- Servers: Only owners/admins can update/delete
DROP POLICY IF EXISTS "Owners can update servers" ON public.servers;
CREATE POLICY "Owners can update servers" ON public.servers
    FOR UPDATE USING (owner_id = auth.uid() OR public.is_server_admin(id, auth.uid()));

-- Servers: Authenticated users can create servers
DROP POLICY IF EXISTS "Authenticated users can create servers" ON public.servers;
CREATE POLICY "Authenticated users can create servers" ON public.servers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Server Members: Members can view all other members safely using security definer
DROP POLICY IF EXISTS "Members can view server members" ON public.server_members;
CREATE POLICY "Members can view server members" ON public.server_members
    FOR SELECT USING (public.is_server_member(server_id, auth.uid()));

-- Server Members: Admins can update roles
DROP POLICY IF EXISTS "Admins can update roles" ON public.server_members;
CREATE POLICY "Admins can update roles" ON public.server_members
    FOR UPDATE USING (public.is_server_admin(server_id, auth.uid()));

-- Server Members: Admins can kick members, or users can delete themselves (leave)
DROP POLICY IF EXISTS "Users can leave or admins can kick" ON public.server_members;
CREATE POLICY "Users can leave or admins can kick" ON public.server_members
    FOR DELETE USING (user_id = auth.uid() OR public.is_server_admin(server_id, auth.uid()));

-- Server Members: Users can insert themselves (join via invite) or server owners can add them
DROP POLICY IF EXISTS "Users can join servers" ON public.server_members;
CREATE POLICY "Users can join servers" ON public.server_members
    FOR INSERT WITH CHECK (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.servers s WHERE s.id = server_id AND s.owner_id = auth.uid()
    ));

-- Server Invites: Anyone can read valid invites
DROP POLICY IF EXISTS "Anyone can read invites" ON public.server_invites;
CREATE POLICY "Anyone can read invites" ON public.server_invites
    FOR SELECT USING (expires_at > NOW() OR expires_at IS NULL);

-- Server Invites: Admins can create invites
DROP POLICY IF EXISTS "Admins can create invites" ON public.server_invites;
CREATE POLICY "Admins can create invites" ON public.server_invites
    FOR INSERT WITH CHECK (public.is_server_admin(server_id, auth.uid()));

-- Categories: Members can view categories
DROP POLICY IF EXISTS "Members can view categories" ON public.categories;
CREATE POLICY "Members can view categories" ON public.categories
    FOR SELECT USING (public.is_server_member(server_id, auth.uid()));

-- Categories: Admins can manage categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.is_server_admin(server_id, auth.uid()));

-- Channels: Admins can manage channels (Note: Channels table might need an ALL policy for server admins)
DROP POLICY IF EXISTS "Admins can manage channels" ON public.channels;
CREATE POLICY "Admins can manage channels" ON public.channels
    FOR ALL USING (public.is_server_admin(server_id, auth.uid()));

-- Channels (update existing policy if needed to tie to server membership instead)
-- Note: Assuming you have existing channel policies, you might need to drop them and recreate.
-- Example:
-- CREATE POLICY "Members can view server channels" ON public.channels
--     FOR SELECT USING (EXISTS (
--         SELECT 1 FROM public.server_members sm 
--         WHERE sm.server_id = channels.server_id AND sm.user_id = auth.uid()
--     ));
