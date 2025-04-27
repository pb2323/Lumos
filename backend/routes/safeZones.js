const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { verifyGoogleToken, checkUserExists, requireCaregiver } = require('../middlewares/auth');
const {
  createSafeZone,
  getSafeZones,
  updateSafeZone,
  deleteSafeZone
} = require('../controllers/safeZones');

// Create new safe zone
// POST /api/safe-zones
router.post(
  '/',
  [
    // verifyGoogleToken,
    checkUserExists,
    requireCaregiver,
    [
      check('patientId', 'Patient ID is required').not().isEmpty(),
      check('name', 'Name is required').not().isEmpty(),
      check('address', 'Address is required').not().isEmpty()
    ]
  ],
  createSafeZone
);

// Get all safe zones for a patient
// GET /api/safe-zones/patient/:patientId
router.get(
  '/patient/:patientId',
  [
    // verifyGoogleToken, 
    checkUserExists],
  getSafeZones
);

// Update a safe zone
// PUT /api/safe-zones/:id
router.put(
  '/:id',
  [
    // verifyGoogleToken,
    checkUserExists,
    requireCaregiver
  ],
  updateSafeZone
);

// Delete a safe zone
// DELETE /api/safe-zones/:id
router.delete(
  '/:id',
  [
    // verifyGoogleToken, 
    checkUserExists, requireCaregiver],
  deleteSafeZone
);

module.exports = router;
