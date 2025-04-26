const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify Google ID token
exports.verifyGoogleToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Authorization Header:', req.headers.authorization);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No token provided'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    req.user = {
      uid: payload.sub,  // Google's user ID
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid token'
    });
  }
};

// Check if user exists in our database
exports.checkUserExists = async (req, res, next) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found in database'
      });
    }
    
    // Add user object to request
    req.dbUser = user;
    next();
  } catch (error) {
    console.error('User check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during user verification'
    });
  }
};

// Check if user is a caregiver
exports.requireCaregiver = async (req, res, next) => {
  if (req.dbUser.type !== 'caregiver') {
    return res.status(403).json({
      success: false,
      error: 'Access denied - Caregiver privileges required'
    });
  }
  next();
};