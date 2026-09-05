const { pool } = require('./database/db');

async function checkColumns() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.log('Columns in users table:', res.rows);
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Error checking columns:', err);
        process.exit(1);
    }
}

checkColumns();
