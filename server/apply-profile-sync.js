const fs = require('fs');
const path = require('path');
const { query } = require('./database/db');

async function applyProfileSync() {
    try {
        console.log('🔄 Applying Profile Synchronization Triggers...');
        const sqlPath = path.join(__dirname, 'database', 'sync_profiles.sql');
        const ddl = fs.readFileSync(sqlPath, 'utf8');
        
        await query(ddl);
        console.log('✅ Profile triggers applied successfully!');
        
    } catch (error) {
        console.error('❌ Error applying triggers:', error.message);
    } finally {
        process.exit();
    }
}

applyProfileSync();
