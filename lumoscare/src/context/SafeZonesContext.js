import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as SafeZonesService from '../services/SafeZonesService';

// Create a context for safe zones management
const SafeZonesContext = createContext();

export const useSafeZones = () => {
  return useContext(SafeZonesContext);
};

export const SafeZonesProvider = ({ children }) => {
  const { user } = useAuth();
  const [safeZones, setSafeZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch safe zones when the user changes
  useEffect(() => {
    const loadSafeZones = async () => {
      if (user?.patients?.[0]?.id) {
        try {
          setLoading(true);
          setError('');
          
          // Get patient ID from the user
          const patientId = user.patients[0].id;
          
          // Load safe zones for this patient
          let zonesData = await SafeZonesService.getSafeZones(patientId);
          
          // If no zones are found, add sample data for demonstration
          if (zonesData.length === 0) {
            zonesData = await SafeZonesService.addSampleSafeZones(patientId);
          }
          
          setSafeZones(zonesData);
        } catch (e) {
          console.error('Failed to load safe zones:', e);
          setError('Failed to load safe zones');
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadSafeZones();
  }, [user]);
  
  // Add a new safe zone
  const addSafeZone = async (zoneData) => {
    try {
      setLoading(true);
      setError('');
      
      if (user?.patients?.[0]?.id) {
        // Prepare data with patient ID
        const data = {
          ...zoneData,
          patientId: user.patients[0].id,
        };
        
        // Add the safe zone
        const newZone = await SafeZonesService.addSafeZone(data);
        
        // Update the state
        setSafeZones(prevZones => [...prevZones, newZone]);
        
        return newZone;
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
  
  // Update an existing safe zone
  const updateSafeZone = async (zoneId, updatedData) => {
    try {
      setLoading(true);
      setError('');
      
      // Update the safe zone
      const updatedZone = await SafeZonesService.updateSafeZone(zoneId, updatedData);
      
      // Update the state
      setSafeZones(prevZones => 
        prevZones.map(z => z.id === zoneId ? updatedZone : z)
      );
      
      return updatedZone;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a safe zone
  const deleteSafeZone = async (zoneId) => {
    try {
      setLoading(true);
      setError('');
      
      // Delete the safe zone
      await SafeZonesService.deleteSafeZone(zoneId);
      
      // Update the state
      setSafeZones(prevZones => prevZones.filter(z => z.id !== zoneId));
      
      return true;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };
  
  // Get a specific safe zone by ID
  const getSafeZoneById = (zoneId) => {
    return safeZones.find(z => z.id === zoneId) || null;
  };
  
  // Context value
  const value = {
    safeZones,
    loading,
    error,
    addSafeZone,
    updateSafeZone,
    deleteSafeZone,
    getSafeZoneById,
  };
  
  return (
    <SafeZonesContext.Provider value={value}>
      {children}
    </SafeZonesContext.Provider>
  );
};

export default SafeZonesContext;