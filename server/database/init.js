const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

async function initializeDatabase() {
    console.log('🔄 Initializing database...\n');

    try {
        // Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        console.log('📝 Creating tables and indexes...');
        await pool.query(schema);

        console.log('✅ Database schema created successfully!\n');

        // Verify tables
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `;

        const result = await pool.query(tablesQuery);

        console.log('📊 Created tables:');
        result.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        console.log('\n✨ Database initialization complete!');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.error('\nPlease check:');
        console.error('1. Your database credentials in .env file');
        console.error('2. Database connection is accessible');
        console.error('3. You have the correct permissions');
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run initialization
initializeDatabase();
