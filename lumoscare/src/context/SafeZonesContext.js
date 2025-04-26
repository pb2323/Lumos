// src/context/SafeZonesContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import SafeZonesService from '../services/SafeZonesService';

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
          
          // Load safe zones for this patient from API
          const zonesData = await SafeZonesService.getSafeZones(patientId);
          setSafeZones(zonesData);
        } catch (e) {
          console.error('Failed to load safe zones:', e);
          setError('Failed to load safe zones');
          
          // If API fails, use mock data for demo purposes
          const mockZonesData = [
            {
              id: 'sample1',
              name: 'Home',
              address: '123 Main Street, Anytown, USA',
              latitude: 34.0522,
              longitude: -118.2437,
              radius: 100,
              patientId: user.patients[0].id,
              active: true,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'sample2',
              name: 'Pharmacy',
              address: '456 Health Avenue, Anytown, USA',
              latitude: 34.0589,
              longitude: -118.2552,
              radius: 50,
              patientId: user.patients[0].id,
              active: true,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'sample3',
              name: 'Park',
              address: '789 Green Park, Anytown, USA',
              latitude: 34.0685,
              longitude: -118.2321,
              radius: 150,
              patientId: user.patients[0].id,
              active: false,
              createdAt: new Date().toISOString(),
            },
          ];
          setSafeZones(mockZonesData);
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
        
        try {
          // Add the safe zone through API
          const newZone = await SafeZonesService.addSafeZone(data);
          
          // Update the state
          setSafeZones(prevZones => [...prevZones, newZone]);
          
          return newZone;
        } catch (e) {
          console.error('API error adding safe zone:', e);
          
          // For demo purposes, create a mock zone if API fails
          const mockZone = {
            ...data,
            id: Math.random().toString(36).substring(2, 15),
            createdAt: new Date().toISOString(),
          };
          
          // Update the state with mock data
          setSafeZones(prevZones => [...prevZones, mockZone]);
          
          return mockZone;
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
  
  // Update an existing safe zone
  const updateSafeZone = async (zoneId, updatedData) => {
    try {
      setLoading(true);
      setError('');
      
      try {
        // Update the safe zone through API
        const updatedZone = await SafeZonesService.updateSafeZone(zoneId, updatedData);
        
        // Update the state
        setSafeZones(prevZones => 
          prevZones.map(z => z.id === zoneId ? updatedZone : z)
        );
        
        return updatedZone;
      } catch (e) {
        console.error('API error updating safe zone:', e);
        
        // For demo purposes, update locally if API fails
        const existingZone = safeZones.find(z => z.id === zoneId);
        
        if (!existingZone) {
          throw new Error('Safe zone not found');
        }
        
        const mockUpdatedZone = {
          ...existingZone,
          ...updatedData,
          updatedAt: new Date().toISOString(),
        };
        
        // Update the state with mock data
        setSafeZones(prevZones => 
          prevZones.map(z => z.id === zoneId ? mockUpdatedZone : z)
        );
        
        return mockUpdatedZone;
      }
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
      
      try {
        // Delete the safe zone through API
        await SafeZonesService.deleteSafeZone(zoneId);
        
        // Update the state
        setSafeZones(prevZones => prevZones.filter(z => z.id !== zoneId));
        
        return true;
      } catch (e) {
        console.error('API error deleting safe zone:', e);
        
        // For demo purposes, delete locally if API fails
        setSafeZones(prevZones => prevZones.filter(z => z.id !== zoneId));
        
        return true;
      }
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