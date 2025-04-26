const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { verifyGoogleToken, checkUserExists } = require('../middlewares/auth');
const { memoryAgent, safetyAgent, reminderAgent } = require('../services/agentService');

// Process face recognition
// POST /api/agent/face-recognition
router.post(
  '/face-recognition',
  [
    verifyGoogleToken,
    checkUserExists,
    [
      check('patientId', 'Patient ID is required').not().isEmpty(),
      check('faceData', 'Face data is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    try {
      const { patientId, faceData } = req.body;
      const result = await memoryAgent.processFaceRecognition(patientId, faceData);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Face recognition error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error processing face recognition'
      });
    }
  }
);

// Check patient location
// POST /api/agent/check-location
router.post(
  '/check-location',
  [
    verifyGoogleToken,
    checkUserExists,
    [
      check('patientId', 'Patient ID is required').not().isEmpty(),
      check('coordinates', 'Coordinates are required').isArray({ min: 2, max: 2 })
    ]
  ],
  async (req, res) => {
    try {
      const { patientId, coordinates } = req.body;
      const result = await safetyAgent.checkLocation(patientId, coordinates);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Location check error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error checking location'
      });
    }
  }
);

// Process medication reminder
// POST /api/agent/medication-reminder
router.post(
  '/medication-reminder',
  [
    verifyGoogleToken,
    checkUserExists,
    [
      check('patientId', 'Patient ID is required').not().isEmpty(),
      check('medicationData', 'Medication data is required').not().isEmpty(),
      check('medicationData.name', 'Medication name is required').not().isEmpty(),
      check('medicationData.dosage', 'Dosage is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    try {
      const { patientId, medicationData } = req.body;
      const result = await reminderAgent.processMedicationReminder(patientId, medicationData);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Medication reminder error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error processing medication reminder'
      });
    }
  }
);

module.exports = router;
