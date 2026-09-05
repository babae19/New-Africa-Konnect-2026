const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('📥 Importing data to new Supabase database...\n');
console.log('Target:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown');
console.log('');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function importData() {
    const client = await pool.connect();

    try {
        // Read export file
        const exportPath = path.join(__dirname, 'database-export.json');

        if (!fs.existsSync(exportPath)) {
            throw new Error(`Export file not found: ${exportPath}\nPlease run export-data.js first.`);
        }

        const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));

        console.log('📋 Import source:');
        console.log(`   Timestamp: ${exportData.timestamp}`);
        console.log(`   Source: ${exportData.source}`);
        console.log('');

        // Tables to import (in order to respect foreign key constraints)
        const tableOrder = [
            'users',
            'expert_profiles',
            'projects',
            'contracts',
            'messages',
            'tasks',
            'files',
            'activities',
            'audit_logs',
            'password_reset_tokens',
            'notifications',
            'project_invitations',
            'applications',
            'interviews',
            'milestones',
            'transactions'
        ];

        console.log('📊 Importing tables:\n');

        let totalImported = 0;

        for (const table of tableOrder) {
            const data = exportData.tables[table];

            if (!data || !Array.isArray(data) || data.length === 0) {
                console.log(`  ⏭️  ${table}: No data to import (skipped)`);
                continue;
            }

            try {
                // Get column names from first row
                const columns = Object.keys(data[0]);
                const columnList = columns.join(', ');
                const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

                // Import each row
                for (const row of data) {
                    const values = columns.map(col => row[col]);
                    await client.query(
                        `INSERT INTO ${table} (${columnList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                        values
                    );
                }

                totalImported += data.length;
                console.log(`  ✅ ${table}: ${data.length} rows imported`);

            } catch (error) {
                console.log(`  ❌ ${table}: Error - ${error.message}`);
            }
        }

        console.log('\n✅ Import completed successfully!');
        console.log('\n📊 Import Summary:');
        console.log(`   Total rows imported: ${totalImported}`);

    } catch (error) {
        console.error('\n❌ Import failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

importData()
    .then(() => {
        console.log('\n✅ Import script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Import script failed');
        process.exit(1);
    });
