const { query } = require('../database/db');

// Create a new project
const createProject = async (projectData) => {
    const { clientId, title, description, budget, status = 'draft', techStack, min_budget, max_budget, duration, open_for_bidding, bidding_deadline, deadline } = projectData;

    const text = `
        INSERT INTO projects (client_id, title, description, budget, status, tech_stack, min_budget, max_budget, duration, open_for_bidding, bidding_deadline, deadline)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
    `;
    const values = [clientId, title, description, budget, status, techStack, min_budget, max_budget, duration, open_for_bidding, bidding_deadline, deadline];

    const result = await query(text, values);
    return result.rows[0];
};

// Get project by ID
const getProjectById = async (id) => {
    const text = `
        SELECT p.*, 
               u.name as client_name, 
               u.email as client_email,
               e.name as selected_expert_name,
               e.email as selected_expert_email,
               e.id as selected_expert_id
        FROM projects p
        JOIN users u ON p.client_id = u.id
        LEFT JOIN users e ON p.selected_expert_id = e.id
        WHERE p.id = $1
    `;
    const result = await query(text, [id]);
    return result.rows[0];
};

// Get all projects by client ID
const getProjectsByClient = async (clientId) => {
    const text = `
        SELECT * FROM projects
        WHERE client_id = $1
        ORDER BY created_at DESC
    `;
    const result = await query(text, [clientId]);
    return result.rows;
};

// Get all projects with optional filters
const getAllProjects = async (filters = {}) => {
    let text = `
        SELECT p.*, u.name as client_name, u.email as client_email
        FROM projects p
        JOIN users u ON p.client_id = u.id
        WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    // Filter by status
    if (filters.status) {
        text += ` AND p.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
    }

    // Filter by budget range
    if (filters.minBudget) {
        text += ` AND p.budget >= $${paramCount}`;
        values.push(filters.minBudget);
        paramCount++;
    }

    if (filters.maxBudget) {
        text += ` AND p.budget <= $${paramCount}`;
        values.push(filters.maxBudget);
        paramCount++;
    }

    // Search by title or description
    if (filters.search) {
        text += ` AND (p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
        values.push(`%${filters.search}%`);
        paramCount++;
    }

    text += ' ORDER BY p.created_at DESC';

    // Pagination
    if (filters.limit) {
        text += ` LIMIT $${paramCount}`;
        values.push(filters.limit);
        paramCount++;
    }

    if (filters.offset) {
        text += ` OFFSET $${paramCount}`;
        values.push(filters.offset);
        paramCount++;
    }

    const result = await query(text, values);
    return result.rows;
};

// Update project
const updateProject = async (id, projectData) => {
    const { title, description, budget, status, techStack, min_budget, max_budget, open_for_bidding, bidding_deadline, duration, visibility, selectedExpertId, expertStatus } = projectData;

    const text = `
        UPDATE projects 
        SET 
            title = COALESCE($1, title),
            description = COALESCE($2, description),
            budget = COALESCE($3, budget),
            status = COALESCE($4, status),
            tech_stack = COALESCE($5, tech_stack),
            min_budget = COALESCE($6, min_budget),
            max_budget = COALESCE($7, max_budget),
            open_for_bidding = COALESCE($8, open_for_bidding),
            bidding_deadline = COALESCE($9, bidding_deadline),
            duration = COALESCE($10, duration),
            visibility = COALESCE($11, visibility),
            selected_expert_id = COALESCE($12, selected_expert_id),
            expert_status = COALESCE($13, expert_status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $14
        RETURNING *
    `;
    const values = [title, description, budget, status, techStack, min_budget, max_budget, open_for_bidding, bidding_deadline, duration, visibility, selectedExpertId, expertStatus, id];
    const result = await query(text, values);
    return result.rows[0];
};

// Delete project
const deleteProject = async (id) => {
    const text = 'DELETE FROM projects WHERE id = $1 RETURNING *';
    const result = await query(text, [id]);
    return result.rows[0];
};

const updateCompletionWorkflow = async (projectId, action, userId) => {
    const updates = {
        accept_delivery: `delivery_accepted_at = CURRENT_TIMESTAMP, finalized_at = CURRENT_TIMESTAMP,
                          status = 'completed', state = 'completed'`,
        request_deletion: `deletion_requested_at = CURRENT_TIMESTAMP, deletion_requested_by = $2,
                           deletion_consented_at = NULL, deletion_consented_by = NULL`,
        consent_deletion: `deletion_consented_at = CURRENT_TIMESTAMP, deletion_consented_by = $2`
    };
    if (!updates[action]) throw new Error('Invalid completion action');
    const result = await query(
        `UPDATE projects SET ${updates[action]}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [projectId, userId]
    );
    return result.rows[0];
};

