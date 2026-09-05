const { query } = require('./database/db');

async function verifyTable() {
    try {
        console.log('Verifying saved_searches table...');
        const result = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'saved_searches'
        `);
        
        if (result.rows.length === 0) {
            console.error('❌ Table saved_searches DOES NOT EXIST');
        } else {
            console.log('✅ Table saved_searches exists with columns:');
            result.rows.forEach(row => {
                console.log(`- ${row.column_name} (${row.data_type})`);
            });
        }
    } catch (error) {
        console.error('❌ Error verifying table:', error.message);
    } finally {
        process.exit();
    }
}

verifyTable();
