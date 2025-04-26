// src/context/PeopleContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import PeopleService from '../services/PeopleService';

// Create a context for people management
const PeopleContext = createContext();

export const usePeople = () => {
  return useContext(PeopleContext);
};

export const PeopleProvider = ({ children }) => {
  const { user } = useAuth();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch people when the user changes
  useEffect(() => {
    const loadPeople = async () => {
      if (user?.patients?.[0]?.id) {
        try {
          setLoading(true);
          setError('');
          
          // Get patient ID from the user
          const patientId = user.patients[0].id;
          
          // Load people for this patient from API
          const peopleData = await PeopleService.getPeople(patientId);
          setPeople(peopleData);
        } catch (e) {
          console.error('Failed to load people:', e);
          setError('Failed to load people');
          
          // If API fails, use mock data for demo purposes
          const mockPeopleData = [
            {
              id: 'sample1',
              name: 'Sarah Johnson',
              relationship: 'Daughter',
              photoUrl: null,
              notes: 'Has two children named Emma and Jack',
              lastInteraction: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              patientId: user.patients[0].id,
            },
            {
              id: 'sample2',
              name: 'Michael Smith',
              relationship: 'Son',
              photoUrl: null,
              notes: 'Lives in Chicago, visits monthly',
              lastInteraction: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              patientId: user.patients[0].id,
            },
            {
              id: 'sample3',
              name: 'Robert Adams',
              relationship: 'Friend',
              photoUrl: null,
              notes: 'Plays chess together every Sunday',
              lastInteraction: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              patientId: user.patients[0].id,
            },
          ];
          setPeople(mockPeopleData);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadPeople();
  }, [user]);
  
  // Add a new person
  const addPerson = async (personData) => {
    try {
      setLoading(true);
      setError('');
      
      if (user?.patients?.[0]?.id) {
        // Prepare data with patient ID
        const data = {
          ...personData,
          patientId: user.patients[0].id,
        };
        
        try {
          // Add the person through API
          const newPerson = await PeopleService.addPerson(data);
          
          // Update the state
          setPeople(prevPeople => [...prevPeople, newPerson]);
          
          return newPerson;
        } catch (e) {
          console.error('API error adding person:', e);
          
          // For demo purposes, create a mock person if API fails
          const mockPerson = {
            ...data,
            id: Math.random().toString(36).substring(2, 15),
            lastInteraction: new Date().toISOString()
          };
          
          // Update the state with mock data
          setPeople(prevPeople => [...prevPeople, mockPerson]);
          
          return mockPerson;
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
  
  // Update an existing person
  const updatePerson = async (personId, updatedData) => {
    try {
      setLoading(true);
      setError('');
      
      try {
        // Update the person through API
        const updatedPerson = await PeopleService.updatePerson(personId, updatedData);
        
        // Update the state
        setPeople(prevPeople => 
          prevPeople.map(p => p.id === personId ? updatedPerson : p)
        );
        
        return updatedPerson;
      } catch (e) {
        console.error('API error updating person:', e);
        
        // For demo purposes, update locally if API fails
        const existingPerson = people.find(p => p.id === personId);
        
        if (!existingPerson) {
          throw new Error('Person not found');
        }
        
        const mockUpdatedPerson = {
          ...existingPerson,
          ...updatedData,
        };
        
        // Update the state with mock data
        setPeople(prevPeople => 
          prevPeople.map(p => p.id === personId ? mockUpdatedPerson : p)
        );
        
        return mockUpdatedPerson;
      }
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a person
  const deletePerson = async (personId) => {
    try {
      setLoading(true);
      setError('');
      
      try {
        // Delete the person through API
        await PeopleService.deletePerson(personId);
        
        // Update the state
        setPeople(prevPeople => prevPeople.filter(p => p.id !== personId));
        
        return true;
      } catch (e) {
        console.error('API error deleting person:', e);
        
        // For demo purposes, delete locally if API fails
        setPeople(prevPeople => prevPeople.filter(p => p.id !== personId));
        
        return true;
      }
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };
  
  // Get a specific person by ID
  const getPersonById = (personId) => {
    return people.find(p => p.id === personId) || null;
  };
  
  // Context value
  const value = {
    people,
    loading,
    error,
    addPerson,
    updatePerson,
    deletePerson,
    getPersonById,
  };
  
  return (
    <PeopleContext.Provider value={value}>
      {children}
    </PeopleContext.Provider>
  );
};

export default PeopleContext;