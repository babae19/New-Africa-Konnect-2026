const { query } = require('../database/db');

/**
 * Log activity to feed
 */
const logActivity = async (projectId, userId, actionType, actionData) => {
    const text = `
        INSERT INTO activity_feed (
            project_id, user_id, action_type, action_data
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;

    // Simplify data if it's too large? For now store as is.
    const result = await query(text, [projectId, userId, actionType, JSON.stringify(actionData)]);
    return result.rows[0];
};

/**
 * Get project activity feed
 */
const getProjectActivity = async (projectId, limit = 50, offset = 0) => {
    const text = `
        SELECT a.*, u.name as user_name, u.email as user_email
        FROM activity_feed a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.project_id = $1
        ORDER BY a.created_at DESC
        LIMIT $2 OFFSET $3
    `;

    const result = await query(text, [projectId, limit, offset]);
    return result.rows;
};

module.exports = {
    logActivity,
    getProjectActivity
};
