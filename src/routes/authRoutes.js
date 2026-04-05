const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/auth/google/verify', authController.googleAuth);

// Protected routes (require authentication)
router.get('/onboarding-status', authMiddleware, authController.checkOnboarding);
router.post('/onboarding/complete', authMiddleware, authController.completeOnboarding);

module.exports = router;