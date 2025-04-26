const mongoose = require('mongoose');

const RecognizedPersonSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  relationship: {
    type: String,
    required: true
  },
  faceData: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  lastInteractionDate: {
    type: Date
  },
  lastInteractionSummary: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RecognizedPerson', RecognizedPersonSchema);