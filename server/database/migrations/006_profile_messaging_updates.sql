-- Migration: Update users and messages tables
-- Add profile fields to users and modify messages for direct messaging

-- 1. Update users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Update messages table
-- First, make project_id nullable
ALTER TABLE messages ALTER COLUMN project_id DROP NOT NULL;

-- Second, add receiver_id
ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Third, add check constraint (use a do block to avoid errors if it already exists or if data violates it)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_check_project_or_receiver') THEN
        ALTER TABLE messages ADD CONSTRAINT messages_check_project_or_receiver CHECK (project_id IS NOT NULL OR receiver_id IS NOT NULL);
    END IF;
END $$;

-- 3. Add index for receiver_id
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
