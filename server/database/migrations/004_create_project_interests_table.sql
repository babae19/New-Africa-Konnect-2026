-- Migration: Create Project Interests Table
-- Description: Stores expert expressions of interest in projects (lighter than bids)

CREATE TABLE IF NOT EXISTS project_interests (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'converted_to_bid', 'withdrawn')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, expert_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interests_project ON project_interests(project_id);
CREATE INDEX IF NOT EXISTS idx_interests_expert ON project_interests(expert_id);
CREATE INDEX IF NOT EXISTS idx_interests_status ON project_interests(status);
CREATE INDEX IF NOT EXISTS idx_interests_created ON project_interests(created_at DESC);
