// src/utils/SyncManager.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Storage keys
const PENDING_OPERATIONS_KEY = 'lumoscare_pending_operations';

/**
 * Manages offline data synchronization
 */
class SyncManager {
  /**
   * Store a pending operation for later synchronization
   * @param {string} entityType - Type of entity (person, safeZone, alert)
   * @param {string} operation - Operation type (create, update, delete)
   * @param {Object} data - Operation data
   */
  static async storePendingOperation(entityType, operation, data) {
    try {
      // Get existing pending operations
      const pendingOperationsJson = await AsyncStorage.getItem(PENDING_OPERATIONS_KEY);
      let pendingOperations = [];
      
      if (pendingOperationsJson) {
        pendingOperations = JSON.parse(pendingOperationsJson);
      }
      
      // Add new operation
      pendingOperations.push({
        id: Math.random().toString(36).substring(2, 15),
        timestamp: new Date().toISOString(),
        entityType,
        operation,
        data,
        syncStatus: 'pending',
      });
      
      // Save updated operations
      await AsyncStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(pendingOperations));
    } catch (error) {
      console.error('Error storing pending operation:', error);
    }
  }
  
  /**
   * Synchronize all pending operations when online
   * @param {Object} apiServices - API services to use for synchronization
   */
  static async synchronize(apiServices) {
    try {
      // Check if device is online
      const netInfo = await NetInfo.fetch();
      
      if (!netInfo.isConnected || !netInfo.isInternetReachable) {
        console.log('Device is offline, skipping synchronization');
        return;
      }
      
      // Get pending operations
      const pendingOperationsJson = await AsyncStorage.getItem(PENDING_OPERATIONS_KEY);
      
      if (!pendingOperationsJson) {
        console.log('No pending operations to synchronize');
        return;
      }
      
      const pendingOperations = JSON.parse(pendingOperationsJson);
      const updatedOperations = [...pendingOperations];
      let hasChanges = false;
      
      // Process operations in order
      for (let i = 0; i < pendingOperations.length; i++) {
        const operation = pendingOperations[i];
        
        if (operation.syncStatus !== 'pending') {
          continue;
        }
        
        try {
          // Process by entity type and operation
          await this.processOperation(operation, apiServices);
          
          // Mark operation as synced
          updatedOperations[i].syncStatus = 'synced';
          updatedOperations[i].syncedAt = new Date().toISOString();
          hasChanges = true;
        } catch (error) {
          console.error(`Error syncing operation ${operation.id}:`, error);
          
          // Mark operation as failed
          updatedOperations[i].syncStatus = 'failed';
          updatedOperations[i].error = error.message;
          updatedOperations[i].lastSyncAttempt = new Date().toISOString();
          hasChanges = true;
        }
      }
      
      // Save updated operations
      if (hasChanges) {
        await AsyncStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(updatedOperations));
      }
      
      // Clean up synced operations older than 24 hours
      await this.cleanupSyncedOperations();
    } catch (error) {
      console.error('Error during synchronization:', error);
    }
  }
  
  /**
   * Process a single operation
   * @param {Object} operation - Operation to process
   * @param {Object} apiServices - API services to use
   */
  static async processOperation(operation, apiServices) {
    const { entityType, operation: operationType, data } = operation;
    
    // Get the appropriate service
    let service;
    switch (entityType) {
      case 'person':
        service = apiServices.peopleService;
        break;
      case 'safeZone':
        service = apiServices.safeZonesService;
        break;
      case 'alert':
        service = apiServices.alertsService;
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
    
    // Perform the operation
    switch (operationType) {
      case 'create':
        switch (entityType) {
          case 'person':
            await service.addPerson(data);
            break;
          case 'safeZone':
            await service.addSafeZone(data);
            break;
          case 'alert':
            await service.createAlert(data);
            break;
        }
        break;
        
      case 'update':
        switch (entityType) {
          case 'person':
            await service.updatePerson(data.id, data);
            break;
          case 'safeZone':
            await service.updateSafeZone(data.id, data);
            break;
          case 'alert':
            if (data.resolved) {
              await service.updateAlertStatus(data.id, 'resolved');
            }
            break;
        }
        break;
        
      case 'delete':
        switch (entityType) {
          case 'person':
            await service.deletePerson(data.id);
            break;
          case 'safeZone':
            await service.deleteSafeZone(data.id);
            break;
          case 'alert':
            // No delete API for alerts
            break;
        }
        break;
        
      default:
        throw new Error(`Unknown operation type: ${operationType}`);
    }
  }
  
  /**
   * Clean up synced operations older than 24 hours
   */
  static async cleanupSyncedOperations() {
    try {
      const pendingOperationsJson = await AsyncStorage.getItem(PENDING_OPERATIONS_KEY);
      
      if (!pendingOperationsJson) {
        return;
      }
      
      const pendingOperations = JSON.parse(pendingOperationsJson);
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Filter out synced operations older than 24 hours
      const updatedOperations = pendingOperations.filter(operation => {
        if (operation.syncStatus !== 'synced') {
          return true;
        }
        
        const syncedAt = new Date(operation.syncedAt);
        return syncedAt > oneDayAgo;
      });
      
      // Save updated operations if changed
      if (updatedOperations.length !== pendingOperations.length) {
        await AsyncStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(updatedOperations));
      }
    } catch (error) {
      console.error('Error cleaning up synced operations:', error);
    }
  }
  
  /**
   * Get all pending operations
   * @returns {Promise<Array>} List of pending operations
   */
  static async getPendingOperations() {
    try {
      const pendingOperationsJson = await AsyncStorage.getItem(PENDING_OPERATIONS_KEY);
      
      if (!pendingOperationsJson) {
        return [];
      }
      
      return JSON.parse(pendingOperationsJson);
    } catch (error) {
      console.error('Error getting pending operations:', error);
      return [];
    }
  }
}

export default SyncManager;