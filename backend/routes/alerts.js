const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { verifyGoogleToken, checkUserExists } = require('../middlewares/auth');
const {
  createAlert,
  getAlerts,
  updateAlertStatus
} = require('../controllers/alerts');

// Create new alert
// POST /api/alerts
router.post(
  '/',
  [
    verifyGoogleToken,
    checkUserExists,
    [
      check('patientId', 'Patient ID is required').not().isEmpty(),
      check('type', 'Alert type is required').not().isEmpty(),
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty()
    ]
  ],
  createAlert
);

// Get alerts for a patient
// GET /api/alerts/patient/:patientId
router.get(
    '/patient/:patientId',
    [verifyGoogleToken, checkUserExists],
    getAlerts
  );
  
  // Update alert status
  // PUT /api/alerts/:id/status
  router.put(
    '/:id/status',
    [
      verifyGoogleToken,
      checkUserExists,
      [
        check('status', 'Status is required').not().isEmpty(),
        check('status', 'Status must be active, acknowledged, or resolved').isIn(['active', 'acknowledged', 'resolved'])
      ]
    ],
    updateAlertStatus
  );
  
  module.exports = router;
