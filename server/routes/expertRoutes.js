const express = require('express');
const router = express.Router();
const {
    createProfile,
    getProfile,
    updateProfile,
    getAllExperts,
    updateVettingStatus,
    getProfileCompleteness,
    updateCompleteness,
    addPortfolio,
    removePortfolio,
    updateAvailability,
    setRateRange,
    updateSkills,
    getChangeLog,
    getAllSkills,
    getSkillsByCategory,
    getCategories,
    searchSkills
} = require('../controllers/expertController');
const { protect, authorize, requireEmailVerification } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllExperts);
router.get('/skills', getAllSkills);
router.get('/skills/categories', getCategories);
router.get('/skills/category/:category', getSkillsByCategory);
router.get('/skills/search', searchSkills);

const { validateExpertProfile } = require('../middleware/validationMiddleware');

// Protected routes - Expert profile management
router.post('/profile', protect, authorize('expert'), requireEmailVerification, validateExpertProfile, createProfile);
router.get('/profile/:userId', protect, getProfile);
router.put('/profile/:userId', protect, requireEmailVerification, validateExpertProfile, updateProfile);

// Profile completeness
router.get('/profile/:userId/completeness', protect, getProfileCompleteness);
router.post('/profile/completeness', protect, authorize('expert'), updateCompleteness);

// Portfolio management
router.post('/portfolio', protect, authorize('expert'), requireEmailVerification, addPortfolio);
router.delete('/portfolio/:itemId', protect, authorize('expert'), removePortfolio);

// Availability
router.put('/availability', protect, authorize('expert'), requireEmailVerification, updateAvailability);

// Rate range
router.put('/rate-range', protect, authorize('expert'), requireEmailVerification, setRateRange);

// Skills
router.put('/skills', protect, authorize('expert'), requireEmailVerification, updateSkills);

// Change log
router.get('/changelog/:userId', protect, getChangeLog);

// Admin only routes
router.put('/:userId/vetting', protect, authorize('admin'), updateVettingStatus);

module.exports = router;
