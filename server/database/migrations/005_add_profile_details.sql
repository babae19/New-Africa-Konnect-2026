-- Migration 005: Add profile details for Experts and Clients

-- Add country, city, company, services, and documents to expert_profiles
ALTER TABLE expert_profiles 
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- Add profile_image_url, country, city, company to users table (mostly for Clients)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS company VARCHAR(255);

-- Update profile completeness calculation helper (informational comment, logic is in expertModel.js)
-- Weighting will be updated in the backend code.
