const { pool } = require('./db');
const { query } = require('./db');

async function setupInterviewsTable() {
    try {
        console.log('Creating interviews table...');
        const queryText = `
            CREATE TABLE IF NOT EXISTS interviews (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
                client_id UUID REFERENCES users(id) ON DELETE CASCADE,
                expert_id UUID REFERENCES users(id) ON DELETE CASCADE,
                scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
                duration_minutes INTEGER DEFAULT 30,
                status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, missed
                meeting_link TEXT,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Add index for faster lookups
            CREATE INDEX IF NOT EXISTS idx_interviews_project_id ON interviews(project_id);
            CREATE INDEX IF NOT EXISTS idx_interviews_expert_id ON interviews(expert_id);
            CREATE INDEX IF NOT EXISTS idx_interviews_client_id ON interviews(client_id);
        `;

        await query(queryText);
        console.log('✅ interviews table created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to create table:', error);
        process.exit(1);
    }
}

setupInterviewsTable();
