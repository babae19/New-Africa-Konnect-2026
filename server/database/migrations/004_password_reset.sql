-- Add password reset fields to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

COMMENT ON COLUMN users.reset_token IS 'Token for password reset (single-use, time-limited)';
COMMENT ON COLUMN users.reset_token_expires IS 'Expiration time for reset token (1 hour from generation)';
