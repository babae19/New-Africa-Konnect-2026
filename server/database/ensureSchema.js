const { query } = require('./db');

/**
 * Apply small, backwards-compatible schema additions required by the running
 * API. This protects existing deployments where historical SQL migrations were
 * not included in the hosting start command.
 */
const ensureRuntimeSchema = async () => {
    await query(`
        ALTER TABLE users
            ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
            ADD COLUMN IF NOT EXISTS country VARCHAR(100),
            ADD COLUMN IF NOT EXISTS city VARCHAR(100),
            ADD COLUMN IF NOT EXISTS location VARCHAR(255),
            ADD COLUMN IF NOT EXISTS company VARCHAR(255),
            ADD COLUMN IF NOT EXISTS website TEXT,
            ADD COLUMN IF NOT EXISTS title VARCHAR(255)
    `);

    await query(`
        ALTER TABLE expert_profiles
            ADD COLUMN IF NOT EXISTS website TEXT
    `);

    await query(`
        ALTER TABLE files
            ADD COLUMN IF NOT EXISTS url TEXT
    `);
};

module.exports = { ensureRuntimeSchema };
