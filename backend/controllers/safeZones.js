const SafeZone = require('../models/SafeZone');
const { validationResult } = require('express-validator');
const melissaApi = require('../services/melissaApi');

// Create a new safe zone
exports.createSafeZone = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { patientId, name, address, radius } = req.body;
    
    // Convert address to coordinates using Melissa API
    const locationData = await melissaApi.addressToCoordinates(address);
    
    // Create safe zone
    const safeZone = new SafeZone({
      patientId,
      name,
      address: locationData.formattedAddress || address,
      coordinates: {
        type: 'Point',
        coordinates: locationData.coordinates
      },
      radius: radius || 100 // Default radius 100 meters
    });

    await safeZone.save();

    res.status(201).json({
      success: true,
      data: safeZone
    });
  } catch (error) {
    console.error('Create safe zone error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating safe zone'
    });
  }
};

// Get all safe zones for a patient
exports.getSafeZones = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const safeZones = await SafeZone.find({ patientId });
    
    res.status(200).json({
      success: true,
      count: safeZones.length,
      data: safeZones
    });
  } catch (error) {
    console.error('Get safe zones error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving safe zones'
    });
  }
};

// Update a safe zone
exports.updateSafeZone = async (req, res) => {
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
    const { name, address, radius, isActive } = req.body;
    
    const updateData = {
      updatedAt: Date.now()
    };
    
    // Update name if provided
    if (name) {
      updateData.name = name;
    }
    
    // Update radius if provided
    if (radius) {
      updateData.radius = radius;
    }
    
    // Update active status if provided
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    
    // Update address and coordinates if new address provided
    if (address) {
      const locationData = await melissaApi.addressToCoordinates(address);
      updateData.address = locationData.formattedAddress || address;
      updateData.coordinates = {
        type: 'Point',
        coordinates: locationData.coordinates
      };
    }
    
    // Find and update safe zone
    const safeZone = await SafeZone.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!safeZone) {
      return res.status(404).json({
        success: false,
        error: 'Safe zone not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: safeZone
    });
  } catch (error) {
    console.error('Update safe zone error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating safe zone'
    });
  }
};

// Delete a safe zone
exports.deleteSafeZone = async (req, res) => {
  try {
    const { id } = req.params;
    
    const safeZone = await SafeZone.findByIdAndDelete(id);
    
    if (!safeZone) {
      return res.status(404).json({
        success: false,
        error: 'Safe zone not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Safe zone deleted successfully'
    });
  } catch (error) {
    console.error('Delete safe zone error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting safe zone'
    });
  }
};
