const {
    createMessage,
    getMessagesByProject,
    getMessageById,
    markAsRead,
    markProjectMessagesAsRead,
    getUnreadCount,
    getAllUnreadMessages,
    getDirectMessages,
    getDirectChatUsers,
    deleteMessage
} = require('../models/messageModel');
const { getProjectById, isMember } = require('../models/projectModel');
const { findUserById } = require('../models/userModel');

const canAccessProject = async (project, user) => {
    if (!project) return false;
    if (user.role === 'admin' || project.client_id === user.id) return true;
    if (project.selected_expert_id === user.id && project.expert_status === 'accepted') return true;
    return isMember(project.id, user.id);
};

// Send message
exports.sendMessage = async (req, res) => {
    try {
        const { projectId, receiverId, content } = req.body;
        const senderId = req.user.id;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        if (projectId) {
            // Verify user has access to project
            const project = await getProjectById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Check if user is client or expert on this project
            if (!(await canAccessProject(project, req.user))) {
                return res.status(403).json({ message: 'Not authorized to send messages in this project' });
            }
        } else if (!receiverId) {
            return res.status(400).json({ message: 'Either Project ID or Receiver ID is required' });
        } else {
            if (receiverId === senderId) return res.status(400).json({ message: 'You cannot message yourself' });
            const recipient = await findUserById(receiverId);
            if (!recipient) return res.status(404).json({ message: 'Recipient not found' });
            if (!((req.user.role === 'client' && recipient.role === 'expert') ||
                  (req.user.role === 'expert' && recipient.role === 'client'))) {
                return res.status(403).json({ message: 'Direct messages are for clients and experts' });
            }
        }

        const message = await createMessage({
            projectId,
            senderId,
            receiverId,
            content
        });

        if (!projectId && receiverId) {
            const { sendNotification } = require('../services/notificationService');
            sendNotification(receiverId, 'message_received', {
                senderName: req.user.name,
                senderId,
                actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/collaboration?view=messages`
            }, req.app.get('io')).catch(error => console.error('Direct message notification failed:', error));
        }

        const io = req.app.get('io');
        if (io) {
            const messagePayload = {
                ...message,
                project_id: projectId,
                receiver_id: receiverId,
                sender: {
                    id: req.user.id,
                    name: req.user.name,
                    avatar_url: req.user.profile_image_url || req.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.name || 'User')}`
                }
            };

            if (projectId) {
                io.to(`project_${projectId}`).emit('receive_message', messagePayload);
            } else if (receiverId) {
                // Send DM directly to both the sender (for multi-device sync) and receiver
                io.to(`user_${receiverId}`).emit('direct_message', messagePayload);
                io.to(`user_${senderId}`).emit('direct_message', messagePayload);
                
                // Keep the global notification event
                io.to(`user_${receiverId}`).emit('new_direct_message', messagePayload);
            }
        }

        res.status(201).json(message);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get messages for a project
exports.getMessages = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { limit, offset } = req.query;

        // Verify user has access to project
        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is client or expert on this project
        if (!(await canAccessProject(project, req.user))) {
            return res.status(403).json({ message: 'Not authorized to view messages in this project' });
        }

        const messages = await getMessagesByProject(
            projectId,
            limit ? parseInt(limit) : 100,
            offset ? parseInt(offset) : 0
        );

        // Get unread count
        const unreadCount = await getUnreadCount(projectId, req.user.id);

        res.json({
            count: messages.length,
            unreadCount,
            messages
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get message by ID
exports.getMessageById = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await getMessageById(id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Access check
        if (message.project_id) {
            const project = await getProjectById(message.project_id);
            if (!(await canAccessProject(project, req.user))) {
                return res.status(403).json({ message: 'Not authorized' });
            }
        } else if (message.sender_id !== req.user.id && message.receiver_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(message);
    } catch (error) {
        console.error('Get message by ID error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get direct messages
exports.getDirectMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit, offset } = req.query;
        const currentUserId = req.user.id;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const messages = await getDirectMessages(
            currentUserId,
            userId,
            limit ? parseInt(limit) : 100,
            offset ? parseInt(offset) : 0
        );

        res.json(messages);
    } catch (error) {
        console.error('Get direct messages error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const existingMessage = await getMessageById(id);
        if (!existingMessage) return res.status(404).json({ message: 'Message not found' });
        if (existingMessage.project_id) {
            const project = await getProjectById(existingMessage.project_id);
            if (!(await canAccessProject(project, req.user))) return res.status(403).json({ message: 'Not authorized' });
        } else if (existingMessage.sender_id !== req.user.id && existingMessage.receiver_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const message = await markAsRead(id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`project_${message.project_id}`).emit('message_read_update', {
                messageId: id,
                userId: req.user.id
            });
        }

        res.json(message);
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Mark all project messages as read
exports.markProjectMessagesAsRead = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;

        // Verify user has access to project
        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (!(await canAccessProject(project, req.user))) {
            return res.status(403).json({ message: 'Not authorized to update messages in this project' });
        }

        const messages = await markProjectMessagesAsRead(projectId, userId);

        const io = req.app.get('io');
        if (io && messages.length > 0) {
            // Optimize: maybe just emit a 'all_read' event or loop if needed, but 'all_read' is better
            // For now, let's just emit a generic event that prompts refresh or bulk update
            io.to(`project_${projectId}`).emit('messages_marked_read', {
                userId,
                count: messages.length
            });
        }

        res.json({
            count: messages.length,
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Mark project as read error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all unread messages for user
exports.getAllUnreadMessages = async (req, res) => {
    try {
        const userId = req.user.id;

        const messages = await getAllUnreadMessages(userId);

        res.json({
            count: messages.length,
            messages
        });
    } catch (error) {
        console.error('Get unread messages error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get unread count for project
exports.getUnreadCount = async (req, res) => {
    try {
        const { projectId } = req.params;
        const count = await getUnreadCount(projectId, req.user.id);
        res.json({ unreadCount: count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete message
exports.deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await getMessageById(id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        if (message.sender_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }

        await deleteMessage(id);
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ message: error.message });
    }
};
// Get all unique users who have exchanged direct messages with the current user
exports.getDirectChatUsers = async (req, res) => {
    try {
        const userId = req.user.id;
        const users = await getDirectChatUsers(userId);
        res.json(users);
    } catch (error) {
        console.error('Get direct chat users error:', error);
        res.status(500).json({ message: error.message });
    }
};
