// src/components/CameraHelper.js

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { IconButton } from 'react-native-paper';
import { theme } from '../utils/theme';

const CameraHelper = ({ onCapture, onCancel, mode = 'capture' }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.front);
  const [flash, setFlash] = useState(Camera.Constants.FlashMode.off);
  const cameraRef = useRef(null);

  // Request camera permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'This feature requires camera access to function properly.',
          [{ text: 'OK' }]
        );
      }
    })();
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
          const base64Image = await convertToBase64(processedImage.uri);
          onCapture({ uri: processedImage.uri, base64: base64Image });
        } else {
          onCapture(processedImage);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  // Convert image URI to base64
  const convertToBase64 = async (uri) => {
    try {
      // In a real app, you would implement base64 conversion here
      // For demo purposes, we'll just return a placeholder
      return 'base64encodedface...';
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

  // Toggle camera type (front/back)
  const toggleCameraType = () => {
    setType(
      type === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  // Toggle flash mode
  const toggleFlash = () => {
    setFlash(
      flash === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };

  // Handle permission denied
  if (hasPermission === null) {
    return <View style={styles.container} />;
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.noPermission}>
        <Text style={styles.noPermissionText}>No access to camera</Text>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={type}
        flashMode={flash}
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
            icon={flash === Camera.Constants.FlashMode.off ? "flash-off" : "flash"}
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
  noPermission: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  noPermissionText: {
    color: theme.colors.text,
    fontSize: 18,
    marginBottom: 20,
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