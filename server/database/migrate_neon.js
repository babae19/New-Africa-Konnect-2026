const fs = require('fs');
const path = require('path');
const { pool, query } = require('./db');

async function runMigrations() {
    try {
        console.log('🔌 Connecting to Neon Database...');

        // 1. Read and Execute Core Schema
        console.log('📄 Reading schema.sql...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('🚀 Executing Core Schema...');
        await query(schemaSql);
        console.log('✅ Core Schema Applied.');

        // 2. Execute Feature Schemas (Interviews, Proposals, etc.)
        // These might be redundant if I add them to schema.sql, but for safe migration:

        /* Proposals / Applications Table */
        console.log('📄 Setting up Proposals/Applications...');
        await query(`
            CREATE TABLE IF NOT EXISTS project_applications (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
                expert_id UUID REFERENCES users(id) ON DELETE CASCADE,
                pitch TEXT,
                rate NUMERIC(10, 2),
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(project_id, expert_id)
            );
        `);
        console.log('✅ Proposals Table Applied.');

        /* Interviews Table */
        console.log('📄 Setting up Interviews...');
        await query(`
             CREATE TABLE IF NOT EXISTS interviews (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
                client_id UUID REFERENCES users(id) ON DELETE CASCADE,
                expert_id UUID REFERENCES users(id) ON DELETE CASCADE,
                scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
                duration_minutes INTEGER DEFAULT 30,
                status VARCHAR(50) DEFAULT 'scheduled',
                meeting_link TEXT,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('✅ Interviews Table Applied.');

        /* Payment/Escrow Tables (if not in schema.sql) */
        console.log('📄 Setting up Escrow & Payments...');
        await query(`
            CREATE TABLE IF NOT EXISTS escrow_accounts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
                released_amount NUMERIC(10, 2) DEFAULT 0.00,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'funded', 'released', 'disputed')),
                platform_fee_percent DECIMAL(5, 2) DEFAULT 5.00,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS payment_releases (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                escrow_account_id UUID REFERENCES escrow_accounts(id) ON DELETE CASCADE,
                milestone_id VARCHAR(255), -- Optional link to milestone
                amount NUMERIC(10, 2) NOT NULL,
                platform_fee NUMERIC(10, 2) DEFAULT 0.00,
                expert_receives NUMERIC(10, 2) NOT NULL,
                requested_by UUID REFERENCES users(id),
                approved_by UUID REFERENCES users(id),
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
             CREATE TABLE IF NOT EXISTS invoices (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                project_id UUID REFERENCES projects(id),
                invoice_number VARCHAR(50) UNIQUE,
                amount NUMERIC(10, 2),
                status VARCHAR(20) DEFAULT 'paid',
                issued_to UUID REFERENCES users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('✅ Payment Tables Applied.');

        console.log('🎉 Full Migration Completed Successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }
}

runMigrations();
