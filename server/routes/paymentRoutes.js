const express = require('express');
const router = express.Router();
const {
    initEscrow,
    getEscrow,
    requestRelease,
    approveRelease
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validatePayment, validateId } = require('../middleware/validationMiddleware');
const { paymentLimiter } = require('../middleware/rateLimitMiddleware');

router.use(protect);

// Initialize escrow (Clients only)
router.post('/projects/:projectId/escrow', validateId, authorize('client'), paymentLimiter, validatePayment, initEscrow);

// Get escrow details
router.get('/projects/:projectId/escrow', validateId, getEscrow);

// Request release (Experts only usually, but sometimes clients trigger)
// In this model, Expert triggers request, Client approves
router.post('/projects/:projectId/releases', validateId, paymentLimiter, requestRelease);

// Approve release (Clients only)
router.put('/projects/:projectId/releases/:releaseId/approve', validateId, authorize('client'), paymentLimiter, approveRelease);

module.exports = router;
