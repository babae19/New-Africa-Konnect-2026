const express = require('express');
const router = express.Router();
const {
    sendMessage,
    getMessages,
    getMessageById,
    getDirectMessages,
    getDirectChatUsers,
    markAsRead,
    markProjectMessagesAsRead,
    getUnreadCount,
    getAllUnreadMessages,
    deleteMessage
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { validateMessage, validateId } = require('../middleware/validationMiddleware');

// All routes require authentication
router.use(protect);

// Send message
router.post('/', validateMessage, sendMessage);

// Get unread messages for user
router.get('/unread', getAllUnreadMessages);

// Get messages for a project
router.get('/project/:projectId', validateId, getMessages);

// Get direct messages with another user
router.get('/direct/:userId', validateId, getDirectMessages);

// Get all unique users who have exchanged direct messages with the current user
router.get('/direct', getDirectChatUsers);

// Mark message as read
router.put('/:id/read', validateId, markAsRead);

// Mark all project messages as read
router.put('/project/:projectId/read', validateId, markProjectMessagesAsRead);

// Delete message
router.delete('/:id', validateId, deleteMessage);

module.exports = router;
