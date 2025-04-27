// src/services/AlertsService.js

import ApiService from './ApiService';
import { ENDPOINTS } from '../config/api';
import * as AlertsLocalService from './AlertsLocalService';
import SyncManager from '../utils/SyncManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service for alerts API calls
 * with local storage fallback for offline use
 */
class AlertsService {
  /**
   * Get alerts for a patient
   * @param {string} patientId - Patient ID
   * @param {Object} params - Query parameters (status, type, limit, page)
   * @returns {Promise<Array>} List of alerts
   */
  static async getAlerts(patientId, params = {}) {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = `${ENDPOINTS.ALERTS.BY_PATIENT(patientId)}${queryString ? `?${queryString}` : ''}`;
      
      // Try to get from API first
      const alerts = await ApiService.get(endpoint);
      
      // Cache the result locally
      await this.cacheLocalAlerts(alerts, patientId);
      
      return alerts;
    } catch (error) {
      console.log('API error in getAlerts, using local data:', error);
      
      // Fall back to local storage with filtering
      const statusParam = params.status === 'resolved' ? true : 
                         (params.status === 'active' ? false : undefined);
      
      // Get all alerts for patient
      let localAlerts = await AlertsLocalService.getAlerts(patientId);
      
      // Apply status filter if defined
      if (statusParam !== undefined) {
        localAlerts = localAlerts.filter(alert => alert.resolved === statusParam);
      }
      
      // Apply type filter if defined
      if (params.type) {
        localAlerts = localAlerts.filter(alert => alert.type === params.type);
      }
      
      // Apply pagination if requested
      if (params.limit && params.page) {
        const limit = parseInt(params.limit);
        const page = parseInt(params.page);
        const start = (page - 1) * limit;
        const end = start + limit;
        
        localAlerts = localAlerts.slice(start, end);
      }
      
      return localAlerts;
    }
  }

  /**
   * Cache alerts data locally
   * @param {Array} alerts - Alerts data to cache
   * @param {string} patientId - Patient ID for filtering
   */
  static async cacheLocalAlerts(alerts, patientId) {
    try {
      // We need to get all existing alerts first
      const alertsJSON = await AsyncStorage.getItem('lumoscare_alerts');
      let allAlerts = [];
      
      if (alertsJSON) {
        allAlerts = JSON.parse(alertsJSON);
        // Filter out alerts for this patient
        allAlerts = allAlerts.filter(a => a.patientId !== patientId);
      }
      
      // Add in the new alerts from the API
      allAlerts = [...allAlerts, ...alerts];
      
      // Save back to storage
      await AsyncStorage.setItem('lumoscare_alerts', JSON.stringify(allAlerts));
    } catch (error) {
      console.error('Error caching alerts data locally:', error);
    }
  }

  /**
   * Create a new alert
   * @param {Object} alertData - Alert data
   * @returns {Promise<Object>} Created alert data
   */
  static async createAlert(alertData) {
    try {
      // Try to create via API first
      const newAlert = await ApiService.post(ENDPOINTS.ALERTS.BASE, alertData);
      
      // Update local storage cache
      await AlertsLocalService.addAlert(newAlert);
      
      return newAlert;
    } catch (error) {
      console.log('API error in createAlert, using local storage:', error);
      
      // Create locally
      const localAlert = await AlertsLocalService.addAlert(alertData);
      
      // Store for later sync
      SyncManager.storePendingOperation('alert', 'create', localAlert);
      
      return localAlert;
    }
  }

  /**
   * Update alert status
   * @param {string} alertId - Alert ID
   * @param {string} status - New status (acknowledged, resolved, etc.)
   * @returns {Promise<Object>} Updated alert data
   */
  static async updateAlertStatus(alertId, status) {
    try {
      // Try to update via API first
      const updatedAlert = await ApiService.put(
        ENDPOINTS.ALERTS.STATUS(alertId), 
        { status }
      );
      
      // Update local storage cache - map API status to local resolved flag
      const isResolved = status === 'resolved';
      const updateData = {
        resolved: isResolved,
        status: status,
        ...(isResolved ? { resolvedAt: new Date().toISOString() } : {})
      };
      
      await AlertsLocalService.updateAlert(alertId, updateData);
      
      return updatedAlert;
    } catch (error) {
      console.log('API error in updateAlertStatus, using local storage:', error);
      
      // Update locally based on status
      const isResolved = status === 'resolved';
      const updateData = {
        resolved: isResolved,
        status: status,
        ...(isResolved ? { resolvedAt: new Date().toISOString() } : {})
      };
      
      const localUpdatedAlert = await AlertsLocalService.updateAlert(alertId, updateData);
      
      // Store for later sync
      SyncManager.storePendingOperation(
        'alert', 
        'update', 
        { id: alertId, status }
      );
      
      return localUpdatedAlert;
    }
  }

  /**
   * Resolve an alert
   * @param {string} alertId - Alert ID
   * @param {string} notes - Resolution notes
   * @returns {Promise<Object>} Resolved alert
   */
  static async resolveAlert(alertId, notes = '') {
    try {
      // Try to update via API first
      const updatedAlert = await ApiService.put(
        ENDPOINTS.ALERTS.STATUS(alertId), 
        { status: 'resolved' }
      );
      
      // Update local storage cache
      await AlertsLocalService.resolveAlert(alertId, notes);
      
      return updatedAlert;
    } catch (error) {
      console.log('API error in resolveAlert, using local storage:', error);
      
      // Resolve locally
      const localResolvedAlert = await AlertsLocalService.resolveAlert(alertId, notes);
      
      // Store for later sync
      SyncManager.storePendingOperation(
        'alert', 
        'update', 
        { id: alertId, status: 'resolved', resolutionNotes: notes }
      );
      
      return localResolvedAlert;
    }
  }

  /**
   * Create medication reminder
   * @param {Object} reminderData - Medication reminder data
   * @returns {Promise<Object>} Created reminder data
   */
  static async createMedicationReminder(reminderData) {
    try {
      return await ApiService.post(ENDPOINTS.AGENT.MEDICATION_REMINDER, reminderData);
    } catch (error) {
      console.error('Error creating medication reminder:', error);
      
      // For medication reminders, we can create a regular alert as fallback
      if (reminderData.patientId) {
        const alertData = {
          patientId: reminderData.patientId,
          type: 'medication',
          message: `Medication Reminder: ${reminderData.medicationData?.name || 'Medication'}`,
          details: `Take ${reminderData.medicationData?.dosage || ''} ${
            reminderData.medicationData?.instructions 
              ? `(${reminderData.medicationData.instructions})` 
              : ''
          }`,
          priority: 'medium',
          metadata: reminderData.medicationData,
        };
        
        return this.createAlert(alertData);
      }
      
      throw error;
    }
  }

  /**
   * Add sample alerts (for development/testing)
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Sample alerts data
   */
  static async addSampleAlerts(patientId) {
    return AlertsLocalService.addSampleAlerts(patientId);
  }
}

export default AlertsService;