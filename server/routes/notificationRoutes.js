const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markRead,
    deleteNotification,
    getPreferences,
    updatePreferences,
    retryNotification
} = require('../controllers/notificationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateId } = require('../middleware/validationMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.put('/:id/read', validateId, markRead); // Use 'all' as id to mark all
router.delete('/:id', validateId, deleteNotification);

// Preferences
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

// Manual Retry (Admin/System)
router.post('/:id/retry', validateId, adminOnly, retryNotification);

module.exports = router;
