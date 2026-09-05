
require('dotenv').config();
const { pool } = require('./database/db');

async function fixSchema() {
    try {
        const client = await pool.connect();

        console.log('🔧 Adding missing columns to users table...');

        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
            ADD COLUMN IF NOT EXISTS verification_token TEXT,
            ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS reset_token TEXT,
            ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS neon_id TEXT;
        `);

        console.log('✅ Schema successfully updated!');
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating schema:', err);
        process.exit(1);
    }
}

fixSchema();
