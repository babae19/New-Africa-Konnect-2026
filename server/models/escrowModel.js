const { query } = require('../database/db');

/**
 * Create escrow account
 */
const createEscrowAccount = async (projectId, totalAmount, platformFeePercent = 10.00) => {
    const text = `
        INSERT INTO escrow_accounts (
            project_id, total_amount, platform_fee_percent, status
        )
        VALUES ($1, $2, $3, 'active')
        RETURNING *
    `;
    const result = await query(text, [projectId, totalAmount, platformFeePercent]);
    return result.rows[0];
};

/**
 * Get escrow account by project
 */
const getEscrowByProject = async (projectId) => {
    const text = `
        SELECT * FROM escrow_accounts
        WHERE project_id = $1
    `;
    const result = await query(text, [projectId]);
    return result.rows[0];
};

/**
 * Update escrow balance (e.g. after release)
 */
const updateEscrowBalance = async (id, releasedAmount) => {
    const text = `
        UPDATE escrow_accounts
        SET 
            released_amount = released_amount + $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    `;
    const result = await query(text, [id, releasedAmount]);
    return result.rows[0];
};

module.exports = {
    createEscrowAccount,
    getEscrowByProject,
    updateEscrowBalance
};
