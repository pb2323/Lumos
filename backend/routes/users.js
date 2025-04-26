const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { verifyGoogleToken, checkUserExists, requireCaregiver } = require('../middlewares/auth');
const {
  createUser,
  getCurrentUser,
  updateUser,
  getCareCircle
} = require('../controllers/users');

// Create new user
// POST /api/users
router.post(
  '/',
  [
    verifyGoogleToken,
    [
      check('type', 'User type is required').not().isEmpty(),
      check('type', 'Type must be either patient or caregiver').isIn(['patient', 'caregiver']),
      check('email', 'Please include a valid email').isEmail(),
      check('firstName', 'First name is required').not().isEmpty(),
      check('lastName', 'Last name is required').not().isEmpty()
    ]
  ],
  createUser
);

// Get current user
// GET /api/users/me
router.get('/me', [verifyGoogleToken, checkUserExists], getCurrentUser);

// Update user
// PUT /api/users/me
router.put(
  '/me',
  [
    verifyGoogleToken,
    checkUserExists,
    [
      check('firstName', 'First name is required').not().isEmpty(),
      check('lastName', 'Last name is required').not().isEmpty()
    ]
  ],
  updateUser
);

// Get care circle
// GET /api/users/care-circle
router.get('/care-circle', [verifyGoogleToken, checkUserExists], getCareCircle);

module.exports = router;
