const express = require('express');
const router = express.Router();
const { passport, googleCallback, googleTokenAuth } = require('../controllers/googleAuthController');

// Google OAuth Routes (Server-side redirect flow)
router.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { session: false }),
  googleCallback
);

// Google Token Auth (Client-side flow - for popup/One Tap)
router.post('/auth/google/token', googleTokenAuth);

module.exports = router;
