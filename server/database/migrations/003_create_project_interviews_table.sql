-- Migration: Create Project Interviews Table
-- Description: Stores scheduled interviews between clients and experts

CREATE TABLE IF NOT EXISTS project_interviews (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bid_id INTEGER REFERENCES project_bids(id) ON DELETE SET NULL,
    scheduled_time TIMESTAMP NOT NULL,
    duration INTEGER DEFAULT 30 CHECK (duration > 0), -- minutes
    meeting_link TEXT,
    meeting_platform VARCHAR(50), -- 'zoom', 'google-meet', 'teams', 'phone', 'in-person'
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'no-show')),
    client_notes TEXT,
    expert_notes TEXT,
    outcome VARCHAR(20), -- 'hired', 'rejected', 'pending'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interviews_project ON project_interviews(project_id);
CREATE INDEX IF NOT EXISTS idx_interviews_expert ON project_interviews(expert_id);
CREATE INDEX IF NOT EXISTS idx_interviews_bid ON project_interviews(bid_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_time ON project_interviews(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON project_interviews(status);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_project_interviews_timestamp
    BEFORE UPDATE ON project_interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_bid_timestamp();
