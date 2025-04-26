const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { verifyGoogleToken, checkUserExists, requireCaregiver } = require('../middlewares/auth');
const {
  createRecognizedPerson,
  getRecognizedPersons,
  updateRecognizedPerson,
  deleteRecognizedPerson
} = require('../controllers/recognizedPersons');

// Create new recognized person
// POST /api/faces
router.post(
  '/',
  [
    verifyGoogleToken,
    checkUserExists,
    requireCaregiver,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('relationship', 'Relationship is required').not().isEmpty(),
      check('faceData', 'Face data is required').not().isEmpty(),
      check('patientId', 'Patient ID is required').not().isEmpty()
    ]
  ],
  createRecognizedPerson
);

// Get all recognized persons for a patient
// GET /api/faces/patient/:patientId
router.get(
  '/patient/:patientId',
  [verifyGoogleToken, checkUserExists],
  getRecognizedPersons
);

// Update a recognized person
// PUT /api/faces/:id
router.put(
  '/:id',
  [
    verifyGoogleToken,
    checkUserExists,
    requireCaregiver,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('relationship', 'Relationship is required').not().isEmpty()
    ]
  ],
  updateRecognizedPerson
);

// Delete a recognized person
// DELETE /api/faces/:id
router.delete(
  '/:id',
  [verifyGoogleToken, checkUserExists, requireCaregiver],
  deleteRecognizedPerson
);

module.exports = router;
