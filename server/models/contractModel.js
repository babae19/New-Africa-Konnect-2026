const { query } = require('../database/db');

// Create a new contract
const createContract = async (contractData) => {
    const { projectId, expertId, clientId, terms, amount, status = 'pending' } = contractData;

    const text = `
        INSERT INTO contracts (project_id, expert_id, client_id, terms, amount, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;
    const values = [projectId, expertId, clientId, terms, amount, status];

    const result = await query(text, values);
    return result.rows[0];
};

// Get contract by ID
const getContractById = async (id) => {
    const text = `
        SELECT 
            c.*,
            p.title as project_title,
            e.name as expert_name,
            e.email as expert_email,
            cl.name as client_name,
            cl.email as client_email
        FROM contracts c
        JOIN projects p ON c.project_id = p.id
        JOIN users e ON c.expert_id = e.id
        JOIN users cl ON c.client_id = cl.id
        WHERE c.id = $1
    `;
    const result = await query(text, [id]);
    return result.rows[0];
};

// Get contracts by project ID
const getContractsByProject = async (projectId) => {
    const text = `
        SELECT 
            c.*,
            e.name as expert_name,
            e.email as expert_email
        FROM contracts c
        JOIN users e ON c.expert_id = e.id
        WHERE c.project_id = $1
        ORDER BY c.created_at DESC
    `;
    const result = await query(text, [projectId]);
    return result.rows;
};

// Get contracts by expert ID
const getContractsByExpert = async (expertId) => {
    const text = `
        SELECT 
            c.*,
            p.title as project_title,
            p.description as project_description,
            cl.name as client_name,
            cl.email as client_email
        FROM contracts c
        JOIN projects p ON c.project_id = p.id
        JOIN users cl ON c.client_id = cl.id
        WHERE c.expert_id = $1
        ORDER BY c.created_at DESC
    `;
    const result = await query(text, [expertId]);
    return result.rows;
};

// Get contracts by client ID
const getContractsByClient = async (clientId) => {
    const text = `
        SELECT 
            c.*,
            p.title as project_title,
            e.name as expert_name,
            e.email as expert_email
        FROM contracts c
        JOIN projects p ON c.project_id = p.id
        JOIN users e ON c.expert_id = e.id
        WHERE c.client_id = $1
        ORDER BY c.created_at DESC
    `;
    const result = await query(text, [clientId]);
    return result.rows;
};

// Update contract status
const updateContractStatus = async (id, status, metadata = null) => {
    let text;
    let values;
    let signedAtClause = "";

    if (status === 'signed') {
        signedAtClause = ", signed_at = CURRENT_TIMESTAMP";
    }

    if (metadata) {
        text = `
            UPDATE contracts 
            SET status = $1${signedAtClause},
                signature_metadata = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;
        values = [status, metadata, id];
    } else {
        text = `
            UPDATE contracts 
            SET status = $1${signedAtClause},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        values = [status, id];
    }

    const result = await query(text, values);
    return result.rows[0];
};

// Update contract
const updateContract = async (id, contractData) => {
    const { terms, amount, status } = contractData;

    const text = `
        UPDATE contracts 
        SET 
            terms = COALESCE($1, terms),
            amount = COALESCE($2, amount),
            status = COALESCE($3, status)
        WHERE id = $4
        RETURNING *
    `;
    const values = [terms, amount, status, id];
    const result = await query(text, values);
    return result.rows[0];
};

// Delete contract
const deleteContract = async (id) => {
    const text = 'DELETE FROM contracts WHERE id = $1 RETURNING *';
    const result = await query(text, [id]);
    return result.rows[0];
};

// Get contract count by status
const getContractCountByStatus = async (userId = null, role = null) => {
    let text = `
        SELECT status, COUNT(*) as count
        FROM contracts
    `;
    const values = [];

    if (userId && role === 'expert') {
        text += ' WHERE expert_id = $1';
        values.push(userId);
    } else if (userId && role === 'client') {
        text += ' WHERE client_id = $1';
        values.push(userId);
    }

    text += ' GROUP BY status';

    const result = await query(text, values);
    return result.rows;
};

module.exports = {
    createContract,
    getContractById,
    getContractsByProject,
    getContractsByExpert,
    getContractsByClient,
    updateContractStatus,
    updateContract,
    deleteContract,
    getContractCountByStatus
};
