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
            ADD COLUMN IF NOT EXISTS title VARCHAR(255),
            ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE
    `);

    await query(`
        ALTER TABLE expert_profiles
            ADD COLUMN IF NOT EXISTS website TEXT
    `);

    await query(`
        ALTER TABLE files
            ADD COLUMN IF NOT EXISTS url TEXT
    `);

    await query(`
        ALTER TABLE projects
            ADD COLUMN IF NOT EXISTS selected_expert_id UUID REFERENCES users(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS expert_status VARCHAR(20) DEFAULT 'none'
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS project_members (
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(50) DEFAULT 'member',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(project_id, user_id)
        )
    `);

    await query(`
        ALTER TABLE contracts
            ADD COLUMN IF NOT EXISTS client_signature JSONB,
            ADD COLUMN IF NOT EXISTS expert_signature JSONB,
            ADD COLUMN IF NOT EXISTS client_signed_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS expert_signed_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE
    `);
};

module.exports = { ensureRuntimeSchema };
