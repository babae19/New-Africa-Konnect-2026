const { query } = require('../database/db');

// Create a new application
const createApplication = async (data) => {
    const { projectId, expertId, pitch, rate } = data;

    // Check if already applied
    const existing = await query(
        'SELECT * FROM project_applications WHERE project_id = $1 AND expert_id = $2',
        [projectId, expertId]
    );

    if (existing.rows.length > 0) {
        throw new Error('You have already applied to this project');
    }

    const text = `
        INSERT INTO project_applications (project_id, expert_id, pitch, rate, status)
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING *
    `;
    const values = [projectId, expertId, pitch, rate];

    const result = await query(text, values);
    return result.rows[0];
};

// Get applications by project (for Client)
const getApplicationsByProject = async (projectId) => {
    const text = `
        SELECT pa.*, 
               u.name as expert_name, 
               u.email as expert_email,
               u.profile_image_url
               -- potentially join with expert_profiles for more info
        FROM project_applications pa
        JOIN users u ON pa.expert_id = u.id
        WHERE pa.project_id = $1
        ORDER BY pa.created_at DESC
    `;
    const result = await query(text, [projectId]);
    return result.rows;
};

// Get applications by expert (for Expert)
const getApplicationsByExpert = async (expertId) => {
    const text = `
        SELECT pa.*, 
               p.title as project_title, 
               p.budget as project_budget,
               u.name as client_name
        FROM project_applications pa
        JOIN projects p ON pa.project_id = p.id
        JOIN users u ON p.client_id = u.id
        WHERE pa.expert_id = $1
        ORDER BY pa.created_at DESC
    `;
    const result = await query(text, [expertId]);
    return result.rows;
};

// Update application status
const updateApplicationStatus = async (id, status) => {
    const text = `
        UPDATE project_applications
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
    `;
    const result = await query(text, [status, id]);
    return result.rows[0];
};

module.exports = {
    createApplication,
    getApplicationsByProject,
    getApplicationsByExpert,
    updateApplicationStatus
};
