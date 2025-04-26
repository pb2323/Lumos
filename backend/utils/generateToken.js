const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Function to generate a temporary token for testing
const generateTempToken = () => {
  // Mock user data similar to what would come from Google OAuth
  const userData = {
    sub: 'google-oauth2|123456789', // Mock Google user ID
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/profile.jpg',
    isTemp: true // This flag indicates it's a temporary token
  };

  // Sign the token with JWT_SECRET (from .env)
  const token = jwt.sign(
    userData,
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // 15 minutes expiry, matching your auth flow
  );

  return token;
};

// Generate and print the token when this script is run directly
if (require.main === module) {
  const token = generateTempToken();
  console.log('Generated temporary token:');
  console.log(token);
}

module.exports = { generateTempToken };