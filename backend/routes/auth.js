const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const {
  getGoogleAuthUrl,
  googleCallback,
  completeRegistration
} = require('../controllers/auth');

// Get Google OAuth URL
// GET /api/auth/google
router.get('/google', getGoogleAuthUrl);

// Google OAuth callback
// GET /api/auth/google/callback
router.get('/google/callback', googleCallback);

// Complete registration
// POST /api/auth/register
router.post(
  '/register',
  [
    check('tempToken', 'Temporary token is required').not().isEmpty(),
    check('type', 'User type is required').not().isEmpty(),
    check('type', 'Type must be either patient or caregiver').isIn(['patient', 'caregiver'])
  ],
  completeRegistration
);

module.exports = router;
