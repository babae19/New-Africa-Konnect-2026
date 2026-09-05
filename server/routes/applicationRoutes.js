const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    applyToProject,
    getProjectApplications,
    getMyApplications,
    updateStatus
} = require('../controllers/applicationController');

// All routes are protected
router.use(protect);

router.post('/:projectId/apply', applyToProject);
router.get('/project/:projectId', getProjectApplications);
router.get('/my', getMyApplications);
router.put('/:id/status', updateStatus);

module.exports = router;
