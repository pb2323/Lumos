import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as PeopleService from '../services/PeopleService';

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
          
          // Load people for this patient
          let peopleData = await PeopleService.getPeople(patientId);
          
          // If no people are found, add sample data for demonstration
          if (peopleData.length === 0) {
            peopleData = await PeopleService.addSamplePeople(patientId);
          }
          
          setPeople(peopleData);
        } catch (e) {
          console.error('Failed to load people:', e);
          setError('Failed to load people');
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
        
        // Add the person
        const newPerson = await PeopleService.addPerson(data);
        
        // Update the state
        setPeople(prevPeople => [...prevPeople, newPerson]);
        
        return newPerson;
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
      
      // Update the person
      const updatedPerson = await PeopleService.updatePerson(personId, updatedData);
      
      // Update the state
      setPeople(prevPeople => 
        prevPeople.map(p => p.id === personId ? updatedPerson : p)
      );
      
      return updatedPerson;
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
      
      // Delete the person
      await PeopleService.deletePerson(personId);
      
      // Update the state
      setPeople(prevPeople => prevPeople.filter(p => p.id !== personId));
      
      return true;
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