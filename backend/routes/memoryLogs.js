const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { verifyGoogleToken, checkUserExists } = require('../middlewares/auth');
const {
  createMemoryLog,
  getMemoryLogs,
  getPersonMemoryLogs
} = require('../controllers/memoryLogs');

// Create new memory log
// POST /api/memory-logs
router.post(
  '/',
  [
    verifyGoogleToken,
    checkUserExists,
    [
      check('patientId', 'Patient ID is required').not().isEmpty(),
      check('type', 'Log type is required').not().isEmpty(),
      check('type', 'Type must be journal, interaction, activity, or system').isIn(['journal', 'interaction', 'activity', 'system']),
      check('content', 'Content is required').not().isEmpty()
    ]
  ],
  createMemoryLog
);

// Get memory logs for a patient
// GET /api/memory-logs/patient/:patientId
router.get(
  '/patient/:patientId',
  [verifyGoogleToken, checkUserExists],
  getMemoryLogs
);

// Get memory logs related to a specific person
// GET /api/memory-logs/person/:personId
router.get(
  '/person/:personId',
  [verifyGoogleToken, checkUserExists],
  getPersonMemoryLogs
);

module.exports = router;