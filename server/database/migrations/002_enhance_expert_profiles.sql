-- Migration: Enhance Expert Profiles
-- Created: 2026-01-07

-- Add new fields to expert_profiles
ALTER TABLE expert_profiles
ADD COLUMN IF NOT EXISTS skill_categories JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS portfolio_items JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS availability_calendar JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rate_min DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS rate_max DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS rate_currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_profile_update TIMESTAMP,
ADD COLUMN IF NOT EXISTS profile_change_log JSONB DEFAULT '[]';

-- Create admin review table
CREATE TABLE IF NOT EXISTS profile_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expert_id UUID REFERENCES expert_profiles(user_id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    review_notes TEXT,
    changes_requested TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create skill taxonomy table
CREATE TABLE IF NOT EXISTS skill_taxonomy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    skill_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skill_taxonomy_category ON skill_taxonomy(category);
CREATE INDEX IF NOT EXISTS idx_skill_taxonomy_active ON skill_taxonomy(is_active);
CREATE INDEX IF NOT EXISTS idx_profile_reviews_expert ON profile_reviews(expert_id);
CREATE INDEX IF NOT EXISTS idx_profile_reviews_status ON profile_reviews(status);

COMMENT ON COLUMN expert_profiles.skill_categories IS 'Structured skill categories with taxonomy';
COMMENT ON COLUMN expert_profiles.portfolio_items IS 'Array of portfolio items (images, PDFs, links)';
COMMENT ON COLUMN expert_profiles.availability_calendar IS 'Availability calendar data';
COMMENT ON COLUMN expert_profiles.rate_min IS 'Minimum hourly rate';
COMMENT ON COLUMN expert_profiles.rate_max IS 'Maximum hourly rate';
COMMENT ON COLUMN expert_profiles.profile_completeness IS 'Profile completeness percentage (0-100)';
COMMENT ON COLUMN expert_profiles.profile_change_log IS 'Log of profile changes for admin review';
