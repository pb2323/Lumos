// src/utils/ImageUtils.js

import * as FileSystem from 'expo-file-system';
import { PROFILE_UPLOAD_URL as PROFILE_UPLOAD_URL } from '@env';

/**
 * Convert an image URI to base64
 * @param {string} uri - Image URI
 * @returns {Promise<string>} Base64 string
 */
export const imageToBase64 = async (uri) => {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

/**
 * Upload a profile image to the server
 * @param {string} base64Image - Base64 encoded image
 * @param {string} name - Person's name
 * @returns {Promise<Object>} API response
 */
export const uploadProfileImage = async (base64Image, name) => {
  try {
    const response = await fetch(PROFILE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        name: name,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};