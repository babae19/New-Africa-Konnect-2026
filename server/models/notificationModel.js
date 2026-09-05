const { query } = require('../database/db');

// Create a new notification
const createNotification = async (notificationData) => {
    const { userId, type, title, message, link } = notificationData;

    const text = `
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const values = [userId, type, title, message, link];

    const result = await query(text, values);
    return result.rows[0];
};

// Get notifications for a user
const getUserNotifications = async (userId, limit = 20, offset = 0) => {
    const text = `
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
    `;
    const result = await query(text, [userId, limit, offset]);
    return result.rows;
};

// Get unread notification count
const getUnreadNotificationCount = async (userId) => {
    const text = `
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = $1 AND is_read = false
    `;
    const result = await query(text, [userId]);
    return parseInt(result.rows[0].count);
};

// Mark notification as read
const markAsRead = async (id, userId) => {
    const text = `
        UPDATE notifications 
        SET is_read = true 
        WHERE id = $1 AND user_id = $2 
        RETURNING *
    `;
    const result = await query(text, [id, userId]);
    return result.rows[0];
};

// Mark all notifications as read
const markAllAsRead = async (userId) => {
    const text = `
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = $1 
        RETURNING *
    `;
    const result = await query(text, [userId]);
    return result.rows;
};

// Delete notification
const deleteNotification = async (id, userId) => {
    const text = 'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *';
    const result = await query(text, [id, userId]);
    return result.rows[0];
};

module.exports = {
    createNotification,
    getUserNotifications,
    getUnreadNotificationCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
