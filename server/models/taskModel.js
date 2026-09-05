const { query } = require('../database/db');

// Create task
const createTask = async (taskData) => {
    const { projectId, title, description, status, priority, assignedTo, createdBy, dueDate } = taskData;

    const text = `
        INSERT INTO project_tasks (project_id, title, description, status, priority, assigned_to, created_by, due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;

    const values = [
        projectId,
        title,
        description,
        status || 'todo',
        priority || 'medium',
        assignedTo,
        createdBy,
        dueDate
    ];

    const result = await query(text, values);
    return result.rows[0];
};

// Get tasks by project
const getTasksByProject = async (projectId) => {
    const text = `
        SELECT t.*, u.name as assignee_name, u.email as assignee_email
        FROM project_tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.project_id = $1 
        ORDER BY t.created_at DESC
    `;
    const result = await query(text, [projectId]);
    return result.rows;
};

// Update task
const updateTask = async (id, taskData) => {
    // Build dynamic update query
    const allowedUpdates = ['title', 'description', 'status', 'priority', 'assignedTo', 'dueDate'];
    const updates = [];
    const values = [id];
    let count = 2; // Start from 2 because $1 is id

    // Map camelCase to snake_case for DB columns
    const columnMap = {
        assignedTo: 'assigned_to',
        dueDate: 'due_date'
    };

    Object.keys(taskData).forEach(key => {
        if (allowedUpdates.includes(key) && taskData[key] !== undefined) {
            const dbColumn = columnMap[key] || key;
            updates.push(`${dbColumn} = $${count}`);
            values.push(taskData[key]);
            count++;
        }
    });

    if (updates.length === 0) return null;

    const text = `
        UPDATE project_tasks 
        SET ${updates.join(', ')} 
        WHERE id = $1 
        RETURNING *
    `;

    const result = await query(text, values);
    return result.rows[0];
};

// Delete task
const deleteTask = async (id) => {
    const text = 'DELETE FROM project_tasks WHERE id = $1 RETURNING *';
    const result = await query(text, [id]);
    return result.rows[0];
};

module.exports = {
    createTask,
    getTasksByProject,
    updateTask,
    deleteTask
};
