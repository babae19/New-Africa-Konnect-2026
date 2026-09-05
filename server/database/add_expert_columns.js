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

async function addColumns() {
    console.log('🔧 Adding expert columns to projects table...');

    try {
        const client = await pool.connect();

        // 1. Add selected_expert_id
        await client.query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS selected_expert_id UUID REFERENCES users(id);
        `);
        console.log('✅ Added selected_expert_id column');

        // 2. Add expert_status
        await client.query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS expert_status VARCHAR(50) DEFAULT 'none';
        `);
        console.log('✅ Added expert_status column');

        client.release();
        process.exit(0);

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

addColumns();
