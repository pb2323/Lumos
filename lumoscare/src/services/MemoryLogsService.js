// src/services/MemoryLogsService.js

import ApiService from './ApiService';
import { ENDPOINTS } from '../config/api';

/**
 * Service for memory logs API calls
 */
class MemoryLogsService {
  /**
   * Get memory logs for a patient
   * @param {string} patientId - Patient ID
   * @param {Object} params - Query parameters (type, limit, page)
   * @returns {Promise<Array>} List of memory logs
   */
  static async getPatientLogs(patientId, params = {}) {
    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const endpoint = `${ENDPOINTS.MEMORY_LOGS.BY_PATIENT(patientId)}${queryString ? `?${queryString}` : ''}`;
    
    return ApiService.get(endpoint);
  }

  /**
   * Get memory logs for a recognized person
   * @param {string} personId - Recognized person ID
   * @param {Object} params - Query parameters (limit, page)
   * @returns {Promise<Array>} List of memory logs
   */
  static async getPersonLogs(personId, params = {}) {
    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const endpoint = `${ENDPOINTS.MEMORY_LOGS.BY_PERSON(personId)}${queryString ? `?${queryString}` : ''}`;
    
    return ApiService.get(endpoint);
  }

  /**
   * Create a new memory log
   * @param {Object} logData - Memory log data
   * @returns {Promise<Object>} Created memory log data
   */
  static async createMemoryLog(logData) {
    return ApiService.post(ENDPOINTS.MEMORY_LOGS.BASE, logData);
  }
}

export default MemoryLogsService;