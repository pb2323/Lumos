import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the Authentication Context
const AuthContext = createContext();

// Custom hook for using the Auth Context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check for stored user credentials on app startup
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load user data from storage', e);
      } finally {
        setLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError('');
      
      // In a real app, this would be an API call
      // For now, we'll simulate a successful login with dummy data
      if (email && password) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock user data
        const userData = {
          id: 'user123',
          name: 'John Smith',
          email: email,
          role: 'caregiver',
          patients: [
            {
              id: 'patient456',
              name: 'Elizabeth Smith',
              relationship: 'Mother'
            }
          ]
        };
        
        // Store user in state and AsyncStorage
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        return true;
      } else {
        throw new Error('Email and password are required');
      }
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name, email, password) => {
    try {
      setLoading(true);
      setError('');
      
      // In a real app, this would be an API call
      if (name && email && password) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock user data after registration
        const userData = {
          id: 'user123',
          name: name,
          email: email,
          role: 'caregiver',
          patients: []
        };
        
        // Store user in state and AsyncStorage
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        return true;
      } else {
        throw new Error('All fields are required');
      }
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      // Clear user from state and AsyncStorage
      setUser(null);
      await AsyncStorage.removeItem('user');
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setLoading(false);
    }
  };

  // The context value
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;