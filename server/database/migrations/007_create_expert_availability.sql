-- Create expert_availability table
CREATE TABLE expert_availability (
    id SERIAL PRIMARY KEY,
    expert_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster availability lookups
CREATE INDEX idx_expert_availability_expert_id ON expert_availability(expert_id);

-- Update project_interviews table to support calendar integration
ALTER TABLE project_interviews 
ADD COLUMN calendar_event_id VARCHAR(255),
ADD COLUMN calendar_provider VARCHAR(50), -- 'google', 'outlook', 'zoom'
ADD COLUMN auto_scheduled BOOLEAN DEFAULT false,
ADD COLUMN reminder_sent BOOLEAN DEFAULT false;
