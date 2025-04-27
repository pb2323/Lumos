import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing alerts in AsyncStorage
const ALERTS_STORAGE_KEY = 'lumoscare_alerts';

// Get all alerts for a specific patient
export const getAlerts = async (patientId) => {
  try {
    const alertsJSON = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
    if (alertsJSON) {
      const alerts = JSON.parse(alertsJSON);
      return alerts
        .filter(alert => alert.patientId === patientId)
        .sort((a, b) => new Date(b.created) - new Date(a.created)); // Sort by date, newest first
    }
    return [];
  } catch (error) {
    console.error('Error getting alerts:', error);
    return [];
  }
};

// Get a specific alert by ID
export const getAlertById = async (alertId) => {
  try {
    const alertsJSON = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
    if (alertsJSON) {
      const alerts = JSON.parse(alertsJSON);
      return alerts.find(alert => alert.id === alertId);
    }
    return null;
  } catch (error) {
    console.error('Error getting alert by ID:', error);
    return null;
  }
};

// Add a new alert
export const addAlert = async (alertData) => {
  try {
    // Generate a unique ID
    const newAlert = {
      ...alertData,
      id: Math.random().toString(36).substring(2, 15),
      created: new Date().toISOString(),
      resolved: false,
    };
    
    // Get existing alerts
    const alertsJSON = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
    let alerts = [];
    if (alertsJSON) {
      alerts = JSON.parse(alertsJSON);
    }
    
    // Add new alert
    alerts.push(newAlert);
    
    // Save updated list
    await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    
    return newAlert;
  } catch (error) {
    console.error('Error adding alert:', error);
    throw error;
  }
};

// Update an existing alert
export const updateAlert = async (alertId, updatedData) => {
  try {
    const alertsJSON = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
    if (alertsJSON) {
      let alerts = JSON.parse(alertsJSON);
      
      // Find alert index
      const alertIndex = alerts.findIndex(a => a.id === alertId);
      
      if (alertIndex !== -1) {
        // Update alert data
        alerts[alertIndex] = {
          ...alerts[alertIndex],
          ...updatedData,
          updatedAt: new Date().toISOString(),
        };
        
        // Save updated list
        await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
        return alerts[alertIndex];
      }
    }
    throw new Error('Alert not found');
  } catch (error) {
    console.error('Error updating alert:', error);
    throw error;
  }
};

// Delete an alert
export const deleteAlert = async (alertId) => {
  try {
    const alertsJSON = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
    if (alertsJSON) {
      let alerts = JSON.parse(alertsJSON);
      
      // Filter out the alert to delete
      const updatedAlerts = alerts.filter(a => a.id !== alertId);
      
      // Save updated list
      await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting alert:', error);
    throw error;
  }
};

// Mark an alert as resolved
export const resolveAlert = async (alertId, notes = '') => {
  try {
    return await updateAlert(alertId, {
      resolved: true,
      resolvedAt: new Date().toISOString(),
      resolutionNotes: notes,
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    throw error;
  }
};

// Add sample alerts for development/demo purposes
export const addSampleAlerts = async (patientId) => {
  const now = new Date();
  
  const sampleAlerts = [
    {
      id: 'sample1',
      type: 'zone',
      message: 'Left safe zone: Home',
      details: 'Patient was detected 120 meters away from the Home safe zone boundary.',
      created: new Date(now.getTime() - 15 * 60000).toISOString(), // 15 minutes ago
      resolved: false,
      priority: 'high',
      patientId,
    },
    {
      id: 'sample2',
      type: 'reminder',
      message: 'Missed medication: Aricept',
      details: 'Regular 2:00 PM medication was not taken.',
      created: new Date(now.getTime() - 2 * 60 * 60000).toISOString(), // 2 hours ago
      resolved: false,
      priority: 'medium',
      patientId,
    },
    {
      id: 'sample3',
      type: 'system',
      message: 'Low battery on Spectacles',
      details: 'Battery level is at 15%. Please charge soon.',
      created: new Date(now.getTime() - 3 * 60 * 60000).toISOString(), // 3 hours ago
      resolved: true,
      resolvedAt: new Date(now.getTime() - 2.5 * 60 * 60000).toISOString(), // 2.5 hours ago
      resolutionNotes: 'Charging cable connected.',
      priority: 'low',
      patientId,
    },
    {
      id: 'sample4',
      type: 'zone',
      message: 'Approaching safe zone boundary: Pharmacy',
      details: 'Patient is 10 meters from the boundary of the Pharmacy safe zone.',
      created: new Date(now.getTime() - 1 * 24 * 60 * 60000).toISOString(), // 1 day ago
      resolved: true,
      resolvedAt: new Date(now.getTime() - 23 * 60 * 60000).toISOString(), // 23 hours ago
      resolutionNotes: 'Patient returned to safe zone.',
      priority: 'medium',
      patientId,
    },
  ];
  
  try {
    await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(sampleAlerts));
    return sampleAlerts;
  } catch (error) {
    console.error('Error adding sample alerts:', error);
    throw error;
  }
};