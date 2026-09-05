const { query } = require('../database/db');
const { getUserPreferences } = require('../models/notificationPreferenceModel');
const { sendEmail } = require('./emailService');

/**
 * Unified notification service
 * Handles delivery across multiple channels (real-time, email, push)
 */

/**
 * Send notification through all appropriate channels
 */
const sendNotification = async (userId, type, data, io = null) => {
    try {
        // Check user preferences
        const preferences = await getUserPreferences(userId);

        // Create notification record
        const notification = await createNotificationRecord(userId, type, data);

        // Determine channels based on preferences
        const channels = [];
        if (preferences.email_enabled) channels.push('email');
        if (preferences.push_enabled) channels.push('push');
        channels.push('realtime'); // Always try real-time

        // Send through each channel
        const results = await Promise.allSettled(
            channels.map(channel => deliverViaChannel(channel, userId, notification, data, io))
        );

        // Log delivery attempts
        await logDeliveryAttempts(notification.id, results, channels);

        // Update notification status
        const success = results.some(r => r.status === 'fulfilled');
        await updateNotificationStatus(notification.id, success ? 'delivered' : 'failed');

        return notification;
    } catch (error) {
        console.error('Notification service error:', error);
        throw error;
    }
};

/**
 * Create notification database record
 */
const createNotificationRecord = async (userId, type, data) => {
    const text = `
        INSERT INTO notifications (user_id, type, message, data, delivery_status)
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING *
    `;

    const message = generateMessage(type, data);
    const result = await query(text, [userId, type, message, JSON.stringify(data)]);
    return result.rows[0];
};

/**
 * Generate human-readable message from notification type and data
 */
const generateMessage = (type, data) => {
    const messages = {
        'project_invite': `You've been invited to ${data.projectTitle}`,
        'project_accepted': `Your invitation to ${data.projectTitle} was accepted`,
        'project_rejected': `Your invitation to ${data.projectTitle} was declined`,
        'message_received': `New message from ${data.senderName}`,
        'payment_received': `Payment of $${data.amount} received`,
        'payment_released': `Payment of $${data.amount} released`,
        'milestone_completed': `Milestone "${data.milestoneTitle}" completed`,
        'contract_signed': `Contract for ${data.projectTitle} has been signed`,
        'profile_approved': 'Your expert profile has been approved',
        'profile_rejected': 'Your expert profile needs updates'
    };

    return messages[type] || 'New notification';
};

/**
 * Deliver notification via specific channel
 */
const deliverViaChannel = async (channel, userId, notification, data, io) => {
    switch (channel) {
        case 'realtime':
            return deliverRealtime(userId, notification, io);
        case 'email':
            return deliverEmail(userId, notification, data);
        case 'push':
            return deliverPush(userId, notification, data);
        default:
            throw new Error(`Unknown channel: ${channel}`);
    }
};

/**
 * Deliver via Socket.IO (real-time)
 */
const deliverRealtime = async (userId, notification, io) => {
    if (!io) {
        throw new Error('Socket.IO instance not provided');
    }

    // Emit to user's room
    io.to(`user_${userId}`).emit('notification', {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        data: notification.data,
        createdAt: notification.created_at
    });

    return { channel: 'realtime', status: 'delivered' };
};

/**
 * Deliver via email
 */
const deliverEmail = async (userId, notification, data) => {
    // Get user email
    const userResult = await query('SELECT email, name FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
        throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Send email
    await sendEmail({
        to: user.email,
        subject: notification.message,
        html: generateEmailHTML(notification, data, user.name)
    });

    return { channel: 'email', status: 'delivered' };
};

/**
 * Generate email HTML for notification
 */
const generateEmailHTML = (notification, data, userName) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Africa Konnect</h1>
                </div>
                <div class="content">
                    <h2>Hi ${userName},</h2>
                    <p>${notification.message}</p>
                    ${data.actionUrl ? `<a href="${data.actionUrl}" class="button">View Details</a>` : ''}
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Africa Konnect. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

/**
 * Deliver via push notification (placeholder for future implementation)
 */
const deliverPush = async (userId, notification, data) => {
    // TODO: Implement push notifications (Firebase, OneSignal, etc.)
    // TODO: Implement push notifications (Firebase, OneSignal, etc.)
    console.warn('Push notification not yet implemented for user:', userId);
    // Return skipped status instead of throwing
    return { channel: 'push', status: 'skipped', reason: 'Not implemented' };
};

/**
 * Log delivery attempts
 */
const logDeliveryAttempts = async (notificationId, results, channels) => {
    const logs = results.map((result, index) => ({
        notification_id: notificationId,
        channel: channels[index],
        status: result.status === 'fulfilled' ? 'delivered' : 'failed',
        error_message: result.status === 'rejected' ? result.reason.message : null
    }));

    for (const log of logs) {
        await query(
            `INSERT INTO notification_delivery_log (notification_id, channel, status, error_message)
             VALUES ($1, $2, $3, $4)`,
            [log.notification_id, log.channel, log.status, log.error_message]
        );
    }
};

/**
 * Update notification delivery status
 */
const updateNotificationStatus = async (notificationId, status) => {
    const text = `
        UPDATE notifications
        SET 
            delivery_status = $2,
            delivery_attempts = delivery_attempts + 1,
            last_attempt_at = CURRENT_TIMESTAMP,
            delivered_at = CASE WHEN $2 = 'delivered' THEN CURRENT_TIMESTAMP ELSE delivered_at END
        WHERE id = $1
    `;
    await query(text, [notificationId, status]);
};

/**
 * Retry failed notifications
 */
const retryFailedNotifications = async (io) => {
    const text = `
        SELECT * FROM notifications
        WHERE delivery_status = 'failed'
        AND delivery_attempts < 3
        AND last_attempt_at < NOW() - INTERVAL '1 hour'
        LIMIT 100
    `;

    const result = await query(text);

    for (const notification of result.rows) {
        try {
            const data = JSON.parse(notification.data);
            await sendNotification(notification.user_id, notification.type, data, io);
        } catch (error) {
            console.error(`Failed to retry notification ${notification.id}:`, error);
        }
    }

    return result.rows.length;
};

module.exports = {
    sendNotification,
    retryFailedNotifications
};
