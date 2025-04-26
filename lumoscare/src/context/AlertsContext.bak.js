import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as AlertsService from '../services/AlertsService';

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
          
          // Load alerts for this patient
          let alertsData = await AlertsService.getAlerts(patientId);
          
          // If no alerts are found, add sample data for demonstration
          if (alertsData.length === 0) {
            alertsData = await AlertsService.addSampleAlerts(patientId);
          }
          
          setAlerts(alertsData);
        } catch (e) {
          console.error('Failed to load alerts:', e);
          setError('Failed to load alerts');
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
        
        // Add the alert
        const newAlert = await AlertsService.addAlert(data);
        
        // Update the state
        setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
        
        return newAlert;
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
      
      // Update the alert
      const updatedAlert = await AlertsService.updateAlert(alertId, updatedData);
      
      // Update the state
      setAlerts(prevAlerts => 
        prevAlerts.map(a => a.id === alertId ? updatedAlert : a)
      );
      
      return updatedAlert;
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
      
      // Delete the alert
      await AlertsService.deleteAlert(alertId);
      
      // Update the state
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
      
      // Resolve the alert
      const updatedAlert = await AlertsService.resolveAlert(alertId, notes);
      
      // Update the state
      setAlerts(prevAlerts => 
        prevAlerts.map(a => a.id === alertId ? updatedAlert : a)
      );
      
      return updatedAlert;
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