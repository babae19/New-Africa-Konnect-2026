const { createNotification } = require('../models/notificationModel');
const { getUserPreferences } = require('../models/notificationPreferenceModel');
const { sendNotificationEmail } = require('./emailService');
const { findUserById } = require('../models/userModel');

const notificationMessages = {
    project_invite: data => `You've been invited to ${data.projectTitle}`,
    project_accepted: data => `Your invitation to ${data.projectTitle} was accepted`,
    project_rejected: data => `Your invitation to ${data.projectTitle} was declined`,
    message_received: data => `New message from ${data.senderName}`,
    payment_received: data => `Payment of $${data.amount} received`,
    payment_released: data => `Payment of $${data.amount} released`,
    milestone_completed: data => `Milestone "${data.milestoneTitle}" completed`,
    contract_signed: data => `Contract for ${data.projectTitle} has been signed`,
    profile_approved: () => 'Your expert profile has been approved',
    profile_rejected: () => 'Your expert profile needs updates'
};

/** Store notifications in the existing table before attempting optional delivery. */
const sendNotification = async (userId, type, data = {}, io = null) => {
    const message = (notificationMessages[type] || (() => 'New notification'))(data);
    const notification = await createNotification({
        userId, type, title: type.replaceAll('_', ' '), message,
        link: data.actionUrl || null
    });

    if (io) {
        io.to(`user_${userId}`).emit('notification', {
            ...notification,
            data: { ...data, actionUrl: notification.link }
        });
    }

    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        try {
            const preferences = await getUserPreferences(userId);
            if (preferences?.email_enabled) {
                const user = await findUserById(userId);
                if (user) await sendNotificationEmail(user, notification);
            }
        } catch (error) {
            console.error('Optional notification email failed:', error);
        }
    }

    return notification;
};

module.exports = { sendNotification };
