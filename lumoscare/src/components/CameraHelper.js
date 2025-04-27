// src/components/CameraHelper.js

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, Alert, Image } from 'react-native';
import { IconButton } from 'react-native-paper';
import { theme } from '../utils/theme';

// Try importing in a different way
let Camera;
try {
  Camera = require('expo-camera').Camera;
  console.log('Camera imported successfully:', Camera);
  console.log('Camera.Constants:', Camera.Constants);
} catch (error) {
  console.error('Error importing Camera:', error);
}

// Import ImageManipulator separately to avoid issues if Camera fails
import * as ImageManipulator from 'expo-image-manipulator';

const CameraHelper = ({ onCapture, onCancel, mode = 'capture' }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(null);
  const [flashMode, setFlashMode] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const cameraRef = useRef(null);

  // Request camera permission and initialize camera constants on mount
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        // Ensure Camera is properly loaded
        if (!Camera) {
          setCameraError('Camera component could not be loaded');
          return;
        }
        
        // Check if Camera.Constants exists
        if (!Camera.Constants) {
          setCameraError('Camera.Constants is undefined. The Camera component may not be properly initialized.');
          console.error('Camera.Constants is undefined:', Camera);
          return;
        }

        // Set the camera type and flash mode once Camera is confirmed available
        console.log('Setting camera type and flash mode');
        setCameraType(Camera.Constants.Type.front);
        setFlashMode(Camera.Constants.FlashMode.off);

        // Request permissions
        console.log('Requesting camera permissions');
        const { status } = await Camera.requestCameraPermissionsAsync();
        console.log('Permission status:', status);
        setHasPermission(status === 'granted');
        
        if (status !== 'granted') {
          Alert.alert(
            'Camera Permission Required',
            'This feature requires camera access to function properly.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error initializing camera:', error);
        setCameraError(`Error initializing camera: ${error.message}`);
      }
    };

    initializeCamera();
  }, []);

  // Handle taking a photo
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        // Take picture
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          skipProcessing: Platform.OS === 'android',
        });
        
        // Resize and compress for API upload
        const processedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        // Convert to base64 if needed for face recognition
        if (mode === 'faceRecognition') {
          // For demo purposes, just return the processed image
          onCapture({ uri: processedImage.uri, base64: 'base64encodedface...' });
        } else {
          onCapture(processedImage);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  // Toggle camera type (front/back)
  const toggleCameraType = () => {
    if (!Camera || !Camera.Constants) return;
    
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  // Toggle flash mode
  const toggleFlash = () => {
    if (!Camera || !Camera.Constants) return;
    
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };

  // Handle camera error or loading state
  if (cameraError || !Camera || !Camera.Constants) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>
          {cameraError || 'Camera is not available on this device'}
        </Text>
        <Text style={styles.errorSubText}>
          Please make sure the camera module is properly installed.
        </Text>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if camera is ready to use
  const isCameraReady = hasPermission && cameraType !== null && flashMode !== null;

  // Handle loading or permission denied
  if (!isCameraReady) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        {hasPermission === false ? (
          <>
            <Text style={styles.noPermissionText}>No access to camera</Text>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.loadingText}>Initializing camera...</Text>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  // Camera is fully initialized and ready
  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        flashMode={flashMode}
        ratio="16:9"
      >
        <View style={styles.controlsContainer}>
          <View style={styles.controls}>
            <IconButton
              icon="close"
              size={30}
              color="#fff"
              onPress={onCancel}
              style={styles.iconButton}
            />
            
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            <IconButton
              icon="camera-flip"
              size={30}
              color="#fff"
              onPress={toggleCameraType}
              style={styles.iconButton}
            />
          </View>
          
          <IconButton
            icon={flashMode === Camera.Constants.FlashMode.off ? "flash-off" : "flash"}
            size={24}
            color="#fff"
            onPress={toggleFlash}
            style={styles.flashButton}
          />
        </View>
        
        {mode === 'faceRecognition' && (
          <View style={styles.overlay}>
            <View style={styles.faceGuide} />
          </View>
        )}
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    padding: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  iconButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  flashButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  noPermissionText: {
    color: theme.colors.text,
    fontSize: 18,
    marginBottom: 20,
  },
  loadingText: {
    color: theme.colors.text,
    fontSize: 18,
    marginBottom: 20,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorSubText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  cancelButton: {
    padding: 15,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
});

export default CameraHelper;