// src/screens/AddPersonScreen.js

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { TextInput, Button, Text, Surface, IconButton, HelperText } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { usePeople } from '../context/PeopleContext';
import { theme } from '../utils/theme';
import CameraHelper from '../components/CameraHelper';

const AddPersonScreen = ({ navigation }) => {
  const { addPerson, loading } = usePeople();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [showCamera, setShowCamera] = useState(false);
  
  // Pick an image from the gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };
  
  // Show camera for taking a photo
  const openCamera = () => {
    setShowCamera(true);
  };
  
  // Handle photo captured from camera
  const handleCapturedPhoto = (photoData) => {
    setPhoto(photoData.uri);
    setShowCamera(false);
  };
  
  // Close camera without taking photo
  const handleCloseCamera = () => {
    setShowCamera(false);
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
        // Prepare person data
        const personData = {
          name,
          relationship,
          notes,
          photoUrl: photo, // In a real app, we would upload this to a server
        };
        
        // If we have a photo and it's for face recognition, convert to base64
        if (photo) {
          // In a real app, you would convert the photo to base64 here
          // personData.faceData = base64encodedface...
        }
        
        await addPerson(personData);
        
        Alert.alert(
          'Success',
          'Person added successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to add person');
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
                onPress={openCamera}
                style={[styles.photoButton, styles.cameraButton]}
                labelStyle={styles.buttonLabel}
              >
                Camera
              </Button>
              <Button
                mode="contained"
                icon="image"
                onPress={pickImage}
                style={[styles.photoButton, styles.galleryButton]}
                labelStyle={styles.buttonLabel}
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
          />
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.saveButton}
            loading={loading}
            disabled={loading}
          >
            Save Person
          </Button>
        </Surface>
      </ScrollView>
      
      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={handleCloseCamera}
      >
        <CameraHelper
          onCapture={handleCapturedPhoto}
          onCancel={handleCloseCamera}
          mode="faceRecognition"
        />
      </Modal>
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
});

export default AddPersonScreen;