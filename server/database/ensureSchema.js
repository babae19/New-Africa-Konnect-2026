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
            ADD COLUMN IF NOT EXISTS expert_status VARCHAR(20) DEFAULT 'none',
            ADD COLUMN IF NOT EXISTS delivery_accepted_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS deletion_requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS deletion_consented_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS deletion_consented_by UUID REFERENCES users(id) ON DELETE SET NULL
    `);

    await query(`
        ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
        ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK (
            status IN ('draft', 'open', 'posted', 'published', 'matched', 'contracted',
                       'active', 'in_progress', 'completed', 'finalized', 'archived', 'cancelled')
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS interviews (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expert_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
            duration_minutes INTEGER NOT NULL DEFAULT 30,
            status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
            meeting_link TEXT,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_interviews_project_id ON interviews(project_id);
        CREATE INDEX IF NOT EXISTS idx_interviews_client_id ON interviews(client_id);
        CREATE INDEX IF NOT EXISTS idx_interviews_expert_id ON interviews(expert_id);
        ALTER TABLE interviews ENABLE ROW LEVEL SECURITY
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255),
            message TEXT NOT NULL,
            link TEXT,
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS notification_preferences (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            project_matching BOOLEAN DEFAULT TRUE,
            match_threshold INTEGER DEFAULT 50,
            budget_min INTEGER DEFAULT 0,
            budget_max INTEGER DEFAULT 100000,
            preferred_skills TEXT[],
            preferred_project_types TEXT[],
            notification_frequency VARCHAR(20) DEFAULT 'immediate',
            email_enabled BOOLEAN DEFAULT TRUE,
            push_enabled BOOLEAN DEFAULT TRUE,
            project_updates BOOLEAN DEFAULT TRUE,
            messages BOOLEAN DEFAULT TRUE,
            payments BOOLEAN DEFAULT TRUE,
            marketing BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS project_applications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            expert_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            pitch TEXT,
            rate NUMERIC(12, 2),
            status VARCHAR(30) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(project_id, expert_id)
        );
        CREATE INDEX IF NOT EXISTS idx_project_applications_project ON project_applications(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_applications_expert ON project_applications(expert_id);
        ALTER TABLE project_applications ENABLE ROW LEVEL SECURITY
    `);

    await query(`
        ALTER TABLE project_tasks
            ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS transactions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
            sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
            recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
            amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
            type VARCHAR(50) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'completed',
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions(project_id, created_at DESC);
        ALTER TABLE transactions ENABLE ROW LEVEL SECURITY
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS project_members (
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(50) DEFAULT 'member',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(project_id, user_id)
        );
        CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
        ALTER TABLE project_members ENABLE ROW LEVEL SECURITY
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS escrow_accounts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount > 0),
            released_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (released_amount >= 0),
            platform_fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 10 CHECK (platform_fee_percent BETWEEN 0 AND 100),
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CHECK (released_amount <= total_amount)
        );
        CREATE INDEX IF NOT EXISTS idx_escrow_project ON escrow_accounts(project_id);
        ALTER TABLE escrow_accounts ENABLE ROW LEVEL SECURITY
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS payment_releases (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            escrow_account_id UUID NOT NULL REFERENCES escrow_accounts(id) ON DELETE CASCADE,
            milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
            amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
            platform_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
            expert_receives NUMERIC(15, 2) NOT NULL CHECK (expert_receives >= 0),
            requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
            approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'released', 'rejected')),
            requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            approved_at TIMESTAMP WITH TIME ZONE,
            released_at TIMESTAMP WITH TIME ZONE
        );
        CREATE INDEX IF NOT EXISTS idx_payment_releases_escrow ON payment_releases(escrow_account_id, requested_at DESC);
        ALTER TABLE payment_releases ENABLE ROW LEVEL SECURITY
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS invoices (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            invoice_number VARCHAR(50) UNIQUE NOT NULL,
            amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
            platform_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
            total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount > 0),
            issued_to UUID REFERENCES users(id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            paid_at TIMESTAMP WITH TIME ZONE
        );
        CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id, issued_at DESC);
        ALTER TABLE invoices ENABLE ROW LEVEL SECURITY
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
