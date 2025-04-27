// src/context/AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/AuthService';
import GoogleAuth from '../utils/GoogleAuth';

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
        
        // Verify token with backend and get fresh user data
        try {
          const userData = await AuthService.getCurrentUser();
          setUser(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        } catch (e) {
          // If API call fails, the token might be invalid, so log out
          console.log('Failed to validate token:', e);
          await AsyncStorage.removeItem('user');
          await AuthService.logout();
          setUser(null);
        }
      } catch (e) {
        console.error('Failed to load user data from storage', e);
      } finally {
        setLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  // Google Sign-In function
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Start Google Sign-In flow
      const result = await GoogleAuth.signIn();
      
      if (!result) {
        throw new Error('Sign in was cancelled or failed');
      }
      
      if (result.tempToken) {
        // Complete registration with backend - in a real app, this would
        // collect additional info like type (caregiver/patient)
        const userData = {
          tempToken: result.tempToken,
          type: 'caregiver',
          firstName: 'John', // In real app, get from form
          lastName: 'Smith', // In real app, get from form
          phone: '+1234567890', // In real app, get from form
        };
        
        const response = await AuthService.completeRegistration(userData);
        
        if (response.user && response.token) {
          setUser(response.user);
          await AsyncStorage.setItem('user', JSON.stringify(response.user));
          return true;
        }
      } else {
        // For demo purposes, create mock user data if backend integration not available
        const mockUserData = {
          id: 'user123',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com',
          role: 'caregiver',
          patients: [
            {
              id: 'patient456',
              name: 'Elizabeth Smith',
              relationship: 'Mother'
            }
          ]
        };
        
        setUser(mockUserData);
        await AsyncStorage.setItem('user', JSON.stringify(mockUserData));
        return true;
      }
      
      return false;
    } catch (e) {
      console.error('Sign in error:', e);
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Legacy login function for development/demo
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError('');
      
      // For development/demo purposes only
      if (email && password) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock user data
        const userData = {
          id: 'user123',
          firstName: 'John',
          lastName: 'Smith',
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

  // Register function - legacy for demo
  const register = async (name, email, password) => {
    try {
      setLoading(true);
      setError('');
      
      // For demo purposes only
      if (name && email && password) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock user data after registration
        const userData = {
          id: 'user123',
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' '),
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
      await AuthService.logout();
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
    signInWithGoogle,
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