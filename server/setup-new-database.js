const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🚀 Africa Konnect Database Setup Script\n');
console.log('Target Database:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown');
console.log('');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function setupDatabase() {
    const client = await pool.connect();

    try {
        console.log('📋 Step 1: Creating base schema...\n');

        // Read and execute base schema
        const schemaSql = fs.readFileSync(
            path.join(__dirname, 'database/schema.sql'),
            'utf8'
        );
        await client.query(schemaSql);
        console.log('✅ Base schema created successfully\n');

        console.log('📋 Step 2: Running migrations...\n');

        // Migration files in order
        const migrations = [
            '001_add_email_verification.sql',
            '002_enhance_expert_profiles.sql',
            '003_audit_logs.sql',
            '003_project_lifecycle.sql',
            '004_password_reset.sql',
            '004_realtime_features.sql',
            '005_audit_fixes.sql',
            '007_profile_enhancements.sql',
            '012_profile_and_file_persistence.sql',
            '013_persist_onboarding_completion.sql',
            '014_collaboration_contract_lifecycle.sql'
        ];

        for (const migration of migrations) {
            try {
                console.log(`  📝 Running: ${migration}`);
                const migrationSql = fs.readFileSync(
                    path.join(__dirname, 'database/migrations', migration),
                    'utf8'
                );
                await client.query(migrationSql);
                console.log(`  ✅ ${migration} completed\n`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`  ⚠️  ${migration} - Some objects already exist (skipped)\n`);
                } else {
                    throw error;
                }
            }
        }

        console.log('📋 Step 3: Verifying database structure...\n');

        // Verify tables
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        console.log('✅ Database tables created:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        console.log('\n🎉 Database setup completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   Total tables: ${tablesResult.rows.length}`);
        console.log(`   Migrations applied: ${migrations.length}`);

    } catch (error) {
        console.error('\n❌ Database setup failed:', error.message);
        console.error('\nFull error:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the setup
setupDatabase()
    .then(() => {
        console.log('\n✅ Setup script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Setup script failed');
        process.exit(1);
    });
