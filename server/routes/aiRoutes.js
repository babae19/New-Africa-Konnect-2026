const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware'); // Ensure protected routes

// AI Routes - Protected
router.post('/match', protect, aiController.matchExperts);
router.post('/draft-contract', protect, aiController.draftContract);
router.post('/chat', protect, aiController.chat);
router.post('/chat-stream', protect, aiController.chatStream);
router.post('/generate-project', protect, aiController.generateProjectDetails);
router.post('/analyze-document', protect, aiController.analyzeDocument);
router.post('/generate-proposal', protect, aiController.generateProposal);
router.post('/generate-interview', protect, aiController.generateInterviewQuestions);
router.post('/collaboration-help', protect, aiController.getCollaborationSuggestions);
router.post('/analyze-bids', protect, aiController.analyzeBids);

module.exports = router;
