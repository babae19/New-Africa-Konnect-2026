const { query, pool } = require('./db');
require('dotenv').config();

const addColumn = async () => {
    try {
        console.log('Adding tech_stack column...');
        await query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS tech_stack TEXT[]');
        console.log('✅ tech_stack column added.');
    } catch (e) {
        console.error('Error adding column:', e);
    } finally {
        pool.end();
    }
};

addColumn();
