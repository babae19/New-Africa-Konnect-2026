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
    console.log('🔧 Adding columns to project_tasks table...');

    try {
        const client = await pool.connect();

        // Check if table exists, if not create it?? 
        // Logic assumes table exists but columns might skip.
        // But if error says "column created_by does not exist", table exists.

        // created_by
        await client.query(`
            ALTER TABLE project_tasks 
            ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
        `);
        console.log('✅ Added created_by column');

        // assigned_to
        await client.query(`
            ALTER TABLE project_tasks 
            ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);
        `);
        console.log('✅ Added assigned_to column');

        // priority
        await client.query(`
            ALTER TABLE project_tasks 
            ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
        `);
        console.log('✅ Added priority column');

        // due_date
        await client.query(`
            ALTER TABLE project_tasks 
            ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
        `);
        console.log('✅ Added due_date column');

        client.release();
        process.exit(0);

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

addColumns();
