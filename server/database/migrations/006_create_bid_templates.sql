CREATE TABLE bid_templates (
    id SERIAL PRIMARY KEY,
    expert_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    cover_letter_template TEXT,
    proposed_timeline VARCHAR(100),
    proposed_duration INTEGER,
    portfolio_links TEXT[],
    pricing_strategy VARCHAR(50), -- 'fixed', 'hourly', 'percentage'
    pricing_value DECIMAL(10, 2),
    is_default BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_bid_templates_expert_id ON bid_templates(expert_id);
