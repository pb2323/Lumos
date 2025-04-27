// src/screens/AddPersonScreen.js

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { TextInput, Button, Text, Surface, IconButton, HelperText, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { usePeople } from '../context/PeopleContext';
import { theme } from '../utils/theme';
import ImageUploadService from '../services/ImageUploadService';

const AddPersonScreen = ({ navigation }) => {
  const { addPerson, loading } = usePeople();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  
  // Take a photo with the camera
  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required to take a photo');
        return;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      
      // Handle result
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again or select from gallery.');
    }
  };
  
  // Pick an image from the gallery
  const pickImage = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Photo library access is required to select a photo');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      
      // Handle result
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!relationship.trim()) {
      newErrors.relationship = 'Relationship is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        setIsUploading(true);
        
        // Prepare person data
        const personData = {
          name,
          relationship,
          notes,
          photoUrl: photo,
        };
        
        // If we have a photo, upload it first
        if (photo) {
          try {
            // This will convert to base64 and upload to the API
            await ImageUploadService.uploadPersonImage(photo, name);
            console.log('Image uploaded successfully');
          } catch (error) {
            console.error('Error uploading image:', error);
            // Continue with person creation even if image upload fails
            Alert.alert(
              'Image Upload Warning',
              'The image could not be uploaded to the server, but the person will still be added.',
              [{ text: 'Continue' }]
            );
          }
        }
        
        // Now add the person
        await addPerson(personData);
        
        Alert.alert(
          'Success',
          'Person added successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } catch (error) {
        console.error('Error adding person:', error);
        Alert.alert('Error', 'Failed to add person');
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.card}>
          <Text style={styles.title}>Add New Person</Text>
          
          <View style={styles.photoSection}>
            <View style={styles.photoPlaceholder}>
              {photo ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <IconButton
                    icon="close"
                    color="#fff"
                    size={20}
                    style={styles.removePhotoButton}
                    onPress={() => setPhoto(null)}
                  />
                </View>
              ) : (
                <Text style={styles.photoPlaceholderText}>No Photo</Text>
              )}
            </View>
            
            <View style={styles.photoButtons}>
              <Button
                mode="contained"
                icon="camera"
                onPress={takePhoto}
                style={[styles.photoButton, styles.cameraButton]}
                labelStyle={styles.buttonLabel}
                disabled={isUploading}
              >
                Camera
              </Button>
              <Button
                mode="contained"
                icon="image"
                onPress={pickImage}
                style={[styles.photoButton, styles.galleryButton]}
                labelStyle={styles.buttonLabel}
                disabled={isUploading}
              >
                Gallery
              </Button>
            </View>
            
            <Text style={styles.photoHelp}>
              Adding a photo helps the system recognize this person.
            </Text>
          </View>
          
          <TextInput
            label="Name *"
            value={name}
            onChangeText={setName}
            style={styles.input}
            textColor='#FFFFFF'
            theme={{ colors: { primary: theme.colors.primary } }}
            error={!!errors.name}
            disabled={isUploading}
          />
          {errors.name && (
            <HelperText type="error" visible={true}>
              {errors.name}
            </HelperText>
          )}
          
          <TextInput
            label="Relationship *"
            value={relationship}
            onChangeText={setRelationship}
            style={styles.input}
            textColor='#FFFFFF'
            theme={{ colors: { primary: theme.colors.primary } }}
            error={!!errors.relationship}
            disabled={isUploading}
          />
          {errors.relationship && (
            <HelperText type="error" visible={true}>
              {errors.relationship}
            </HelperText>
          )}
          
          <TextInput
            label="Notes / Conversation Context"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={styles.input}
            textColor='#FFFFFF'
            theme={{ colors: { primary: theme.colors.primary } }}
            disabled={isUploading}
          />
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.saveButton}
            loading={loading || isUploading}
            disabled={loading || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Save Person'}
          </Button>
          
          {isUploading && (
            <Text style={styles.uploadingText}>
              Uploading image and adding person...
            </Text>
          )}
        </Surface>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.medium,
  },
  card: {
    padding: theme.spacing.medium,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: theme.fonts.sizes.headline,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.medium,
    textAlign: 'center',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.large,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.medium,
    overflow: 'hidden',
  },
  photoPlaceholderText: {
    color: theme.colors.textSecondary,
  },
  photoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.error,
  },
  photoButtons: {
    flexDirection: 'row',
    marginBottom: theme.spacing.small,
  },
  photoButton: {
    marginHorizontal: theme.spacing.small,
  },
  cameraButton: {
    backgroundColor: theme.colors.primary,
  },
  galleryButton: {
    backgroundColor: theme.colors.secondary,
  },
  buttonLabel: {
    fontSize: 12,
  },
  photoHelp: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.small,
    textAlign: 'center',
    marginHorizontal: theme.spacing.large,
  },
  input: {
    marginBottom: theme.spacing.medium,
    backgroundColor: theme.colors.background,
  },
  saveButton: {
    marginTop: theme.spacing.medium,
    backgroundColor: theme.colors.primary,
  },
  uploadingText: {
    textAlign: 'center',
    marginTop: 8,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
});

export default AddPersonScreen;