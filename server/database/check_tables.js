const { pool } = require('./db');

async function checkTables() {
    try {
        const requiredTables = ['messages', 'tasks', 'files'];
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ANY($1)
        `, [requiredTables]);

        const existingTables = res.rows.map(row => row.table_name);
        const missingTables = requiredTables.filter(t => !existingTables.includes(t));

        if (missingTables.length > 0) {
            console.log(`Missing tables: ${missingTables.join(', ')}`);
            process.exit(1); // Exit with error if tables missing
        } else {
            console.log('All required tables exist.');
            process.exit(0);
        }
    } catch (err) {
        console.error('Error checking tables:', err);
        process.exit(1);
    }
}

checkTables();
