-- Audit Logs Table Migration
-- This table tracks all critical security and business events

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    metadata JSONB
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action, timestamp DESC);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for security and compliance monitoring';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of the user who performed the action (null for anonymous)';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., login_success, contract_sign)';
COMMENT ON COLUMN audit_logs.resource IS 'Resource type affected (e.g., auth, contract, payment)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the specific resource affected';
COMMENT ON COLUMN audit_logs.success IS 'Whether the action succeeded or failed';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context about the action (JSON format)';
