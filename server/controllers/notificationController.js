const {
    getUserNotifications,
    getUnreadNotificationCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../models/notificationModel');

const {
    getUserPreferences,
    updatePreferences
} = require('../models/notificationPreferenceModel');

const {
    sendNotification
} = require('../services/notificationService');

// Get user notifications
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit, offset } = req.query;

        const notifications = await getUserNotifications(
            userId,
            limit ? parseInt(limit) : 20,
            offset ? parseInt(offset) : 0
        );

        const unreadCount = await getUnreadNotificationCount(userId);

        res.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Mark as read
exports.markRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        if (id === 'all') {
            await markAllAsRead(userId);
            res.json({ message: 'All notifications marked as read' });
        } else {
            const notification = await markAsRead(id, userId);
            if (!notification) {
                return res.status(404).json({ message: 'Notification not found' });
            }
            res.json(notification);
        }
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const notification = await deleteNotification(id, userId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get notification preferences
exports.getPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = await getUserPreferences(userId);
        res.json(preferences);
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update notification preferences
exports.updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = await updatePreferences(userId, req.body);
        res.json(preferences);
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Retry failed notification (Admin or System only ideally, but exposure here for testing/manual retry)
exports.retryNotification = async (req, res) => {
    try {
        const { id } = req.params;
        // In a real app, logic to fetch notification by ID and retry would go here.
        // For now preventing abuse or implementation pending specific requirements
        res.status(501).json({ message: 'Retry functionality pending specific implementation details' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
