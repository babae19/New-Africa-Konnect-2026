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

async function runMigrations() {
    console.log('🔄 Running database migrations...\n');

    try {
        const migrationsDir = path.join(__dirname, 'migrations');

        // Check if migrations directory exists
        if (!fs.existsSync(migrationsDir)) {
            console.log('✅ No migrations to run.');
            return;
        }

        // Get all migration files
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        if (files.length === 0) {
            console.log('✅ No migration files found.');
            return;
        }

        console.log(`📝 Found ${files.length} migration(s):\n`);

        // Run each migration
        for (const file of files) {
            console.log(`   Running: ${file}...`);
            const migrationPath = path.join(migrationsDir, file);
            const migration = fs.readFileSync(migrationPath, 'utf8');

            await pool.query(migration);
            console.log(`   ✅ ${file} completed`);
        }

        console.log('\n🌱 Running seed data...\n');

        // Run seed data
        const seedsDir = path.join(__dirname, 'seeds');
        if (fs.existsSync(seedsDir)) {
            const seedFiles = fs.readdirSync(seedsDir)
                .filter(file => file.endsWith('.sql'))
                .sort();

            for (const file of seedFiles) {
                console.log(`   Seeding: ${file}...`);
                const seedPath = path.join(seedsDir, file);
                const seed = fs.readFileSync(seedPath, 'utf8');

                await pool.query(seed);
                console.log(`   ✅ ${file} completed`);
            }
        }

        console.log('\n✨ All migrations completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run migrations
runMigrations();
