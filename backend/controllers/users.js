const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create a new user
exports.createUser = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { type, email, firstName, lastName, phone, patientId } = req.body;
    
    // Create user in our database
    const user = new User({
      uid: req.user.uid,
      type,
      email,
      firstName,
      lastName,
      phone,
      patientId
    });

    await user.save();

    // If this is a caregiver linked to a patient, update the patient's careCircle
    if (type === 'caregiver' && patientId) {
      await User.findByIdAndUpdate(patientId, {
        $push: { careCircle: user._id }
      });
    }

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during user creation'
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = req.dbUser;
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving user'
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { firstName, lastName, phone } = req.body;
    
    // Find and update user
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { 
        firstName, 
        lastName, 
        phone,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating user'
    });
  }
};

// Get care circle (for patients)
exports.getCareCircle = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
      .populate('careCircle', 'firstName lastName email phone');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user.careCircle
    });
  } catch (error) {
    console.error('Get care circle error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving care circle'
    });
  }
};
