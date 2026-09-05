const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Checking current database state...\n');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
    const client = await pool.connect();

    try {
        // Check tables
        console.log('📊 Existing Tables:');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        if (tablesResult.rows.length === 0) {
            console.log('   (No tables found - database is empty)\n');
        } else {
            tablesResult.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
            console.log(`\n   Total: ${tablesResult.rows.length} tables\n`);
        }

        // Check for data in key tables
        if (tablesResult.rows.length > 0) {
            console.log('📈 Data Summary:');

            const tables = ['users', 'expert_profiles', 'projects', 'messages'];
            for (const table of tables) {
                try {
                    const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
                    console.log(`   ${table}: ${result.rows[0].count} rows`);
                } catch (error) {
                    console.log(`   ${table}: (table does not exist)`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
    });
