// src/services/AuthService.js

import ApiService from './ApiService';
import { ENDPOINTS } from '../config/api';

/**
 * Service for authentication-related API calls
 */
class AuthService {
  /**
   * Get Google authentication URL
   * @returns {Promise<string>} Google auth URL
   */
  static async getGoogleAuthUrl() {
    const response = await ApiService.get(ENDPOINTS.AUTH.GOOGLE);
    return response.url;
  }

  /**
   * Complete registration with temporary token
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User and token data
   */
  static async completeRegistration(userData) {
    const response = await ApiService.post(ENDPOINTS.AUTH.REGISTER, userData);
    
    // Store the authentication token
    if (response.token) {
      await ApiService.setToken(response.token);
    }
    
    return response;
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  static async getCurrentUser() {
    return ApiService.get(ENDPOINTS.USERS.ME);
  }

  /**
   * Update current user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user profile
   */
  static async updateUser(userData) {
    return ApiService.put(ENDPOINTS.USERS.ME, userData);
  }

  /**
   * Get care circle members
   * @returns {Promise<Array>} Care circle members
   */
  static async getCareCircle() {
    return ApiService.get(ENDPOINTS.USERS.CARE_CIRCLE);
  }

  /**
   * Logout current user
   */
  static async logout() {
    await ApiService.removeToken();
  }
}

export default AuthService;