const { Pool } = require('pg');
require('dotenv').config();

const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
    : new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    });

async function verify() {
    const client = await pool.connect();
    try {
        console.log('🔍 Verifying schema...');

        const userCols = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'profile_image_url';
        `);

        if (userCols.rows.length > 0) console.log('✅ users.profile_image_url exists');
        else console.log('❌ users.profile_image_url MISSING');

        const expertCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'expert_profiles' AND column_name = 'certifications';
        `);

        if (expertCols.rows.length > 0) console.log('✅ expert_profiles.certifications exists (' + expertCols.rows[0].data_type + ')');
        else console.log('❌ expert_profiles.certifications MISSING');

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

verify();
