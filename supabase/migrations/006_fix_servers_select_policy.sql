-- supabase/migrations/006_fix_servers_select_policy.sql
-- Fix: Allow all authenticated users to SELECT servers
-- Server metadata (name, description, icon) is not sensitive.
-- Channels & messages are still protected by their own RLS policies.

-- Drop the restrictive policy that requires membership to even see server name
DROP POLICY IF EXISTS "Members can view servers" ON public.servers;

-- Allow any authenticated user to read server info
CREATE POLICY "Authenticated users can view servers" ON public.servers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Fix: Allow any server MEMBER to create invites (not just admins)
-- This matches Discord behavior where all members can invite by default
DROP POLICY IF EXISTS "Admins can create invites" ON public.server_invites;
CREATE POLICY "Members can create invites" ON public.server_invites
    FOR INSERT WITH CHECK (public.is_server_member(server_id, auth.uid()));
