// src/utils/LocationUtils.js

import * as Location from 'expo-location';

// Maximum results to return for geocoding
const MAX_RESULTS = 5;

/**
 * Geocode an address string to coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise<Object>} Location object with coordinates
 */
export const geocodeAddress = async (address) => {
  try {
    const results = await Location.geocodeAsync(address);
    
    if (results && results.length > 0) {
      return {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      };
    }
    
    throw new Error('Address not found');
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
};

/**
 * Reverse geocode coordinates to an address
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<string>} Formatted address
 */
export const reverseGeocodeCoordinates = async (latitude, longitude) => {
  try {
    const results = await Location.reverseGeocodeAsync(
      { latitude, longitude },
      { useGoogleMaps: false }
    );
    
    if (results && results.length > 0) {
      const location = results[0];
      
      // Format the address
      const addressParts = [];
      
      if (location.name) addressParts.push(location.name);
      if (location.street) {
        const streetAddress = location.streetNumber
          ? `${location.streetNumber} ${location.street}`
          : location.street;
        addressParts.push(streetAddress);
      }
      if (location.city) addressParts.push(location.city);
      if (location.region) addressParts.push(location.region);
      if (location.postalCode) addressParts.push(location.postalCode);
      if (location.country) addressParts.push(location.country);
      
      return addressParts.join(', ');
    }
    
    throw new Error('Could not reverse geocode coordinates');
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error;
  }
};

/**
 * Get the current device location
 * @returns {Promise<Object>} Location object with coordinates
 */
export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    throw error;
  }
};

/**
 * Calculate distance between two coordinates in meters
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in meters
 */
export const getDistanceBetweenCoordinates = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
};

/**
 * Check if a location is within a circular geofence
 * @param {Object} location - Location coordinates {latitude, longitude}
 * @param {Object} geofence - Geofence {latitude, longitude, radius}
 * @returns {boolean} True if location is within geofence
 */
export const isLocationInGeofence = (location, geofence) => {
  const distance = getDistanceBetweenCoordinates(
    location.latitude,
    location.longitude,
    geofence.latitude,
    geofence.longitude
  );
  
  return distance <= geofence.radius;
};