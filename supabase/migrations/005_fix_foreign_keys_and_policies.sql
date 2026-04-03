-- supabase/migrations/005_fix_foreign_keys_and_policies.sql
-- Fixes foreign key references to allow proper PostgREST joins with public.profiles
-- Hardens RLS policies to prevent infinite recursion

-- 1. Fix Foreign Keys
ALTER TABLE public.servers
    DROP CONSTRAINT IF EXISTS servers_owner_id_fkey,
    ADD CONSTRAINT servers_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.server_members
    DROP CONSTRAINT IF EXISTS server_members_user_id_fkey,
    ADD CONSTRAINT server_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.server_invites
    DROP CONSTRAINT IF EXISTS server_invites_created_by_fkey,
    ADD CONSTRAINT server_invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Helper Functions for RLS (Avoids Infinite Recursion)
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

-- 3. Hardened Policies

-- Servers: Anyone can read a server if they are a member OR if they are the owner
DROP POLICY IF EXISTS "Members can view servers" ON public.servers;
CREATE POLICY "Members can view servers" ON public.servers
    FOR SELECT USING (owner_id = auth.uid() OR public.is_server_member(id, auth.uid()));

-- Servers: Only owners/admins can update/delete
DROP POLICY IF EXISTS "Owners can update servers" ON public.servers;
CREATE POLICY "Owners can update servers" ON public.servers
    FOR UPDATE USING (owner_id = auth.uid() OR public.is_server_admin(id, auth.uid()));

-- Server Invites: Anyone can read valid invites
DROP POLICY IF EXISTS "Anyone can read invites" ON public.server_invites;
CREATE POLICY "Anyone can read invites" ON public.server_invites
    FOR SELECT USING (expires_at > NOW() OR expires_at IS NULL);

-- Server Invites: Admins can create invites
DROP POLICY IF EXISTS "Admins can create invites" ON public.server_invites;
CREATE POLICY "Admins can create invites" ON public.server_invites
    FOR INSERT WITH CHECK (public.is_server_admin(server_id, auth.uid()));

-- Server Members: Members can view all other members
DROP POLICY IF EXISTS "Members can view server members" ON public.server_members;
CREATE POLICY "Members can view server members" ON public.server_members
    FOR SELECT USING (public.is_server_member(server_id, auth.uid()));

-- Server Members: Admins can update roles
DROP POLICY IF EXISTS "Admins can update roles" ON public.server_members;
CREATE POLICY "Admins can update roles" ON public.server_members
    FOR UPDATE USING (public.is_server_admin(server_id, auth.uid()));

-- Server Members: Admins can kick members, or users can leave
DROP POLICY IF EXISTS "Users can leave or admins can kick" ON public.server_members;
CREATE POLICY "Users can leave or admins can kick" ON public.server_members
    FOR DELETE USING (user_id = auth.uid() OR public.is_server_admin(server_id, auth.uid()));

-- Categories: Members can view categories
DROP POLICY IF EXISTS "Members can view categories" ON public.categories;
CREATE POLICY "Members can view categories" ON public.categories
    FOR SELECT USING (public.is_server_member(server_id, auth.uid()));

-- Categories: Admins can manage categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.is_server_admin(server_id, auth.uid()));

-- Channels: Admins can manage channels
DROP POLICY IF EXISTS "Admins can manage channels" ON public.channels;
CREATE POLICY "Admins can manage channels" ON public.channels
    FOR ALL USING (public.is_server_admin(server_id, auth.uid()));
