// src/context/AlertsContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import AlertsService from '../services/AlertsService';

// Create a context for alerts management
const AlertsContext = createContext();

export const useAlerts = () => {
  return useContext(AlertsContext);
};

export const AlertsProvider = ({ children }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch alerts when the user changes
  useEffect(() => {
    const loadAlerts = async () => {
      if (user?.patients?.[0]?.id) {
        try {
          setLoading(true);
          setError('');
          
          // Get patient ID from the user
          const patientId = user.patients[0].id;
          
          // Load alerts for this patient from API
          const alertsData = await AlertsService.getAlerts(patientId);
          setAlerts(alertsData);
        } catch (e) {
          console.error('Failed to load alerts:', e);
          setError('Failed to load alerts');
          
          // If API fails, use mock data for demo purposes
          const now = new Date();
          
          const mockAlertsData = [
            {
              id: 'sample1',
              type: 'zone',
              message: 'Left safe zone: Home',
              details: 'Patient was detected 120 meters away from the Home safe zone boundary.',
              created: new Date(now.getTime() - 15 * 60000).toISOString(), // 15 minutes ago
              resolved: false,
              priority: 'high',
              patientId: user.patients[0].id,
            },
            {
              id: 'sample2',
              type: 'reminder',
              message: 'Missed medication: Aricept',
              details: 'Regular 2:00 PM medication was not taken.',
              created: new Date(now.getTime() - 2 * 60 * 60000).toISOString(), // 2 hours ago
              resolved: false,
              priority: 'medium',
              patientId: user.patients[0].id,
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
              patientId: user.patients[0].id,
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
              patientId: user.patients[0].id,
            },
          ];
          setAlerts(mockAlertsData);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadAlerts();
  }, [user]);
  
  // Add a new alert
  const addAlert = async (alertData) => {
    try {
      setLoading(true);
      setError('');
      
      if (user?.patients?.[0]?.id) {
        // Prepare data with patient ID
        const data = {
          ...alertData,
          patientId: user.patients[0].id,
        };
        
        try {
          // Add the alert through API
          const newAlert = await AlertsService.createAlert(data);
          
          // Update the state
          setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
          
          return newAlert;
        } catch (e) {
          console.error('API error adding alert:', e);
          
          // For demo purposes, create a mock alert if API fails
          const mockAlert = {
            ...data,
            id: Math.random().toString(36).substring(2, 15),
            created: new Date().toISOString(),
            resolved: false,
          };
          
          // Update the state with mock data
          setAlerts(prevAlerts => [mockAlert, ...prevAlerts]);
          
          return mockAlert;
        }
      } else {
        throw new Error('No patient selected');
      }
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };
  
  // Update an existing alert
  const updateAlert = async (alertId, updatedData) => {
    try {
      setLoading(true);
      setError('');
      
      try {
        // If we're updating status, use the specific endpoint
        if (updatedData.hasOwnProperty('resolved') || updatedData.hasOwnProperty('status')) {
          const status = updatedData.resolved ? 'resolved' : (updatedData.status || 'active');
          await AlertsService.updateAlertStatus(alertId, status);
        }
        
        // Get the current alert
        const currentAlert = alerts.find(a => a.id === alertId);
        
        if (!currentAlert) {
          throw new Error('Alert not found');
        }
        
        // Create updated alert object
        const updatedAlert = {
          ...currentAlert,
          ...updatedData,
          // Add resolvedAt timestamp if alert is being resolved
          ...(updatedData.resolved && !currentAlert.resolved ? { resolvedAt: new Date().toISOString() } : {}),
        };
        
        // Update the state
        setAlerts(prevAlerts => 
          prevAlerts.map(a => a.id === alertId ? updatedAlert : a)
        );
        
        return updatedAlert;
      } catch (e) {
        console.error('API error updating alert:', e);
        
        // For demo purposes, update locally if API fails
        const existingAlert = alerts.find(a => a.id === alertId);
        
        if (!existingAlert) {
          throw new Error('Alert not found');
        }
        
        const mockUpdatedAlert = {
          ...existingAlert,
          ...updatedData,
          // Add resolvedAt timestamp if alert is being resolved
          ...(updatedData.resolved && !existingAlert.resolved ? { resolvedAt: new Date().toISOString() } : {}),
        };
        
        // Update the state with mock data
        setAlerts(prevAlerts => 
          prevAlerts.map(a => a.id === alertId ? mockUpdatedAlert : a)
        );
        
        return mockUpdatedAlert;
      }
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };
  
  // Delete an alert
  const deleteAlert = async (alertId) => {
    try {
      setLoading(true);
      setError('');
      
      // For demo purposes, just delete locally since the API doesn't have a delete endpoint
      setAlerts(prevAlerts => prevAlerts.filter(a => a.id !== alertId));
      
      return true;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };
  
  // Resolve an alert
  const resolveAlert = async (alertId, notes = '') => {
    try {
      setLoading(true);
      setError('');
      
      try {
        // Use the update alert status endpoint
        await AlertsService.updateAlertStatus(alertId, 'resolved');
        
        // Get the current alert
        const currentAlert = alerts.find(a => a.id === alertId);
        
        if (!currentAlert) {
          throw new Error('Alert not found');
        }
        
        // Create resolved alert object
        const resolvedAlert = {
          ...currentAlert,
          resolved: true,
          resolvedAt: new Date().toISOString(),
          resolutionNotes: notes,
        };
        
        // Update the state
        setAlerts(prevAlerts => 
          prevAlerts.map(a => a.id === alertId ? resolvedAlert : a)
        );
        
        return resolvedAlert;
      } catch (e) {
        console.error('API error resolving alert:', e);
        
        // For demo purposes, resolve locally if API fails
        const existingAlert = alerts.find(a => a.id === alertId);
        
        if (!existingAlert) {
          throw new Error('Alert not found');
        }
        
        const mockResolvedAlert = {
          ...existingAlert,
          resolved: true,
          resolvedAt: new Date().toISOString(),
          resolutionNotes: notes,
        };
        
        // Update the state with mock data
        setAlerts(prevAlerts => 
          prevAlerts.map(a => a.id === alertId ? mockResolvedAlert : a)
        );
        
        return mockResolvedAlert;
      }
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };
  
  // Get a specific alert by ID
  const getAlertById = (alertId) => {
    return alerts.find(a => a.id === alertId) || null;
  };
  
  // Get unresolved alerts count
  const getUnresolvedCount = () => {
    return alerts.filter(a => !a.resolved).length;
  };
  
  // Context value
  const value = {
    alerts,
    loading,
    error,
    addAlert,
    updateAlert,
    deleteAlert,
    resolveAlert,
    getAlertById,
    getUnresolvedCount,
  };
  
  return (
    <AlertsContext.Provider value={value}>
      {children}
    </AlertsContext.Provider>
  );
};

export default AlertsContext;