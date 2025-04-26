const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Get Google OAuth login URL
exports.getGoogleAuthUrl = (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
    redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/google/callback`
  });

  res.status(200).json({
    success: true,
    url: authUrl
  });
};

// Google OAuth callback
exports.googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }
    
    // Exchange code for tokens
    const { tokens } = await client.getToken({
      code,
      redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/google/callback`
    });
    
    // Verify ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    // Check if user exists in our database
    let user = await User.findOne({ uid: payload.sub });
    
    if (!user) {
      // If user doesn't exist, ask user to complete registration
      // We'll create a temporary JWT token that expires in 15 minutes
      const tempToken = jwt.sign(
        {
          sub: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          isTemp: true
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      
      // Redirect to registration page with temp token
      return res.redirect(`/register?token=${tempToken}`);
    }
    
    // If user exists, create and return JWT token
    const token = jwt.sign(
      { id: user._id, uid: user.uid },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.redirect(`/login-success?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect('/login-error');
  }
};

// Complete registration with Google data
exports.completeRegistration = async (req, res) => {
  try {
    const { tempToken, type, firstName, lastName, phone, patientId } = req.body;
    
    if (!tempToken) {
      return res.status(400).json({
        success: false,
        error: 'Temporary token is required'
      });
    }
    
    // Check if token is properly formatted
    if (typeof tempToken !== 'string' || !tempToken.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token format'
      });
    }
    
    // Verify temporary token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    if (!decoded.isTemp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid temporary token'
      });
    }
    
    // Create new user
    const user = new User({
      uid: decoded.sub,
      type,
      email: decoded.email,
      firstName: firstName || decoded.name.split(' ')[0],
      lastName: lastName || decoded.name.split(' ').slice(1).join(' '),
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
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, uid: user.uid },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      success: true,
      token,
      data: user
    });
  } catch (error) {
    console.error('Registration completion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during registration completion'
    });
  }
};
