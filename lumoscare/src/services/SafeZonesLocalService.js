import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing safe zones in AsyncStorage
const SAFE_ZONES_STORAGE_KEY = 'lumoscare_safezones';

// Get all safe zones for a specific patient
export const getSafeZones = async (patientId = null) => {
  try {
    const zonesJSON = await AsyncStorage.getItem(SAFE_ZONES_STORAGE_KEY);
    if (zonesJSON) {
      const zones = JSON.parse(zonesJSON);
      if (patientId) {
        return zones.filter(zone => zone.patientId === patientId);
      }
      return zones;
    }
    return [];
  } catch (error) {
    console.error('Error getting safe zones:', error);
    return [];
  }
};

// Get a specific safe zone by ID
export const getSafeZoneById = async (zoneId) => {
  try {
    const zonesJSON = await AsyncStorage.getItem(SAFE_ZONES_STORAGE_KEY);
    if (zonesJSON) {
      const zones = JSON.parse(zonesJSON);
      return zones.find(zone => zone.id === zoneId);
    }
    return null;
  } catch (error) {
    console.error('Error getting safe zone by ID:', error);
    return null;
  }
};

// Add a new safe zone
export const addSafeZone = async (zoneData) => {
  try {
    // Generate a unique ID
    const newZone = {
      ...zoneData,
      id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
    };
    
    // Get existing zones
    const zonesJSON = await AsyncStorage.getItem(SAFE_ZONES_STORAGE_KEY);
    let zones = [];
    if (zonesJSON) {
      zones = JSON.parse(zonesJSON);
    }
    
    // Add new zone
    zones.push(newZone);
    
    // Save updated list
    await AsyncStorage.setItem(SAFE_ZONES_STORAGE_KEY, JSON.stringify(zones));
    
    return newZone;
  } catch (error) {
    console.error('Error adding safe zone:', error);
    throw error;
  }
};

// Update an existing safe zone
export const updateSafeZone = async (zoneId, updatedData) => {
  try {
    const zonesJSON = await AsyncStorage.getItem(SAFE_ZONES_STORAGE_KEY);
    if (zonesJSON) {
      let zones = JSON.parse(zonesJSON);
      
      // Find zone index
      const zoneIndex = zones.findIndex(z => z.id === zoneId);
      
      if (zoneIndex !== -1) {
        // Update zone data
        zones[zoneIndex] = {
          ...zones[zoneIndex],
          ...updatedData,
          updatedAt: new Date().toISOString(),
        };
        
        // Save updated list
        await AsyncStorage.setItem(SAFE_ZONES_STORAGE_KEY, JSON.stringify(zones));
        return zones[zoneIndex];
      }
    }
    throw new Error('Safe zone not found');
  } catch (error) {
    console.error('Error updating safe zone:', error);
    throw error;
  }
};

// Delete a safe zone
export const deleteSafeZone = async (zoneId) => {
  try {
    const zonesJSON = await AsyncStorage.getItem(SAFE_ZONES_STORAGE_KEY);
    if (zonesJSON) {
      let zones = JSON.parse(zonesJSON);
      
      // Filter out the zone to delete
      const updatedZones = zones.filter(z => z.id !== zoneId);
      
      // Save updated list
      await AsyncStorage.setItem(SAFE_ZONES_STORAGE_KEY, JSON.stringify(updatedZones));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting safe zone:', error);
    throw error;
  }
};

// Add sample safe zones for development/demo purposes
export const addSampleSafeZones = async (patientId) => {
  const sampleZones = [
    {
      id: 'sample1',
      name: 'Home',
      address: '123 Main Street, Anytown, USA',
      latitude: 34.0522,
      longitude: -118.2437,
      radius: 100, // meters
      patientId,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample2',
      name: 'Pharmacy',
      address: '456 Health Avenue, Anytown, USA',
      latitude: 34.0589,
      longitude: -118.2552,
      radius: 50, // meters
      patientId,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample3',
      name: 'Park',
      address: '789 Green Park, Anytown, USA',
      latitude: 34.0685,
      longitude: -118.2321,
      radius: 150, // meters
      patientId,
      active: false,
      createdAt: new Date().toISOString(),
    },
  ];
  
  try {
    await AsyncStorage.setItem(SAFE_ZONES_STORAGE_KEY, JSON.stringify(sampleZones));
    return sampleZones;
  } catch (error) {
    console.error('Error adding sample safe zones:', error);
    throw error;
  }
};

// Calculate if a location is within a safe zone
export const isLocationInSafeZone = (location, zone) => {
  // Calculate distance between two coordinates in meters using Haversine formula
  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Radius of earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in meters
    return d;
  };
  
  // Calculate distance
  const distance = getDistanceFromLatLonInMeters(
    location.latitude, 
    location.longitude, 
    zone.latitude, 
    zone.longitude
  );
  
  // Check if within radius
  return distance <= zone.radius;
};