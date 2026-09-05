const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    scheduleInterview,
    getProjectInterviews,
    getMyInterviews,
    updateStatus
} = require('../controllers/interviewController');

// All routes are protected
router.use(protect);

router.post('/', scheduleInterview);
router.get('/project/:projectId', getProjectInterviews);
router.get('/my', getMyInterviews);
router.put('/:id/status', updateStatus);

module.exports = router;
