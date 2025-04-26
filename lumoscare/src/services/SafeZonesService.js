// src/services/SafeZonesService.js

import ApiService from './ApiService';
import { ENDPOINTS } from '../config/api';
import * as SafeZonesLocalService from './SafeZonesLocalService';
import SyncManager from '../utils/SyncManager';

/**
 * Service for safe zones API calls
 * with local storage fallback for offline use
 */
class SafeZonesService {
  /**
   * Get all safe zones for a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} List of safe zones
   */
  static async getSafeZones(patientId) {
    try {
      // Try to get from API first
      const zones = await ApiService.get(ENDPOINTS.SAFE_ZONES.BY_PATIENT(patientId));
      
      // Cache the result locally
      await this.cacheLocalSafeZones(zones, patientId);
      
      return zones;
    } catch (error) {
      console.log('API error in getSafeZones, using local data:', error);
      
      // Fall back to local storage
      return SafeZonesLocalService.getSafeZones(patientId);
    }
  }

  /**
   * Cache safe zones data locally
   * @param {Array} zones - Safe zones data to cache
   * @param {string} patientId - Patient ID for filtering
   */
  static async cacheLocalSafeZones(zones, patientId) {
    try {
      // We need to get all existing zones for other patients first
      const allLocalZones = await SafeZonesLocalService.getSafeZones();
      
      // Filter out zones for this patient
      const otherPatientZones = allLocalZones.filter(
        z => z.patientId !== patientId
      );
      
      // Combine with new zones data
      const combinedZones = [...otherPatientZones, ...zones];
      
      // Save to local storage
      await AsyncStorage.setItem(
        'lumoscare_safezones', 
        JSON.stringify(combinedZones)
      );
    } catch (error) {
      console.error('Error caching safe zones data locally:', error);
    }
  }

  /**
   * Get a safe zone by ID
   * @param {string} zoneId - Safe zone ID
   * @returns {Promise<Object>} Safe zone data
   */
  static async getSafeZoneById(zoneId) {
    try {
      // Try to get from API first
      return await ApiService.get(ENDPOINTS.SAFE_ZONES.BY_ID(zoneId));
    } catch (error) {
      console.log('API error in getSafeZoneById, using local data:', error);
      
      // Fall back to local storage
      return SafeZonesLocalService.getSafeZoneById(zoneId);
    }
  }

  /**
   * Add a new safe zone
   * @param {Object} zoneData - Safe zone data
   * @returns {Promise<Object>} Created safe zone data
   */
  static async addSafeZone(zoneData) {
    try {
      // Try to add via API first
      const newZone = await ApiService.post(ENDPOINTS.SAFE_ZONES.BASE, zoneData);
      
      // Update local storage cache
      await SafeZonesLocalService.addSafeZone(newZone);
      
      return newZone;
    } catch (error) {
      console.log('API error in addSafeZone, using local storage:', error);
      
      // Add locally
      const localZone = await SafeZonesLocalService.addSafeZone(zoneData);
      
      // Store for later sync
      SyncManager.storePendingOperation('safeZone', 'create', localZone);
      
      return localZone;
    }
  }

  /**
   * Update a safe zone
   * @param {string} zoneId - Safe zone ID
   * @param {Object} updatedData - Updated safe zone data
   * @returns {Promise<Object>} Updated safe zone data
   */
  static async updateSafeZone(zoneId, updatedData) {
    try {
      // Try to update via API first
      const updatedZone = await ApiService.put(
        ENDPOINTS.SAFE_ZONES.BY_ID(zoneId), 
        updatedData
      );
      
      // Update local storage cache
      await SafeZonesLocalService.updateSafeZone(zoneId, updatedZone);
      
      return updatedZone;
    } catch (error) {
      console.log('API error in updateSafeZone, using local storage:', error);
      
      // Update locally
      const localUpdatedZone = await SafeZonesLocalService.updateSafeZone(
        zoneId, 
        updatedData
      );
      
      // Store for later sync
      SyncManager.storePendingOperation(
        'safeZone', 
        'update', 
        { id: zoneId, ...updatedData }
      );
      
      return localUpdatedZone;
    }
  }

  /**
   * Delete a safe zone
   * @param {string} zoneId - Safe zone ID
   * @returns {Promise<boolean>} Success indicator
   */
  static async deleteSafeZone(zoneId) {
    try {
      // Try to delete via API first
      await ApiService.delete(ENDPOINTS.SAFE_ZONES.BY_ID(zoneId));
      
      // Delete from local storage too
      await SafeZonesLocalService.deleteSafeZone(zoneId);
      
      return true;
    } catch (error) {
      console.log('API error in deleteSafeZone, using local storage:', error);
      
      // Delete locally
      await SafeZonesLocalService.deleteSafeZone(zoneId);
      
      // Store for later sync
      SyncManager.storePendingOperation(
        'safeZone', 
        'delete', 
        { id: zoneId }
      );
      
      return true;
    }
  }

  /**
   * Check if a location is within safe zones
   * @param {Object} locationData - Location data
   * @returns {Promise<Object>} Location check results
   */
  static async checkLocation(locationData) {
    try {
      return await ApiService.post(ENDPOINTS.AGENT.CHECK_LOCATION, locationData);
    } catch (error) {
      console.log('API error in checkLocation, using local calculation:', error);
      
      // Fall back to local calculation
      const { coordinates, patientId } = locationData;
      
      if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
        throw new Error('Invalid coordinates format');
      }
      
      const location = {
        latitude: coordinates[1],
        longitude: coordinates[0]
      };
      
      // Get all active safe zones for this patient
      const safeZones = await SafeZonesLocalService.getSafeZones(patientId);
      const activeZones = safeZones.filter(zone => zone.active);
      
      // Check if location is within any active zone
      for (const zone of activeZones) {
        if (SafeZonesLocalService.isLocationInSafeZone(location, zone)) {
          return {
            inSafeZone: true,
            zoneId: zone.id,
            zoneName: zone.name
          };
        }
      }
      
      return {
        inSafeZone: false,
        nearestZone: null // We could calculate this, but keeping it simple
      };
    }
  }

  /**
   * Add sample safe zones (for development/testing)
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Sample safe zones data
   */
  static async addSampleSafeZones(patientId) {
    return SafeZonesLocalService.addSampleSafeZones(patientId);
  }
}

export default SafeZonesService;