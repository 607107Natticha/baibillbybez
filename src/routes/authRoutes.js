const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const singletonUserMiddleware = require('../middleware/singletonUserMiddleware');

router.get('/onboarding-status', singletonUserMiddleware, authController.checkOnboarding);
router.post('/onboarding/complete', singletonUserMiddleware, authController.completeOnboarding);

module.exports = router;
