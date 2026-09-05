const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

console.log('⚠️  CLEAN DATABASE SETUP\n');
console.log('This will DROP all existing tables and recreate the schema.\n');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function askConfirmation() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes');
        });
    });
}

async function cleanAndSetup() {
    const client = await pool.connect();

    try {
        // Check existing tables
        console.log('\n📊 Checking existing tables...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        if (tablesResult.rows.length > 0) {
            console.log('\n⚠️  Found existing tables:');
            tablesResult.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
            console.log('');

            const confirmed = await askConfirmation();
            if (!confirmed) {
                console.log('\n❌ Setup cancelled by user');
                return;
            }

            console.log('\n🗑️  Dropping existing tables...');
            // Drop all tables
            for (const row of tablesResult.rows) {
                await client.query(`DROP TABLE IF EXISTS ${row.table_name} CASCADE`);
                console.log(`   ✅ Dropped ${row.table_name}`);
            }
        } else {
            console.log('✅ Database is empty, proceeding with setup...\n');
        }

        console.log('\n📋 Step 1: Creating base schema...');
        const schemaSql = fs.readFileSync(
            path.join(__dirname, 'database/schema.sql'),
            'utf8'
        );
        await client.query(schemaSql);
        console.log('✅ Base schema created\n');

        console.log('📋 Step 2: Running migrations...\n');
        const migrations = [
            '001_add_email_verification.sql',
            '002_enhance_expert_profiles.sql',
            '003_audit_logs.sql',
            '003_project_lifecycle.sql',
            '004_password_reset.sql',
            '004_realtime_features.sql',
            '005_audit_fixes.sql',
            '007_profile_enhancements.sql'
        ];

        for (const migration of migrations) {
            try {
                console.log(`  📝 ${migration}`);
                const migrationSql = fs.readFileSync(
                    path.join(__dirname, 'database/migrations', migration),
                    'utf8'
                );
                await client.query(migrationSql);
                console.log(`  ✅ Completed\n`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`  ⚠️  Skipped (already exists)\n`);
                } else {
                    throw error;
                }
            }
        }

        console.log('📋 Step 3: Verifying setup...\n');
        const finalTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        console.log('✅ Database tables:');
        finalTables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        console.log('\n🎉 Database setup completed successfully!');
        console.log(`\n📊 Total tables: ${finalTables.rows.length}`);

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

cleanAndSetup()
    .then(() => {
        console.log('\n✅ Setup complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Setup failed');
        process.exit(1);
    });
