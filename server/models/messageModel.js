const { query } = require('../database/db');

// Create a new message
const createMessage = async (messageData) => {
    const { projectId, senderId, receiverId, content } = messageData;

    const text = `
        INSERT INTO messages (project_id, sender_id, receiver_id, content)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const values = [projectId || null, senderId, receiverId || null, content];

    const result = await query(text, values);
    return result.rows[0];
};

// Get messages by project ID
const getMessagesByProject = async (projectId, limit = 100, offset = 0) => {
    const text = `
        SELECT 
            m.*,
            u.name as sender_name,
            u.email as sender_email,
            u.role as sender_role,
            u.profile_image_url as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.project_id = $1
        ORDER BY m.created_at ASC
        LIMIT $2 OFFSET $3
    `;
    const result = await query(text, [projectId, limit, offset]);
    return result.rows;
};

// Get message by ID
const getMessageById = async (id) => {
    const text = `
        SELECT 
            m.*,
            u.name as sender_name,
            u.email as sender_email,
            u.profile_image_url as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = $1
    `;
    const result = await query(text, [id]);
    return result.rows[0];
};

// Mark message as read
const markAsRead = async (messageId) => {
    const text = `
        UPDATE messages 
        SET is_read = true
        WHERE id = $1
        RETURNING *
    `;
    const result = await query(text, [messageId]);
    return result.rows[0];
};

// Mark all messages in a project as read for a user
const markProjectMessagesAsRead = async (projectId, userId) => {
    const text = `
        UPDATE messages 
        SET is_read = true
        WHERE project_id = $1 AND sender_id != $2 AND is_read = false
        RETURNING *
    `;
    const result = await query(text, [projectId, userId]);
    return result.rows;
};

// Get unread message count for a project
const getUnreadCount = async (projectId, userId) => {
    const text = `
        SELECT COUNT(*) as unread_count
        FROM messages
        WHERE project_id = $1 AND sender_id != $2 AND is_read = false
    `;
    const result = await query(text, [projectId, userId]);
    return parseInt(result.rows[0].unread_count);
};

// Get all unread messages for a user across all projects
const getAllUnreadMessages = async (userId) => {
    const text = `
        SELECT 
            m.*,
            u.name as sender_name,
            p.title as project_title
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        JOIN projects p ON m.project_id = p.id
        WHERE m.sender_id != $1 AND m.is_read = false
        AND (p.client_id = $1 OR EXISTS (
            SELECT 1 FROM contracts c 
            WHERE c.project_id = p.id AND c.expert_id = $1
        ))
        ORDER BY m.created_at DESC
    `;
    const result = await query(text, [userId]);
    return result.rows;
};

// Delete message
const deleteMessage = async (id) => {
    const text = 'DELETE FROM messages WHERE id = $1 RETURNING *';
    const result = await query(text, [id]);
    return result.rows[0];
};

// Delete all messages for a project
const deleteProjectMessages = async (projectId) => {
    const text = 'DELETE FROM messages WHERE project_id = $1 RETURNING *';
    const result = await query(text, [projectId]);
    return result.rows;
};

// Get direct messages between two users
const getDirectMessages = async (user1Id, user2Id, limit = 100, offset = 0) => {
    const text = `
        SELECT 
            m.*,
            u.name as sender_name,
            u.email as sender_email,
            u.role as sender_role,
            u.profile_image_url as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.project_id IS NULL AND (
            (m.sender_id = $1 AND m.receiver_id = $2) OR 
            (m.sender_id = $2 AND m.receiver_id = $1)
        )
        ORDER BY m.created_at ASC
        LIMIT $3 OFFSET $4
    `;
    const result = await query(text, [user1Id, user2Id, limit, offset]);
    return result.rows;
};

// Get all unique users who have exchanged direct messages with the current user
const getDirectChatUsers = async (userId) => {
    const text = `
        SELECT DISTINCT ON (u.id)
            u.id,
            u.name,
            u.email,
            u.role,
            u.profile_image_url,
            m.content as last_message,
            m.created_at as last_message_time
        FROM users u
        JOIN messages m ON (m.sender_id = u.id AND m.receiver_id = $1) OR (m.sender_id = $1 AND m.receiver_id = u.id)
        WHERE m.project_id IS NULL
        ORDER BY u.id, m.created_at DESC
    `;
    const result = await query(text, [userId]);
    // Re-sort by last message time descending
    return result.rows.sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
};

module.exports = {
    createMessage,
    getMessagesByProject,
    getMessageById,
    getDirectMessages,
    getDirectChatUsers,
    markAsRead,
    markProjectMessagesAsRead,
    getUnreadCount,
    getAllUnreadMessages,
    deleteMessage,
    deleteProjectMessages
};
