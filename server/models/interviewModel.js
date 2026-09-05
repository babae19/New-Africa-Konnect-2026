const { query } = require('../database/db');

// Schedule an interview
const createInterview = async (data) => {
    const { projectId, clientId, expertId, scheduledAt, durationMinutes, meetingLink, notes } = data;

    const text = `
        INSERT INTO interviews (project_id, client_id, expert_id, scheduled_at, duration_minutes, meeting_link, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;
    const values = [projectId, clientId, expertId, scheduledAt, durationMinutes || 30, meetingLink, notes];

    const result = await query(text, values);
    return result.rows[0];
};

// Get interviews by project
const getInterviewsByProject = async (projectId) => {
    const text = `
        SELECT i.*, 
               u.name as expert_name, 
               u.email as expert_email,
               u.profile_image_url
        FROM interviews i
        JOIN users u ON i.expert_id = u.id
        WHERE i.project_id = $1
        ORDER BY i.scheduled_at ASC
    `;
    const result = await query(text, [projectId]);
    return result.rows;
};

// Get interviews by user (expert or client)
const getInterviewsByUser = async (userId, role) => {
    let column = role === 'client' ? 'client_id' : 'expert_id';

    // Join with other party info
    let joinTable = role === 'client' ? 'users expert ON i.expert_id = expert.id' : 'users client ON i.client_id = client.id';
    let selectFields = role === 'client'
        ? 'expert.name as other_party_name, expert.email as other_party_email'
        : 'client.name as other_party_name, client.email as other_party_email';

    const text = `
        SELECT i.*, p.title as project_title, ${selectFields}
        FROM interviews i
        JOIN projects p ON i.project_id = p.id
        JOIN ${joinTable}
        WHERE i.${column} = $1
        ORDER BY i.scheduled_at ASC
    `;
    const result = await query(text, [userId]);
    return result.rows;
};

// Update interview status
const updateInterviewStatus = async (id, status) => {
    const text = `
        UPDATE interviews
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
    `;
    const result = await query(text, [status, id]);
    return result.rows[0];
};

// Create interview for bid (links to project_interviews table)
const createBidInterview = async (data) => {
    const { projectId, expertId, bidId, scheduledTime, duration, meetingLink, meetingPlatform, clientNotes } = data;

    const text = `
        INSERT INTO project_interviews 
        (project_id, expert_id, bid_id, scheduled_time, duration, meeting_link, meeting_platform, client_notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;
    const values = [projectId, expertId, bidId, scheduledTime, duration || 30, meetingLink, meetingPlatform, clientNotes];

    const result = await query(text, values);
    return result.rows[0];
};

// Get bid interviews by project
const getBidInterviewsByProject = async (projectId) => {
    const text = `
        SELECT 
            pi.*,
            u.name as expert_name,
            u.email as expert_email,
            ep.profile_image_url as expert_image,
            pb.bid_amount
        FROM project_interviews pi
        JOIN users u ON pi.expert_id = u.id
        LEFT JOIN expert_profiles ep ON u.id = ep.user_id
        LEFT JOIN project_bids pb ON pi.bid_id = pb.id
        WHERE pi.project_id = $1
        ORDER BY pi.scheduled_time ASC
    `;
    const result = await query(text, [projectId]);
    return result.rows;
};

// Update bid interview
const updateBidInterview = async (id, updateData) => {
    const { scheduledTime, duration, meetingLink, status, outcome } = updateData;

    const text = `
        UPDATE project_interviews
        SET 
            scheduled_time = COALESCE($1, scheduled_time),
            duration = COALESCE($2, duration),
            meeting_link = COALESCE($3, meeting_link),
            status = COALESCE($4, status),
            outcome = COALESCE($5, outcome),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
    `;
    const values = [scheduledTime, duration, meetingLink, status, outcome, id];
    const result = await query(text, values);
    return result.rows[0];
};

module.exports = {
    createInterview,
    getInterviewsByProject,
    getInterviewsByUser,
    updateInterviewStatus,
    createBidInterview,
    getBidInterviewsByProject,
    updateBidInterview
};
