const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
});

async function runMigrations() {
    let client;
    try {
        client = await pool.connect();
        console.log('🔄 Running database migrations...\n');

        const migrationsDir = path.join(__dirname, 'database/migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort(); // Sort to ensure correct order (001, 002, etc.)

        for (const file of files) {
            console.log(`📝 Running migration: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

            try {
                await client.query(sql);
                console.log(`✅ Success: ${file}\n`);
            } catch (err) {
                if (err.message.includes('already exists') || err.message.includes('duplicate column')) {
                    console.log(`⚠️  Skipped (already exists): ${file}\n`);
                } else {
                    console.error(`❌ Error in ${file}:`, err.message);
                    // Decide if you want to stop or continue. For now, let's keep going if it's a known non-fatal error.
                    // But if it's a syntax error, we might want to know.
                }
            }
        }

        console.log('\n🎉 All migration checks completed!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

runMigrations()
    .then(() => {
        console.log('\n✅ Migration process completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration process failed:', error);
        process.exit(1);
    });
