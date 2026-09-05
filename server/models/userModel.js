const { query } = require('../database/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Create a new user
const createUser = async (userData) => {
    const { name, email, password, role = 'client' } = userData;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const text = `
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role, created_at, updated_at
    `;
    const values = [name, email, passwordHash, role];

    try {
        const result = await query(text, values);
        return result.rows[0];
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            throw new Error('User with this email already exists');
        }
        throw error;
    }
};

// Find user by email
const findUserByEmail = async (email) => {
    const text = 'SELECT id, name, email, password_hash, role, profile_image_url, bio, created_at, updated_at FROM users WHERE email = $1';
    const result = await query(text, [email]);
    return result.rows[0];
};

// Find user by ID
const findUserById = async (id) => {
    const text = 'SELECT id, email, password_hash, name, role, profile_image_url, bio, created_at FROM users WHERE id = $1';
    const result = await query(text, [id]);
    return result.rows[0];
};

// Update user
const updateUser = async (id, userData) => {
    const { name, email, role, profileImageUrl, profile_image_url, bio } = userData;
    // Map both camelCase and snake_case for profileImageUrl
    const finalImageUrl = profile_image_url || profileImageUrl;

    const text = `
        UPDATE users 
        SET 
            name = COALESCE($1, name),
            email = COALESCE($2, email),
            role = COALESCE($3, role),
            profile_image_url = COALESCE($4, profile_image_url),
            bio = COALESCE($5, bio),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, name, email, role, profile_image_url, bio
    `;
    const values = [name, email, role, finalImageUrl, bio, id];
    const result = await query(text, values);
    return result.rows[0];
};

// Verify password
const verifyPassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

// Delete user
const deleteUser = async (id) => {
    const text = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await query(text, [id]);
    return result.rows[0];
};

// Get all users with optional role filter
const getAllUsers = async (role = null) => {
    let text = 'SELECT id, name, email, role, created_at, updated_at FROM users';
    const values = [];

    if (role) {
        text += ' WHERE role = $1';
        values.push(role);
    }

    text += ' ORDER BY created_at DESC';

    const result = await query(text, values);
    return result.rows;
};

// Generate verification token
const generateVerificationToken = async (userId) => {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const text = `
        UPDATE users 
        SET verification_token = $1, verification_token_expires = $2
        WHERE id = $3
        RETURNING id, email, name
    `;
    const result = await query(text, [token, expires, userId]);
    return { user: result.rows[0], token };
};

// Verify email with token
const verifyEmail = async (token) => {
    const text = `
        UPDATE users 
        SET email_verified = TRUE, 
            verification_token = NULL, 
            verification_token_expires = NULL
        WHERE verification_token = $1 
        AND verification_token_expires > NOW()
        RETURNING id, name, email, role
    `;
    const result = await query(text, [token]);

    if (result.rows.length === 0) {
        throw new Error('Invalid or expired verification token');
    }

    return result.rows[0];
};

// Update last login
const updateLastLogin = async (userId) => {
    const text = `
        UPDATE users 
        SET last_login = NOW(), 
            login_count = login_count + 1
        WHERE id = $1
        RETURNING id
    `;
    await query(text, [userId]);
};

// Create session
const createSession = async (userId, tokenData, metadata = {}) => {
    const { token, refreshToken, expiresAt } = tokenData;
    const { ipAddress, userAgent } = metadata;

    const text = `
        INSERT INTO user_sessions (user_id, token, refresh_token, ip_address, user_agent, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;
    const values = [userId, token, refreshToken, ipAddress, userAgent, expiresAt];
    const result = await query(text, values);
    return result.rows[0];
};

// Get active sessions
const getActiveSessions = async (userId) => {
    const text = `
        SELECT id, ip_address, user_agent, created_at, last_activity, expires_at
        FROM user_sessions 
        WHERE user_id = $1 AND expires_at > NOW()
        ORDER BY last_activity DESC
    `;
    const result = await query(text, [userId]);
    return result.rows;
};

// Update session activity
const updateSessionActivity = async (token) => {
    const text = `
        UPDATE user_sessions 
        SET last_activity = NOW()
        WHERE token = $1
        RETURNING id
    `;
    await query(text, [token]);
};

// Revoke session
const revokeSession = async (sessionId, userId) => {
    const text = `
        DELETE FROM user_sessions 
        WHERE id = $1 AND user_id = $2
        RETURNING id
    `;
    const result = await query(text, [sessionId, userId]);
    return result.rows[0];
};

// Revoke all sessions except current (or all if currentSessionId is null)
const revokeOtherSessions = async (userId, currentSessionId) => {
    let text;
    let values;

    if (currentSessionId) {
        // Revoke all except current
        text = `
            DELETE FROM user_sessions 
            WHERE user_id = $1 AND id != $2
            RETURNING id
        `;
        values = [userId, currentSessionId];
    } else {
        // Revoke ALL sessions (used during logout)
        text = `
            DELETE FROM user_sessions 
            WHERE user_id = $1
            RETURNING id
        `;
        values = [userId];
    }

    const result = await query(text, values);
    return result.rows;
};

// Find session by token
const findSessionByToken = async (token) => {
    const text = `
        SELECT id, user_id, last_activity, expires_at
        FROM user_sessions 
        WHERE token = $1 AND expires_at > NOW()
    `;
    const result = await query(text, [token]);
    return result.rows[0];
};

// Revoke session by token
const revokeSessionByToken = async (token) => {
    const text = 'DELETE FROM user_sessions WHERE token = $1 RETURNING id';
    const result = await query(text, [token]);
    return result.rows[0];
};

// Clean up expired sessions
const cleanupExpiredSessions = async () => {
    const text = 'DELETE FROM user_sessions WHERE expires_at < NOW()';
    const result = await query(text);
    return result.rowCount;
};

// Generate password reset token
const generatePasswordResetToken = async (userId) => {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const text = `
        UPDATE users 
        SET reset_token = $1, reset_token_expires = $2
        WHERE id = $3
        RETURNING id, email, name
    `;
    const result = await query(text, [token, expires, userId]);
    return { user: result.rows[0], token };
};

// Verify password reset token
const verifyPasswordResetToken = async (token) => {
    const text = `
        SELECT id, email, name, role
        FROM users 
        WHERE reset_token = $1 
        AND reset_token_expires > NOW()
    `;
    const result = await query(text, [token]);

    if (result.rows.length === 0) {
        throw new Error('Invalid or expired reset token');
    }

    return result.rows[0];
};

// Update password
const updatePassword = async (userId, newPassword) => {
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const text = `
        UPDATE users 
        SET password_hash = $1, 
            reset_token = NULL, 
            reset_token_expires = NULL
        WHERE id = $2
        RETURNING id
    `;
    await query(text, [passwordHash, userId]);
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    updateUser,
    verifyPassword,
    deleteUser,
    getAllUsers,
    generateVerificationToken,
    verifyEmail,
    updateLastLogin,
    createSession,
    getActiveSessions,
    updateSessionActivity,
    revokeSession,
    revokeOtherSessions,
    cleanupExpiredSessions,
    generatePasswordResetToken,
    verifyPasswordResetToken,
    updatePassword,
    findSessionByToken,
    revokeSessionByToken,
    // Aliases for compatibility
    getUserById: findUserById,
    getUserByEmail: findUserByEmail
};
