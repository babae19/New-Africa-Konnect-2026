-- Migration: Add Open Bidding Support to Projects Table
-- Description: Adds fields to support open bidding marketplace functionality

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS open_for_bidding BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bidding_deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS min_budget DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS max_budget DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS required_skills TEXT[],
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private'; -- 'private', 'public', 'invited'

-- Add index for marketplace queries
CREATE INDEX IF NOT EXISTS idx_projects_open_bidding ON projects(open_for_bidding) WHERE open_for_bidding = TRUE;
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON projects(visibility);
CREATE INDEX IF NOT EXISTS idx_projects_bidding_deadline ON projects(bidding_deadline);
