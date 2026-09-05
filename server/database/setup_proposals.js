const { pool } = require('./db');

async function setupProposalsTable() {
    try {
        console.log('Creating project_applications table...');
        const queryText = `
            CREATE TABLE IF NOT EXISTS project_applications (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
                expert_id UUID REFERENCES users(id) ON DELETE CASCADE,
                pitch TEXT,
                rate DECIMAL(10, 2),
                status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, shortlisted
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Add index for faster lookups
            CREATE INDEX IF NOT EXISTS idx_project_applications_project_id ON project_applications(project_id);
            CREATE INDEX IF NOT EXISTS idx_project_applications_expert_id ON project_applications(expert_id);
        `;

        await pool.query(queryText);
        console.log('✅ project_applications table created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to create table:', error);
        process.exit(1);
    }
}

setupProposalsTable();
