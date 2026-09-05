-- Create notification_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Add columns for project matching if they don't exist
DO $$
BEGIN
    -- Project Matching Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_preferences' AND column_name='project_matching') THEN
        ALTER TABLE notification_preferences ADD COLUMN project_matching BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_preferences' AND column_name='match_threshold') THEN
        ALTER TABLE notification_preferences ADD COLUMN match_threshold DECIMAL(3, 2) DEFAULT 0.70;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_preferences' AND column_name='budget_min') THEN
        ALTER TABLE notification_preferences ADD COLUMN budget_min DECIMAL(10, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_preferences' AND column_name='budget_max') THEN
        ALTER TABLE notification_preferences ADD COLUMN budget_max DECIMAL(10, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_preferences' AND column_name='preferred_skills') THEN
        ALTER TABLE notification_preferences ADD COLUMN preferred_skills TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_preferences' AND column_name='preferred_project_types') THEN
        ALTER TABLE notification_preferences ADD COLUMN preferred_project_types TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_preferences' AND column_name='notification_frequency') THEN
        ALTER TABLE notification_preferences ADD COLUMN notification_frequency VARCHAR(20) DEFAULT 'immediate';
    END IF;

    -- Standard Notification Channels (Checking in case they differ from existing model)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_preferences' AND column_name='email_enabled') THEN
        ALTER TABLE notification_preferences ADD COLUMN email_enabled BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_preferences' AND column_name='push_enabled') THEN
        ALTER TABLE notification_preferences ADD COLUMN push_enabled BOOLEAN DEFAULT true;
    END IF;
    
    -- Legacy/Existing fields from previous model (ensuring they exist if we want to keep them)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_preferences' AND column_name='project_updates') THEN
        ALTER TABLE notification_preferences ADD COLUMN project_updates BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_preferences' AND column_name='messages') THEN
        ALTER TABLE notification_preferences ADD COLUMN messages BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_preferences' AND column_name='payments') THEN
        ALTER TABLE notification_preferences ADD COLUMN payments BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_preferences' AND column_name='marketing') THEN
        ALTER TABLE notification_preferences ADD COLUMN marketing BOOLEAN DEFAULT true;
    END IF;

END $$;

-- Create notification_queue table for batching
CREATE TABLE IF NOT EXISTS notification_queue (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    scheduled_for TIMESTAMP NOT NULL,
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queue processing
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_sent ON notification_queue(scheduled_for, sent);
