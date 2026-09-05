const { query } = require('./db');

const addNotificationsTable = async () => {
    try {
        const text = `
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL, -- 'invite', 'payment', 'message', 'system'
                title VARCHAR(255) NOT NULL,
                message TEXT,
                link VARCHAR(255),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
            CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
            
            -- Re-use existing function update_updated_at_column if available, else standard triggers
            DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
            CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `;

        await query(text);
        console.log('✅ Notifications table added successfully');
    } catch (error) {
        console.error('❌ Error adding notifications table:', error);
        process.exit(1);
    }
};

addNotificationsTable();
