const axios = require('axios');

// Base URL for Melissa Global Address API
const BASE_URL = 'https://address.melissadata.net/v3/WEB/GlobalAddress';

// Convert address to coordinates
const addressToCoordinates = async (address) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        id: process.env.MELISSA_API_KEY,
        format: 'json',
        a1: address,
        ctry: 'USA'
      }
    });

    if (response.data && response.data.Records && response.data.Records.length > 0) {
      const record = response.data.Records[0];
      
      // Check if we have coordinates
      if (record.Latitude && record.Longitude) {
        return {
          coordinates: [parseFloat(record.Longitude), parseFloat(record.Latitude)],
          formattedAddress: `${record.AddressLine1}, ${record.Locality}, ${record.AdministrativeArea} ${record.PostalCode}`
        };
      }
    }
    
    throw new Error('Unable to geocode address');
  } catch (error) {
    console.error('Melissa API error:', error);
    throw new Error('Error converting address to coordinates');
  }
};

// Calculate distance between two sets of coordinates (in meters)
// Using Haversine formula
const calculateDistance = (coord1, coord2) => {
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
};

// Check if a location is within a safe zone
const isWithinSafeZone = (location, safeZone) => {
  const distance = calculateDistance(
    location.coordinates,
    safeZone.coordinates.coordinates
  );
  
  return distance <= safeZone.radius;
};

module.exports = {
  addressToCoordinates,
  calculateDistance,
  isWithinSafeZone
};
