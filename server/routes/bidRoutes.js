const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const bidController = require('../controllers/bidController');
const bidInterviewController = require('../controllers/bidInterviewController');

// All routes require authentication
router.use(protect);

// Expert routes - Submit and manage bids
router.post('/projects/:projectId/bids', bidController.submitBid);
router.get('/experts/my-bids', bidController.getMyBids);
router.put('/bids/:bidId', bidController.updateBid);
router.delete('/bids/:bidId/withdraw', bidController.withdrawBid);

// Client routes - View and manage bids on their projects
router.get('/projects/:projectId/bids', bidController.getBidsForProject);
router.put('/projects/:projectId/bids/:bidId/accept', bidController.acceptBid);
router.put('/projects/:projectId/bids/:bidId/reject', bidController.rejectBid);

// Interview routes
router.post('/projects/:projectId/bids/:bidId/interview', bidInterviewController.scheduleInterview);
router.get('/projects/:projectId/interviews', bidInterviewController.getProjectInterviews);
router.put('/interviews/:interviewId', bidInterviewController.updateInterview);

// Saved Search routes
const savedSearchController = require('../controllers/savedSearchController');
router.post('/saved-searches', savedSearchController.createSavedSearch);
router.get('/saved-searches', savedSearchController.getSavedSearches);
router.put('/saved-searches/:id', savedSearchController.updateSavedSearch);
router.delete('/saved-searches/:id', savedSearchController.deleteSavedSearch);
router.post('/saved-searches/:id/execute', savedSearchController.executeSavedSearch);

// Bid Templates routes
const bidTemplateController = require('../controllers/bidTemplateController');
router.post('/bid-templates', bidTemplateController.createTemplate);
router.get('/bid-templates', bidTemplateController.getTemplates);
router.put('/bid-templates/:id', bidTemplateController.updateTemplate);
router.delete('/bid-templates/:id', bidTemplateController.deleteTemplate);
router.delete('/bid-templates/:id', bidTemplateController.deleteTemplate);
router.post('/bid-templates/:id/apply/:projectId', bidTemplateController.applyTemplate);

// Availability & Scheduling Routes
const availabilityController = require('../controllers/availabilityController');
router.post('/availability', availabilityController.setAvailability);
router.get('/availability', availabilityController.getAvailability); // Get own
router.get('/availability/:expertId', availabilityController.getPublicAvailability);
router.delete('/availability/:id', availabilityController.deleteAvailability);

// Notification Preferences
const notificationPreferenceController = require('../controllers/notificationPreferenceController');
router.get('/notification-preferences', notificationPreferenceController.getPreferences);
router.put('/notification-preferences', notificationPreferenceController.updatePreferences);

module.exports = router;
