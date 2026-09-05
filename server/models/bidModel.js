const { query } = require('../database/db');

// Create a new bid
const createBid = async (bidData) => {
    const {
        projectId,
        expertId,
        bidAmount,
        proposedTimeline,
        proposedDuration,
        coverLetter,
        portfolioLinks = []
    } = bidData;

    const text = `
        INSERT INTO project_bids 
        (project_id, expert_id, bid_amount, proposed_timeline, proposed_duration, cover_letter, portfolio_links)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;
    const values = [projectId, expertId, bidAmount, proposedTimeline, proposedDuration, coverLetter, portfolioLinks];

    const result = await query(text, values);
    return result.rows[0];
};

// Get bid by ID
const getBidById = async (bidId) => {
    const text = `
        SELECT 
            pb.*,
            u.name as expert_name,
            u.email as expert_email,
            ep.title as expert_title,
            ep.hourly_rate as expert_hourly_rate,
            ep.rating as expert_rating,
            ep.profile_image_url as expert_image,
            p.title as project_title
        FROM project_bids pb
        JOIN users u ON pb.expert_id = u.id
        LEFT JOIN expert_profiles ep ON u.id = ep.user_id
        JOIN projects p ON pb.project_id = p.id
        WHERE pb.id = $1
    `;
    const result = await query(text, [bidId]);
    return result.rows[0];
};

// Get all bids for a project
const getBidsByProject = async (projectId, filters = {}) => {
    let text = `
        SELECT 
            pb.*,
            u.name as expert_name,
            u.email as expert_email,
            ep.title as expert_title,
            ep.hourly_rate as expert_hourly_rate,
            ep.rating as expert_rating,
            ep.skills as expert_skills,
            ep.profile_image_url as expert_image,
            ep.completed_projects as expert_completed_projects
        FROM project_bids pb
        JOIN users u ON pb.expert_id = u.id
        LEFT JOIN expert_profiles ep ON u.id = ep.user_id
        WHERE pb.project_id = $1
    `;

    const values = [projectId];
    let paramCount = 2;

    if (filters.status) {
        text += ` AND pb.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
    }

    text += ' ORDER BY pb.created_at DESC';

    const result = await query(text, values);
    return result.rows;
};

// Get all bids by expert
const getBidsByExpert = async (expertId, filters = {}) => {
    let text = `
        SELECT 
            pb.*,
            p.title as project_title,
            p.description as project_description,
            p.budget as project_budget,
            p.status as project_status,
            p.open_for_bidding,
            u.name as client_name
        FROM project_bids pb
        JOIN projects p ON pb.project_id = p.id
        JOIN users u ON p.client_id = u.id
        WHERE pb.expert_id = $1
    `;

    const values = [expertId];
    let paramCount = 2;

    if (filters.status) {
        text += ` AND pb.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
    }

    text += ' ORDER BY pb.created_at DESC';

    const result = await query(text, values);
    return result.rows;
};

// Update bid status
const updateBidStatus = async (bidId, status) => {
    const text = `
        UPDATE project_bids
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
    `;
    const result = await query(text, [status, bidId]);
    return result.rows[0];
};

// Update bid
const updateBid = async (bidId, bidData) => {
    const {
        bidAmount,
        proposedTimeline,
        proposedDuration,
        coverLetter,
        portfolioLinks
    } = bidData;

    const text = `
        UPDATE project_bids
        SET 
            bid_amount = COALESCE($1, bid_amount),
            proposed_timeline = COALESCE($2, proposed_timeline),
            proposed_duration = COALESCE($3, proposed_duration),
            cover_letter = COALESCE($4, cover_letter),
            portfolio_links = COALESCE($5, portfolio_links),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
    `;
    const values = [bidAmount, proposedTimeline, proposedDuration, coverLetter, portfolioLinks, bidId];
    const result = await query(text, values);
    return result.rows[0];
};

// Delete bid (withdraw)
const deleteBid = async (bidId) => {
    const text = 'DELETE FROM project_bids WHERE id = $1 RETURNING *';
    const result = await query(text, [bidId]);
    return result.rows[0];
};

// Get bid count for project
const getBidCount = async (projectId) => {
    const text = 'SELECT COUNT(*) as count FROM project_bids WHERE project_id = $1 AND status = $2';
    const result = await query(text, [projectId, 'pending']);
    return parseInt(result.rows[0].count);
};

// Reject all other bids when one is accepted
const rejectOtherBids = async (projectId, acceptedBidId) => {
    const text = `
        UPDATE project_bids
        SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
        WHERE project_id = $1 AND id != $2 AND status = 'pending'
        RETURNING *
    `;
    const result = await query(text, [projectId, acceptedBidId]);
    return result.rows;
};

module.exports = {
    createBid,
    getBidById,
    getBidsByProject,
    getBidsByExpert,
    updateBidStatus,
    updateBid,
    deleteBid,
    getBidCount,
    rejectOtherBids
};
