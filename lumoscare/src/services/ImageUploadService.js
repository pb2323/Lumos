// src/services/ImageUploadService.js

import { imageToBase64, uploadProfileImage } from '../utils/ImageUtils';

/**
 * Service for image upload operations
 */
class ImageUploadService {
  /**
   * Process and upload a profile image
   * @param {string} imageUri - URI of the image to upload
   * @param {string} personName - Name of the person
   * @returns {Promise<Object>} Upload result
   */
  static async uploadPersonImage(imageUri, personName) {
    try {
      // Convert image to base64
      const base64Image = await imageToBase64(imageUri);
      
      // Upload to server
      const result = await uploadProfileImage(base64Image, personName);
      
      return result;
    } catch (error) {
      console.error('Error processing and uploading image:', error);
      
      // Return a basic response for offline mode
      return {
        success: false,
        error: error.message,
        offline: true,
      };
    }
  }
}

export default ImageUploadService;