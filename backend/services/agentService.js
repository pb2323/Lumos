const axios = require('axios');
const User = require('../models/User');
const RecognizedPerson = require('../models/RecognizedPerson');
const SafeZone = require('../models/SafeZone');
const Alert = require('../models/Alert');
const { isWithinSafeZone } = require('./melissaApi');
const { generateMemoryContext } = require('./geminiApi');
const { sendToUser } = require('./websocketService');

// Memory Agent - Handles face recognition and context generation
const memoryAgent = {
  // Process a face recognition event
  async processFaceRecognition(patientId, faceData) {
    try {
      // Find matching person in database
      const person = await RecognizedPerson.findOne({
        patientId,
        faceData: { $regex: faceData.substring(0, 100) } // Match beginning of face data
      });
      
      if (!person) {
        return { success: false, message: 'Person not recognized' };
      }
      
      // Generate memory context
      const context = await generateMemoryContext(person);
      
      // Update last interaction
      person.lastInteractionDate = new Date();
      await person.save();
      
      // Send notification to patient
      const patient = await User.findById(patientId);
      if (patient) {
        sendToUser(patient.uid, {
          type: 'faceRecognition',
          personId: person._id,
          name: person.name,
          relationship: person.relationship,
          context
        });
      }
      
      return {
        success: true,
        person: {
          id: person._id,
          name: person.name,
          relationship: person.relationship
        },
        context
      };
    } catch (error) {
      console.error('Memory agent error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Safety Agent - Monitors location and triggers alerts
const safetyAgent = {
  // Check if patient is within safe zones
  async checkLocation(patientId, coordinates) {
    try {
      // Find all active safe zones for the patient
      const safeZones = await SafeZone.find({
        patientId,
        isActive: true
      });
      
      if (safeZones.length === 0) {
        return { success: true, inSafeZone: false, message: 'No safe zones defined' };
      }
      
      // Check if patient is within any safe zone
      const location = { coordinates };
      let withinSafeZone = false;
      let nearestZone = null;
      let nearestDistance = Infinity;
      
      for (const zone of safeZones) {
        if (isWithinSafeZone(location, zone)) {
          withinSafeZone = true;
          break;
        }
        
        // Calculate distance to the zone for reporting
        const distance = calculateDistance(coordinates, zone.coordinates.coordinates);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestZone = zone;
        }
      }
      
      // If not in any safe zone, create alert
      if (!withinSafeZone && nearestZone) {
        // Create an alert
        const alert = new Alert({
          patientId,
          type: 'location',
          title: 'Safe Zone Exit Alert',
          description: `Patient has left all safe zones. Nearest zone is "${nearestZone.name}" (${Math.round(nearestDistance)} meters away)`,
          priority: 'high',
          metadata: {
            coordinates,
            nearestZone: {
              id: nearestZone._id,
              name: nearestZone.name,
              distance: Math.round(nearestDistance)
            }
          }
        });
        
        await alert.save();
        
        // Notify caregivers
        const patient = await User.findById(patientId).populate('careCircle');
        if (patient && patient.careCircle.length > 0) {
          patient.careCircle.forEach(caregiver => {
            sendToUser(caregiver.uid, {
              type: 'safeZoneAlert',
              alertId: alert._id,
              patientName: `${patient.firstName} ${patient.lastName}`,
              message: alert.description,
              priority: alert.priority,
              timestamp: alert.createdAt
            });
          });
        }
      }
      
      return {
        success: true,
        inSafeZone: withinSafeZone,
        nearestZone: nearestZone ? {
          id: nearestZone._id,
          name: nearestZone.name,
          distance: Math.round(nearestDistance)
        } : null
      };
    } catch (error) {
      console.error('Safety agent error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Reminder Agent - Handles time and location-based notifications
const reminderAgent = {
  // Process medication reminder
  async processMedicationReminder(patientId, medicationData) {
    try {
      // Create an alert
      const alert = new Alert({
        patientId,
        type: 'medication',
        title: 'Medication Reminder',
        description: `Time to take ${medicationData.name} (${medicationData.dosage})`,
        priority: 'medium',
        metadata: medicationData
      });
      
      await alert.save();
      
      // Notify patient
      const patient = await User.findById(patientId);
      if (patient) {
        sendToUser(patient.uid, {
          type: 'medicationReminder',
          alertId: alert._id,
          medicationName: medicationData.name,
          dosage: medicationData.dosage,
          instructions: medicationData.instructions,
          timestamp: alert.createdAt
        });
      }
      
      return {
        success: true,
        alertId: alert._id
      };
    } catch (error) {
      console.error('Reminder agent error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Helper function to calculate distance
function calculateDistance(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

module.exports = {
  memoryAgent,
  safetyAgent,
  reminderAgent
};
