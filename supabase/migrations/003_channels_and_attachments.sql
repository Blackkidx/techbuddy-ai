-- Migration: 003_channels_and_attachments.sql
-- Description: Adds Discord-like Channels and File Attachments support to the messaging system.

-- 1. Create Channels Table
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,          -- e.g., 'คุยแลกเปลี่ยนงาน', 'การบ้าน'
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_private BOOLEAN DEFAULT false
);

-- Enable RLS for channels
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to read channels
CREATE POLICY "Anyone can read channels"
    ON public.channels FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow anyone to create channels (Can restrict to admins later)
CREATE POLICY "Users can create channels"
    ON public.channels FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 2. Modify Messages Table for Attachments and Channels
-- We alter the existing messages table instead of creating a new one
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT; -- e.g., 'image' or 'video'

-- 3. Update Existing Messaging RLS Policies
-- We need to make sure users can read messages in channels they have access to.
-- Since current policy probably checks `sender_id = auth.uid() OR receiver_id = auth.uid()`,
-- we add a broad policy for channel messages.
CREATE POLICY "Users can read channel messages"
    ON public.messages FOR SELECT
    USING (channel_id IS NOT NULL AND auth.role() = 'authenticated');

CREATE POLICY "Users can insert channel messages"
    ON public.messages FOR INSERT
    WITH CHECK (channel_id IS NOT NULL AND sender_id = auth.uid());

-- 4. Create a Bucket for Chat Attachments
-- (This requires Supabase Storage API, we can use raw SQL to insert into storage.buckets if using Superuser, 
-- but it's often safer to instruct the user to create the bucket 'chat-attachments' via the Supabase Dashboard UI)

-- 5. Insert Default Channels
INSERT INTO public.channels (name, description)
VALUES 
    ('ประกาศจากแอดมิน', 'ห้องแจ้งเตือนข่าวสารจากทีมอัปเดตระบบ'),
    ('คุยแลกเปลี่ยนงาน', 'พื้นที่พูดคุยเรื่องโปรเจกต์ โค้ด และ Tech ทั่วไป'),
    ('การบ้าน', 'ส่งงานหรือสอบถามการบ้าน Thai Tutor')
ON CONFLICT (name) DO NOTHING;
