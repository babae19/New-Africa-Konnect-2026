-- Add profile_image_url to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(255);

-- Add certifications to expert_profiles table
ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

-- Add detailed bio/more_details to expert_profiles if needed (bio exists, maybe more_details?)
ALTER TABLE expert_profiles ADD COLUMN IF NOT EXISTS detailed_bio TEXT;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('users', 'expert_profiles');
