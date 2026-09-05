const { query } = require('./database/db');

async function fixSchema() {
    try {
        console.log('Applying missing schema for saved_searches...');
        const ddl = `
            CREATE TABLE IF NOT EXISTS saved_searches (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                filters JSONB NOT NULL,
                notification_enabled BOOLEAN DEFAULT FALSE,
                last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Also create bid templates if they are missing
            CREATE TABLE IF NOT EXISTS bid_templates (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                expert_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                cover_letter_template TEXT,
                proposed_timeline VARCHAR(100),
                proposed_duration INT,
                portfolio_links TEXT[],
                pricing_strategy VARCHAR(50),
                pricing_value NUMERIC(10, 2),
                is_default BOOLEAN DEFAULT FALSE,
                usage_count INT DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        await query(ddl);
        console.log('✅ Schema updated successfully!');
        
    } catch (error) {
        console.error('❌ Error updating schema:', error.message);
    } finally {
        process.exit();
    }
}

fixSchema();
