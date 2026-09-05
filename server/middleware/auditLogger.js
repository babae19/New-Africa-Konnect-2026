const { query } = require('../database/db');

/**
 * Audit log types
 */
const AUDIT_ACTIONS = {
    // Authentication
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILED: 'login_failed',
    LOGOUT: 'logout',
    REGISTER: 'register',
    PASSWORD_CHANGE: 'password_change',
    EMAIL_VERIFY: 'email_verify',

    // Authorization
    ACCESS_DENIED: 'access_denied',
    ROLE_ESCALATION_ATTEMPT: 'role_escalation_attempt',

    // Contracts
    CONTRACT_CREATE: 'contract_create',
    CONTRACT_SIGN: 'contract_sign',
    CONTRACT_UPDATE: 'contract_update',
    CONTRACT_STATUS_CHANGE: 'contract_status_change',

    // Payments
    ESCROW_FUND: 'escrow_fund',
    FUNDS_RELEASE: 'funds_release',
    PAYMENT_REFUND: 'payment_refund',

    // Projects
    PROJECT_CREATE: 'project_create',
    PROJECT_UPDATE: 'project_update',
    PROJECT_DELETE: 'project_delete',
    PROJECT_STATUS_CHANGE: 'project_status_change',

    // Admin
    USER_ROLE_CHANGE: 'user_role_change',
    EXPERT_VETTING_CHANGE: 'expert_vetting_change',
    USER_DELETE: 'user_delete',

    // Data Access
    SENSITIVE_DATA_ACCESS: 'sensitive_data_access',
    BULK_DATA_EXPORT: 'bulk_data_export'
};

/**
 * Create audit log entry
 */
const createAuditLog = async ({
    userId,
    userRole,
    action,
    resource,
    resourceId,
    ipAddress,
    userAgent,
    success = true,
    errorMessage = null,
    metadata = {}
}) => {
    try {
        const text = `
            INSERT INTO audit_logs (
                user_id, user_role, action, resource, resource_id,
                ip_address, user_agent, success, error_message, metadata
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const values = [
            userId,
            userRole,
            action,
            resource,
            resourceId,
            ipAddress,
            userAgent,
            success,
            errorMessage,
            JSON.stringify(metadata)
        ];

        const result = await query(text, values);
        return result.rows[0];
    } catch (error) {
        // Don't let audit logging failures break the application
        console.error('Audit logging error:', error);
        return null;
    }
};

/**
 * Middleware to automatically log certain actions
 */
const auditLog = (action, resource) => {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;
        const originalJson = res.json;

        // Override send to capture response
        res.send = function (data) {
            logAudit(req, res, action, resource, data);
            originalSend.call(this, data);
        };

        res.json = function (data) {
            logAudit(req, res, action, resource, data);
            originalJson.call(this, data);
        };

        next();
    };
};

/**
 * Helper to log audit entry
 */
const logAudit = async (req, res, action, resource, responseData) => {
    const success = res.statusCode >= 200 && res.statusCode < 400;
    const errorMessage = !success && responseData?.message ? responseData.message : null;

    await createAuditLog({
        userId: req.user?.id || null,
        userRole: req.user?.role || 'anonymous',
        action,
        resource,
        resourceId: req.params?.id || req.params?.projectId || null,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        success,
        errorMessage,
        metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
            statusCode: res.statusCode
        }
    });
};

/**
 * Log authentication events
 */
const logAuth = async (req, action, success, errorMessage = null) => {
    await createAuditLog({
        userId: req.user?.id || req.body?.email || null,
        userRole: req.user?.role || 'anonymous',
        action,
        resource: 'auth',
        resourceId: null,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        success,
        errorMessage,
        metadata: {
            email: req.body?.email
        }
    });
};

/**
 * Log authorization failures
 */
const logAuthorizationFailure = async (req, attemptedAction, requiredRole) => {
    await createAuditLog({
        userId: req.user?.id || null,
        userRole: req.user?.role || 'anonymous',
        action: AUDIT_ACTIONS.ACCESS_DENIED,
        resource: 'authorization',
        resourceId: null,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        success: false,
        errorMessage: `Access denied: ${attemptedAction}`,
        metadata: {
            attemptedAction,
            requiredRole,
            userRole: req.user?.role,
            path: req.path
        }
    });
};

/**
 * Get audit logs with filters
 */
const getAuditLogs = async (filters = {}) => {
    let text = `
        SELECT * FROM audit_logs
        WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.userId) {
        text += ` AND user_id = $${paramCount}`;
        values.push(filters.userId);
        paramCount++;
    }

    if (filters.action) {
        text += ` AND action = $${paramCount}`;
        values.push(filters.action);
        paramCount++;
    }

    if (filters.resource) {
        text += ` AND resource = $${paramCount}`;
        values.push(filters.resource);
        paramCount++;
    }

    if (filters.startDate) {
        text += ` AND timestamp >= $${paramCount}`;
        values.push(filters.startDate);
        paramCount++;
    }

    if (filters.endDate) {
        text += ` AND timestamp <= $${paramCount}`;
        values.push(filters.endDate);
        paramCount++;
    }

    if (filters.success !== undefined) {
        text += ` AND success = $${paramCount}`;
        values.push(filters.success);
        paramCount++;
    }

    text += ` ORDER BY timestamp DESC`;

    if (filters.limit) {
        text += ` LIMIT $${paramCount}`;
        values.push(filters.limit);
        paramCount++;
    }

    const result = await query(text, values);
    return result.rows;
};

module.exports = {
    AUDIT_ACTIONS,
    createAuditLog,
    auditLog,
    logAuth,
    logAuthorizationFailure,
    getAuditLogs
};
