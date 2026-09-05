const { query } = require('../database/db');

// Create transaction
const createTransaction = async (data) => {
    const {
        projectId,
        contractId,
        senderId,
        recipientId,
        amount,
        type,
        status = 'completed', // Default pending? Or mock immediate? Let's use 'completed' for mock.
        description
    } = data;

    const text = `
        INSERT INTO transactions 
        (project_id, contract_id, sender_id, recipient_id, amount, type, status, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;
    const values = [projectId, contractId, senderId, recipientId, amount, type, status, description];

    const result = await query(text, values);
    return result.rows[0];
};

// Get transactions by project
const getTransactionsByProject = async (projectId) => {
    const text = `
        SELECT t.*, 
            s.name as sender_name, 
            r.name as recipient_name
        FROM transactions t
        JOIN users s ON t.sender_id = s.id
        JOIN users r ON t.recipient_id = r.id
        WHERE t.project_id = $1
        ORDER BY t.created_at DESC
    `;
    const result = await query(text, [projectId]);
    return result.rows;
};

// Get project balance (total escrowed - total released)
// Note: This is simple logic. Real escrow systems are complex.
const getProjectEscrowBalance = async (projectId) => {
    // Sum funding
    const fundText = `
        SELECT SUM(amount) as total
        FROM transactions
        WHERE project_id = $1 AND type = 'escrow_funding' AND status = 'completed'
    `;
    const fundResult = await query(fundText, [projectId]);
    const funded = parseFloat(fundResult.rows[0].total || 0);

    // Sum released
    const releaseText = `
        SELECT SUM(amount) as total
        FROM transactions
        WHERE project_id = $1 AND type = 'payment_release' AND status = 'completed'
    `;
    const releaseResult = await query(releaseText, [projectId]);
    const released = parseFloat(releaseResult.rows[0].total || 0);

    return funded - released;
};

module.exports = {
    createTransaction,
    getTransactionsByProject,
    getProjectEscrowBalance
};
