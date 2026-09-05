const { query } = require('./db');

const createTransactionsTable = async () => {
    try {
        const text = `
            CREATE TABLE IF NOT EXISTS transactions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
                sender_id UUID NOT NULL REFERENCES users(id),
                recipient_id UUID NOT NULL REFERENCES users(id),
                amount NUMERIC(10, 2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'USD',
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
                type VARCHAR(20) NOT NULL CHECK (type IN ('escrow_funding', 'payment_release', 'refund')),
                description TEXT,
                transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
            CREATE INDEX IF NOT EXISTS idx_transactions_sender_id ON transactions(sender_id);
            CREATE INDEX IF NOT EXISTS idx_transactions_recipient_id ON transactions(recipient_id);

            DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
            CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `;

        await query(text);
        console.log('Transactions table created successfully');
    } catch (error) {
        console.error('Error creating transactions table:', error);
    }
};

createTransactionsTable();
