const Alert = require('../models/Alert');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { sendToUser } = require('../services/websocketService');

// Create a new alert
exports.createAlert = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { patientId, type, title, description, priority, metadata } = req.body;
    
    // Create alert
    const alert = new Alert({
      patientId,
      type,
      title,
      description,
      priority: priority || 'medium',
      metadata
    });

    await alert.save();

    // Notify patient and caregivers
    const patient = await User.findById(patientId).populate('careCircle');
    
    if (patient) {
      // Notify patient
      sendToUser(patient.uid, {
        type: 'alert',
        alertId: alert._id,
        alertType: alert.type,
        title: alert.title,
        description: alert.description,
        priority: alert.priority,
        timestamp: alert.createdAt
      });
      
      // Notify caregivers
      if (patient.careCircle && patient.careCircle.length > 0) {
        patient.careCircle.forEach(caregiver => {
          sendToUser(caregiver.uid, {
            type: 'patientAlert',
            alertId: alert._id,
            patientName: `${patient.firstName} ${patient.lastName}`,
            alertType: alert.type,
            title: alert.title,
            description: alert.description,
            priority: alert.priority,
            timestamp: alert.createdAt
          });
        });
      }
    }

    res.status(201).json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating alert'
    });
  }
};

// Get alerts for a patient
exports.getAlerts = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status, type, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = { patientId };
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch alerts
    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const totalCount = await Alert.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: alerts.length,
      total: totalCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      },
      data: alerts
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving alerts'
    });
  }
};

// Update alert status
exports.updateAlertStatus = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Update alert status
    const alert = await Alert.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    // Notify patient and caregivers about status change
    const patient = await User.findById(alert.patientId).populate('careCircle');
    
    if (patient) {
      // Notify patient
      sendToUser(patient.uid, {
        type: 'alertStatusChange',
        alertId: alert._id,
        status: alert.status,
        timestamp: alert.updatedAt
      });
      
      // Notify caregivers
      if (patient.careCircle && patient.careCircle.length > 0) {
        patient.careCircle.forEach(caregiver => {
          sendToUser(caregiver.uid, {
            type: 'alertStatusChange',
            alertId: alert._id,
            patientName: `${patient.firstName} ${patient.lastName}`,
            status: alert.status,
            timestamp: alert.updatedAt
          });
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Update alert status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating alert status'
    });
  }
};
