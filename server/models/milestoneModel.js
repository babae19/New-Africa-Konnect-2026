const { query } = require('../database/db');

/**
 * Create a new milestone
 */
const createMilestone = async (milestoneData) => {
    const { projectId, title, description, amount, dueDate } = milestoneData;

    const text = `
        INSERT INTO project_milestones (
            project_id, title, description, amount, due_date
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;

    const result = await query(text, [projectId, title, description, amount, dueDate]);
    return result.rows[0];
};

/**
 * Update milestone
 */
const updateMilestone = async (id, updates) => {
    const { title, description, amount, status, dueDate } = updates;

    const text = `
        UPDATE project_milestones
        SET 
            title = COALESCE($2, title),
            description = COALESCE($3, description),
            amount = COALESCE($4, amount),
            status = COALESCE($5, status),
            due_date = COALESCE($6, due_date),
            completed_at = CASE WHEN $5 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    `;

    const result = await query(text, [id, title, description, amount, status, dueDate]);
    return result.rows[0];
};

/**
 * Get project milestones
 */
const getProjectMilestones = async (projectId) => {
    const text = `
        SELECT * FROM project_milestones
        WHERE project_id = $1
        ORDER BY due_date ASC
    `;

    const result = await query(text, [projectId]);
    return result.rows;
};

/**
 * Delete milestone
 */
const deleteMilestone = async (id) => {
    const text = 'DELETE FROM project_milestones WHERE id = $1 RETURNING *';
    const result = await query(text, [id]);
    return result.rows[0];
};

module.exports = {
    createMilestone,
    updateMilestone,
    getProjectMilestones,
    deleteMilestone
};
