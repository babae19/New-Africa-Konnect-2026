const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getProfile,
    verifyEmailToken,
    resendVerification,
    refreshToken,
    getSessions,
    revokeSessionById,
    revokeAllOtherSessions,
    logout,
    requestPasswordReset,
    resetPassword,
    updateUserProfile,
    getPublicProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimitMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');

// Public routes with rate limiting
router.post('/register', authLimiter, validateRegister, registerUser);
router.post('/login', authLimiter, validateLogin, loginUser);
router.post('/verify-email', verifyEmailToken);
router.post('/refresh-token', refreshToken);
router.get('/users/:id/public', protect, getPublicProfile);

// Password reset routes (public but rate limited)
router.post('/forgot-password', passwordResetLimiter, requestPasswordReset);
router.post('/reset-password', passwordResetLimiter, resetPassword);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/resend-verification', protect, passwordResetLimiter, resendVerification);
router.post('/logout', protect, logout);

// Session management
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:sessionId', protect, revokeSessionById);
router.post('/sessions/revoke-others', protect, revokeAllOtherSessions);

// OAuth Consent Decision
router.post('/oauth/decision', protect, require('../controllers/authController').oauthDecision);

module.exports = router;
