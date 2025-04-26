const mongoose = require('mongoose');

const MemoryLogSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['journal', 'interaction', 'activity', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String
  },
  relatedPersons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecognizedPerson'
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    }
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

module.exports = mongoose.model('MemoryLog', MemoryLogSchema);
