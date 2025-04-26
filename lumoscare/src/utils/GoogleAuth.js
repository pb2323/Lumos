// src/utils/GoogleAuth.js

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Random from 'expo-random';
import { Platform } from 'react-native';
import AuthService from '../services/AuthService';

// Register for redirects on web
WebBrowser.maybeCompleteAuthSession();

// Constants for Google Auth
const GOOGLE_CLIENT_ID = {
  ios: 'YOUR_IOS_CLIENT_ID', // Replace with your actual client ID
  android: 'YOUR_ANDROID_CLIENT_ID', // Replace with your actual client ID
  web: 'YOUR_WEB_CLIENT_ID', // Replace with your actual client ID
};

// Discovery document for Google
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

/**
 * Google Authentication helper class
 */
class GoogleAuth {
  static getClientId() {
    if (Platform.OS === 'ios') return GOOGLE_CLIENT_ID.ios;
    if (Platform.OS === 'android') return GOOGLE_CLIENT_ID.android;
    return GOOGLE_CLIENT_ID.web;
  }
  
  /**
   * Start the Google Sign In flow
   * @returns {Promise<Object>} Authentication result
   */
  static async signIn() {
    try {
      // Get the Google Auth URL from backend
      const response = await AuthService.getGoogleAuthUrl();
      const googleAuthUrl = response.url;
      
      // For direct backend integration
      if (googleAuthUrl) {
        // Open the Google Auth URL in a browser
        const result = await WebBrowser.openAuthSessionAsync(googleAuthUrl);
        
        // Handle redirection
        if (result.type === 'success') {
          const { url } = result;
          
          // Extract temporary token from URL
          // URL format: YOUR_REDIRECT_URI?token=TEMP_TOKEN
          const tempToken = extractTokenFromUrl(url);
          
          if (tempToken) {
            return { tempToken };
          }
        }
      } 
      // Fallback to direct Expo Auth Session if backend integration is unavailable
      else {
        // Generate a random state parameter
        const bytes = await Random.getRandomBytesAsync(16);
        const state = Array.from(bytes)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
        
        // Create the auth request
        const request = new AuthSession.AuthRequest({
          clientId: this.getClientId(),
          scopes: ['profile', 'email'],
          state,
        });
        
        // Prompt the user to authenticate
        const result = await request.promptAsync(discovery);
        
        if (result.type === 'success') {
          const { authentication } = result;
          
          // For demo purposes, we'll create a mock response
          return {
            tempToken: 'mock_temp_token',
            idToken: authentication.idToken,
            accessToken: authentication.accessToken,
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  }
}

/**
 * Extract token from URL
 * @param {string} url - Redirect URL with token
 * @returns {string|null} Extracted token or null
 */
function extractTokenFromUrl(url) {
  // Parse URL parameters
  const params = new URLSearchParams(url.split('?')[1]);
  return params.get('token');
}

export default GoogleAuth;