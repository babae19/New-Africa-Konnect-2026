const { query } = require('../database/db');

/**
 * Create payment release request
 */
const createReleaseRequest = async (releaseData) => {
    const { escrowAccountId, milestoneId, amount, platformFee, expertReceives, requestedBy } = releaseData;

    const text = `
        INSERT INTO payment_releases (
            escrow_account_id, milestone_id, amount, platform_fee, 
            expert_receives, requested_by, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        RETURNING *
    `;

    const result = await query(text, [
        escrowAccountId, milestoneId, amount, platformFee, expertReceives, requestedBy
    ]);
    return result.rows[0];
};

/**
 * Approve payment release
 */
const approveRelease = async (id, approvedBy) => {
    const text = `
        UPDATE payment_releases
        SET 
            status = 'approved',
            approved_by = $2,
            approved_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    `;
    const result = await query(text, [id, approvedBy]);
    return result.rows[0];
};

/**
 * Mark release as processed/released
 */
const markAsReleased = async (id) => {
    const text = `
        UPDATE payment_releases
        SET 
            status = 'released',
            released_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    `;
    const result = await query(text, [id]);
    return result.rows[0];
};

/**
 * Get releases for an escrow account
 */
const getReleasesByEscrow = async (escrowAccountId) => {
    const text = `
        SELECT r.*, m.title as milestone_title
        FROM payment_releases r
        LEFT JOIN project_milestones m ON r.milestone_id = m.id
        WHERE r.escrow_account_id = $1
        ORDER BY r.requested_at DESC
    `;
    const result = await query(text, [escrowAccountId]);
    return result.rows;
};

module.exports = {
    createReleaseRequest,
    approveRelease,
    markAsReleased,
    getReleasesByEscrow
};
