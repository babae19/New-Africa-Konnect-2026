-- Phase 4: Project Lifecycle & State Machine
-- Migration: 003_project_lifecycle.sql

-- Add state management to projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS state VARCHAR(50) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS state_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMP;

-- Create state transitions table
CREATE TABLE IF NOT EXISTS project_state_transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    from_state VARCHAR(50),
    to_state VARCHAR(50) NOT NULL,
    triggered_by UUID REFERENCES users(id),
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_state_transitions_project ON project_state_transitions(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_state ON projects(state);
