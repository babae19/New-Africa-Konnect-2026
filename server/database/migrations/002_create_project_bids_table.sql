-- Migration: Create Project Bids Table
-- Description: Stores expert bids on open projects

CREATE TABLE IF NOT EXISTS project_bids (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bid_amount DECIMAL(10, 2) NOT NULL CHECK (bid_amount > 0),
    proposed_timeline VARCHAR(100),
    proposed_duration INTEGER, -- in days
    cover_letter TEXT,
    portfolio_links TEXT[],
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, expert_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bids_project ON project_bids(project_id);
CREATE INDEX IF NOT EXISTS idx_bids_expert ON project_bids(expert_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON project_bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_created ON project_bids(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bid_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_bids_timestamp
    BEFORE UPDATE ON project_bids
    FOR EACH ROW
    EXECUTE FUNCTION update_bid_timestamp();
