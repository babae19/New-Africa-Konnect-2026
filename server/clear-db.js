const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    }
});

const clearDatabase = async () => {
    try {
        console.log('🗑️ Clearing database...');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Truncate tables in order of dependency
            // contracts -> milestones -> tasks -> projects
            // messages -> notifications
            // expert_profiles -> users

            await client.query('TRUNCATE TABLE notifications CASCADE');
            await client.query('TRUNCATE TABLE messages CASCADE');
            await client.query('TRUNCATE TABLE messages CASCADE');
            // await client.query('TRUNCATE TABLE tasks CASCADE'); // Might be linked to projects via CASCADE
            // await client.query('TRUNCATE TABLE milestones CASCADE'); 

            await client.query('TRUNCATE TABLE contracts CASCADE');
            await client.query('TRUNCATE TABLE projects CASCADE');
            await client.query('TRUNCATE TABLE expert_profiles CASCADE');
            await client.query('TRUNCATE TABLE users CASCADE');

            await client.query('COMMIT');
            console.log('✅ Database cleared successfully.');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Failed to clear database:', err);
    } finally {
        await pool.end();
    }
};

clearDatabase();
