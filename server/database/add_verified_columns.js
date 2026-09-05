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
    console.log('🔧 Adding verified columns to users table...');

    try {
        const client = await pool.connect();

        // Add email_verified
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
        `);
        console.log('✅ Added email_verified column');

        // Add is_verified (general account verification level maybe?)
        // The middleware checked 'vetting_status' on profile for experts, so maybe is_verified on user is redundant
        // but the seed script tried to use it.
        // Let's rely on email_verified for now as per authMiddleware.

        client.release();
        process.exit(0);

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

addColumns();
