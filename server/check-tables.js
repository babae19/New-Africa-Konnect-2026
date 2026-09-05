require('dotenv').config();
const { pool } = require('./database/db');

async function checkTables() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables found:', res.rows.map(r => r.table_name));

        // Also check row counts for users and experts if tables exist
        if (res.rows.find(r => r.table_name === 'users')) {
            const userCount = await client.query('SELECT count(*) FROM users');
            console.log('User count:', userCount.rows[0].count);
        }
        if (res.rows.find(r => r.table_name === 'expert_profiles')) {
            const expertCount = await client.query('SELECT count(*) FROM expert_profiles');
            console.log('Expert Profile count:', expertCount.rows[0].count);
        }

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Error checking tables:', err);
        process.exit(1);
    }
}

checkTables();
