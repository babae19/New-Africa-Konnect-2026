const express = require('express');
const router = express.Router();
const {
    createTask,
    getTasks,
    updateTask,
    deleteTask,
    createMilestone,
    getMilestones,
    updateMilestone,
    addFileVersion,
    getVersions,
    getActivity
} = require('../controllers/collaborationController');
const { protect } = require('../middleware/authMiddleware');
const { requireProjectParticipant } = require('../middleware/projectMiddleware');

router.use(protect);

// Tasks
router.post('/projects/:projectId/tasks', requireProjectParticipant, createTask);
router.get('/projects/:projectId/tasks', requireProjectParticipant, getTasks);
router.put('/tasks/:id', requireProjectParticipant, updateTask);
router.delete('/tasks/:id', requireProjectParticipant, deleteTask);

// Milestones
router.post('/projects/:projectId/milestones', requireProjectParticipant, createMilestone);
router.get('/projects/:projectId/milestones', requireProjectParticipant, getMilestones);
router.put('/milestones/:id', requireProjectParticipant, updateMilestone);

// File Versions
router.post('/files/:fileId/versions', requireProjectParticipant, addFileVersion);
router.get('/files/:fileId/versions', requireProjectParticipant, getVersions);

// Activity Feed
router.get('/projects/:projectId/activity', requireProjectParticipant, getActivity);

module.exports = router;
