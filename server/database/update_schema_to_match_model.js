const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function updateSchema() {
    console.log('🔧 Updating schema to match expertModel...');

    try {
        const client = await pool.connect();

        const columns = [
            'ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0',
            "ADD COLUMN IF NOT EXISTS availability_status VARCHAR(50) DEFAULT 'available'",
            "ADD COLUMN IF NOT EXISTS portfolio_items JSONB DEFAULT '[]'",
            "ADD COLUMN IF NOT EXISTS availability_calendar JSONB DEFAULT '{}'",
            'ADD COLUMN IF NOT EXISTS rate_min NUMERIC(10, 2)',
            'ADD COLUMN IF NOT EXISTS rate_max NUMERIC(10, 2)',
            "ADD COLUMN IF NOT EXISTS rate_currency VARCHAR(10) DEFAULT 'USD'",
            "ADD COLUMN IF NOT EXISTS skill_categories JSONB DEFAULT '[]'",
            "ADD COLUMN IF NOT EXISTS profile_change_log JSONB DEFAULT '[]'",
            'ADD COLUMN IF NOT EXISTS last_profile_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
            "ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'"
        ];

        for (const col of columns) {
            await client.query(`ALTER TABLE expert_profiles ${col};`);
            console.log(`✅ Executed: ALTER TABLE expert_profiles ${col}`);
        }

        console.log('✅ Schema update complete!');
        client.release();
        process.exit(0);

    } catch (err) {
        console.error('❌ Schema update failed:', err);
        process.exit(1);
    }
}

updateSchema();
