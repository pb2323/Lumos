// src/services/UpdatedPeopleService.js

import ApiService from './ApiService';
import { ENDPOINTS } from '../config/api';
import * as PeopleLocalService from './PeopleLocalService';
import SyncManager from '../utils/SyncManager';
import ImageUploadService from './ImageUploadService';

/**
 * Service for recognized people/faces API calls
 * with local storage fallback for offline use
 */
class PeopleService {
  /**
   * Get all recognized people for a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} List of recognized people
   */
  static async getPeople(patientId) {
    try {
      // Try to get from API first
      const people = await ApiService.get(ENDPOINTS.FACES.BY_PATIENT(patientId));
      
      // Cache the result locally
      await this.cacheLocalPeople(people, patientId);
      
      return people;
    } catch (error) {
      console.log('API error in getPeople, using local data:', error);
      
      // Fall back to local storage
      return PeopleLocalService.getPeople(patientId);
    }
  }

  /**
   * Cache people data locally
   * @param {Array} people - People data to cache
   * @param {string} patientId - Patient ID for filtering
   */
  static async cacheLocalPeople(people, patientId) {
    try {
      // We need to get all existing people for other patients first
      const allLocalPeople = await PeopleLocalService.getPeople();
      
      // Filter out people for this patient
      const otherPatientPeople = allLocalPeople.filter(
        p => p.patientId !== patientId
      );
      
      // Combine with new people data
      const combinedPeople = [...otherPatientPeople, ...people];
      
      // Save to local storage
      await AsyncStorage.setItem(
        'lumoscare_people', 
        JSON.stringify(combinedPeople)
      );
    } catch (error) {
      console.error('Error caching people data locally:', error);
    }
  }

  /**
   * Get a recognized person by ID
   * @param {string} personId - Person ID
   * @returns {Promise<Object>} Person data
   */
  static async getPersonById(personId) {
    try {
      // Try to get from API first
      return await ApiService.get(ENDPOINTS.FACES.BY_ID(personId));
    } catch (error) {
      console.log('API error in getPersonById, using local data:', error);
      
      // Fall back to local storage
      return PeopleLocalService.getPersonById(personId);
    }
  }

  /**
   * Add a new recognized person
   * @param {Object} personData - Person data including face image
   * @returns {Promise<Object>} Created person data
   */
  static async addPerson(personData) {
    try {
      // If we have a photo URL, upload it first
      if (personData.photoUrl) {
        try {
          // Upload image and get result
          await ImageUploadService.uploadPersonImage(
            personData.photoUrl,
            personData.name
          );
          
          // Note: in a real app, you might want to store the image URL returned by the API
          // and update personData.photoUrl with it
        } catch (error) {
          console.error('Error uploading image:', error);
          // Continue with adding the person even if image upload fails
        }
      }
      
      // Try to add via API first
      const newPerson = await ApiService.post(ENDPOINTS.FACES.BASE, personData);
      
      // Update local storage cache
      await PeopleLocalService.addPerson(newPerson);
      
      return newPerson;
    } catch (error) {
      console.log('API error in addPerson, using local storage:', error);
      
      // Add locally
      const localPerson = await PeopleLocalService.addPerson(personData);
      
      // Store for later sync
      SyncManager.storePendingOperation('person', 'create', localPerson);
      
      return localPerson;
    }
  }

  /**
   * Update a recognized person
   * @param {string} personId - Person ID
   * @param {Object} updatedData - Updated person data
   * @returns {Promise<Object>} Updated person data
   */
  static async updatePerson(personId, updatedData) {
    try {
      // If we have a new photo URL, upload it first
      if (updatedData.photoUrl) {
        try {
          // Upload image and get result
          await ImageUploadService.uploadPersonImage(
            updatedData.photoUrl,
            updatedData.name || 'Unknown'
          );
          
          // Note: in a real app, you might want to store the image URL returned by the API
          // and update updatedData.photoUrl with it
        } catch (error) {
          console.error('Error uploading image:', error);
          // Continue with updating the person even if image upload fails
        }
      }
      
      // Try to update via API first
      const updatedPerson = await ApiService.put(
        ENDPOINTS.FACES.BY_ID(personId), 
        updatedData
      );
      
      // Update local storage cache
      await PeopleLocalService.updatePerson(personId, updatedPerson);
      
      return updatedPerson;
    } catch (error) {
      console.log('API error in updatePerson, using local storage:', error);
      
      // Update locally
      const localUpdatedPerson = await PeopleLocalService.updatePerson(
        personId, 
        updatedData
      );
      
      // Store for later sync
      SyncManager.storePendingOperation(
        'person', 
        'update', 
        { id: personId, ...updatedData }
      );
      
      return localUpdatedPerson;
    }
  }

  /**
   * Delete a recognized person
   * @param {string} personId - Person ID
   * @returns {Promise<boolean>} Success indicator
   */
  static async deletePerson(personId) {
    try {
      // Try to delete via API first
      await ApiService.delete(ENDPOINTS.FACES.BY_ID(personId));
      
      // Delete from local storage too
      await PeopleLocalService.deletePerson(personId);
      
      return true;
    } catch (error) {
      console.log('API error in deletePerson, using local storage:', error);
      
      // Delete locally
      await PeopleLocalService.deletePerson(personId);
      
      // Store for later sync
      SyncManager.storePendingOperation(
        'person', 
        'delete', 
        { id: personId }
      );
      
      return true;
    }
  }

  /**
   * Process face recognition
   * @param {Object} faceData - Face data to recognize
   * @returns {Promise<Object>} Recognition results
   */
  static async recognizeFace(faceData) {
    try {
      return await ApiService.post(ENDPOINTS.AGENT.FACE_RECOGNITION, faceData);
    } catch (error) {
      console.error('Face recognition failed:', error);
      throw error; // No local fallback for face recognition
    }
  }

  /**
   * Add sample people (for development/testing)
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Sample people data
   */
  static async addSamplePeople(patientId) {
    return PeopleLocalService.addSamplePeople(patientId);
  }
}

export default PeopleService;