// Get project count by status
const getProjectCountByStatus = async (clientId = null) => {
    let text = `
        SELECT status, COUNT(*) as count
        FROM projects
    `;
    const values = [];

    if (clientId) {
        text += ' WHERE client_id = $1';
        values.push(clientId);
    }

    text += ' GROUP BY status';

    const result = await query(text, values);
    return result.rows;
};

// Get projects with contracts
const getProjectsWithContracts = async (clientId) => {
    const text = `
        SELECT 
            p.*,
            json_agg(
                json_build_object(
                    'id', c.id,
                    'expert_id', c.expert_id,
                    'amount', c.amount,
                    'status', c.status,
                    'created_at', c.created_at
                )
            ) FILTER (WHERE c.id IS NOT NULL) as contracts
        FROM projects p
        LEFT JOIN contracts c ON p.id = c.project_id
        WHERE p.client_id = $1
        GROUP BY p.id
        ORDER BY p.created_at DESC
    `;
    const result = await query(text, [clientId]);
    return result.rows;
};


// Assign expert to project
const assignExpert = async (projectId, expertId) => {
    const text = `
        UPDATE projects
        SET selected_expert_id = $1, expert_status = 'pending'
        WHERE id = $2
        RETURNING *
    `;
    const result = await query(text, [expertId, projectId]);
    return result.rows[0];
};

// Update expert status
const updateExpertStatus = async (projectId, status) => {
    const text = `
        UPDATE projects
        SET expert_status = $1,
            status = CASE WHEN $1 = 'accepted' THEN 'active' ELSE status END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
    `;
    const result = await query(text, [status, projectId]);
    return result.rows[0];
};

// Get projects invited expert
const getProjectsByExpert = async (expertId) => {
    const text = `
        SELECT p.*, u.name as client_name, u.email as client_email
        FROM projects p
        JOIN users u ON p.client_id = u.id
        WHERE p.selected_expert_id = $1
        ORDER BY p.updated_at DESC
    `;
    const result = await query(text, [expertId]);
    return result.rows;
};

// Add member to project
const addMember = async (projectId, userId, role = 'member') => {
    const text = `
        INSERT INTO project_members (project_id, user_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3
        RETURNING *
    `;
    const result = await query(text, [projectId, userId, role]);
    return result.rows[0];
};

// Remove member from project
const removeMember = async (projectId, userId) => {
    const text = `
        DELETE FROM project_members
        WHERE project_id = $1 AND user_id = $2
        RETURNING *
    `;
    const result = await query(text, [projectId, userId]);
    return result.rows[0];
};

// Get project members
const getProjectMembers = async (projectId) => {
    const text = `
        SELECT pm.*, u.name, u.email, u.profile_image_url
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = $1
    `;
    const result = await query(text, [projectId]);
    return result.rows;
};

// Check if user is member
const isMember = async (projectId, userId) => {
    const text = `
        SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2
    `;
    const result = await query(text, [projectId, userId]);
    return result.rowCount > 0;
};

// Find existing inquiry between client and expert
const findExistingInquiry = async (clientId, expertId) => {
    const text = `
        SELECT * FROM projects
        WHERE client_id = $1 AND selected_expert_id = $2 AND status = 'draft'
        ORDER BY created_at DESC
        LIMIT 1
    `;
    const result = await query(text, [clientId, expertId]);
    return result.rows[0];
};

module.exports = {
    createProject,
    getProjectById,
    getProjectsByClient,
    getAllProjects,
    updateProject,
    deleteProject,
    updateCompletionWorkflow,
    getProjectCountByStatus,
    getProjectsWithContracts,
    assignExpert,
    updateExpertStatus,
    getProjectsByExpert,
    addMember,
    removeMember,
    getProjectMembers,
    isMember,
    findExistingInquiry
};
