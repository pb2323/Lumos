// src/screens/AddSafeZoneScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, TextInput as RNTextInput } from 'react-native';
import { Text, Button, Surface, HelperText, IconButton, ActivityIndicator } from 'react-native-paper';
import MapView, { Circle, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeZones } from '../context/SafeZonesContext';
import { theme } from '../utils/theme';
import Slider from '../components/Slider';
import { getCurrentLocation, reverseGeocodeCoordinates } from '../utils/LocationUtils';
import { TextInput } from 'react-native-paper';

const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#181818" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1b1b1b" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#2c2c2c" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8a8a8a" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{ "color": "#373737" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#3c3c3c" }]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [{ "color": "#4e4e4e" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#3d3d3d" }]
  }
];

const AddSafeZoneScreen = ({ navigation }) => {
  const { addSafeZone, loading } = useSafeZones();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(100);
  const [location, setLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [errors, setErrors] = useState({});
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  
  // Get location permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        try {
          setIsGettingLocation(true);
          const currentLocation = await getCurrentLocation();
          
          setLocation(currentLocation);
          setMapRegion({
            ...currentLocation,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
          
          // Get address for current location
          const formattedAddress = await reverseGeocodeCoordinates(
            currentLocation.latitude,
            currentLocation.longitude
          );
          
          setAddress(formattedAddress);
        } catch (error) {
          console.error('Error getting location:', error);
          // Set a default location (Los Angeles)
          setDefaultLocation();
        } finally {
          setIsGettingLocation(false);
        }
      } else {
        // Set a default location
        setDefaultLocation();
      }
    })();
  }, []);
  
  // Set a default location (Los Angeles)
  const setDefaultLocation = () => {
    const defaultLocation = {
      latitude: 34.0522,
      longitude: -118.2437,
    };
    
    setLocation(defaultLocation);
    setMapRegion({
      ...defaultLocation,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };
  
  // Handle map press - set new marker location
  const handleMapPress = async (event) => {
    const { coordinate } = event.nativeEvent;
    setLocation(coordinate);
    
    try {
      setIsGettingLocation(true);
      // Get address for this location (reverse geocoding)
      const formattedAddress = await reverseGeocodeCoordinates(
        coordinate.latitude,
        coordinate.longitude
      );
      
      setAddress(formattedAddress);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };
  
  // Geocode address to get coordinates
  const searchAddress = async () => {
    if (!searchQuery.trim()) {
      return;
    }
    
    try {
      setIsGettingLocation(true);
      
      // Geocode the address
      const results = await Location.geocodeAsync(searchQuery);
      
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        
        // Set new location and map region
        setLocation({ latitude, longitude });
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        
        // Get formatted address
        const formattedAddress = await reverseGeocodeCoordinates(latitude, longitude);
        setAddress(formattedAddress);
        
        // Clear search query
        setSearchQuery('');
        
        // Blur the search input
        if (searchInputRef.current) {
          searchInputRef.current.blur();
        }
      } else {
        Alert.alert('Not Found', 'No location found for this address');
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      Alert.alert('Error', 'Could not find location');
    } finally {
      setIsGettingLocation(false);
    }
  };
  
  // Go to current location
  const goToCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      
      // Request permission if not granted
      if (!locationPermission) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Location permission is required to use your current location'
          );
          setIsGettingLocation(false);
          return;
        }
        
        setLocationPermission(true);
      }
      
      // Get current location
      const currentLocation = await getCurrentLocation();
      
      // Set new location and map region
      setLocation(currentLocation);
      setMapRegion({
        ...currentLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      
      // Get address for current location
      const formattedAddress = await reverseGeocodeCoordinates(
        currentLocation.latitude,
        currentLocation.longitude
      );
      
      setAddress(formattedAddress);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Could not get current location');
    } finally {
      setIsGettingLocation(false);
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!location) {
      newErrors.location = 'Location must be selected on the map';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        await addSafeZone({
          name,
          address,
          latitude: location.latitude,
          longitude: location.longitude,
          radius,
          active: true,
        });
        
        Alert.alert(
          'Success',
          'Safe zone added successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to add safe zone');
      }
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.formCard}>
        <Text style={styles.title}>Add New Safe Zone</Text>
        
        <View style={styles.searchContainer}>
          <RNTextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search for location..."
            placeholderTextColor={theme.colors.disabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={searchAddress}
          />
          <IconButton
            icon="magnify"
            size={24}
            color={theme.colors.primary}
            onPress={searchAddress}
          />
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
          label="Address *"
          value={address}
          onChangeText={setAddress}
          style={styles.input}
          textColor='#FFFFFF'
          theme={{ colors: { primary: theme.colors.primary } }}
          error={!!errors.address}
          multiline
        />
        {errors.address && (
          <HelperText type="error" visible={true}>
            {errors.address}
          </HelperText>
        )}
        
        <View style={styles.radiusContainer}>
          <Text style={styles.radiusLabel}>Safe Zone Radius: {radius} meters</Text>
          <Slider 
            minimumValue={50}
            maximumValue={500}
            step={10}
            value={radius}
            onValueChange={setRadius}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.disabled}
            thumbTintColor={theme.colors.primary}
            style={styles.slider}
          />
          <View style={styles.radiusValues}>
            <Text style={styles.radiusMin}>50m</Text>
            <Text style={styles.radiusMax}>500m</Text>
          </View>
        </View>
      </Surface>
      
      <Surface style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Select Location</Text>
          <IconButton 
            icon="crosshairs-gps" 
            color={theme.colors.primary}
            size={24}
            onPress={goToCurrentLocation}
            disabled={isGettingLocation}
          />
        </View>
        
        {errors.location && (
          <HelperText type="error" visible={true}>
            {errors.location}
          </HelperText>
        )}
        
        {mapRegion ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={mapRegion}
              customMapStyle={darkMapStyle}
              onPress={handleMapPress}
              showsUserLocation={locationPermission}
              showsMyLocationButton={false}
            >
              {location && (
                <>
                  <Marker
                    coordinate={location}
                    title={name || 'Selected Location'}
                    description={address}
                  />
                  <Circle
                    center={location}
                    radius={radius}
                    strokeColor={theme.colors.primary}
                    fillColor="rgba(66, 133, 244, 0.2)"
                  />
                </>
              )}
            </MapView>
            
            {isGettingLocation && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            )}
            
            {!locationPermission && (
              <View style={styles.permissionOverlay}>
                <Text style={styles.permissionText}>
                  Location permission is required to use your current location.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
        
        <Text style={styles.mapInstructions}>
          Tap on the map to set the center point of the safe zone. You can adjust the radius using the slider above.
        </Text>
      </Surface>
      
      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.saveButton}
        loading={loading}
        disabled={loading || isGettingLocation}
      >
        Save Safe Zone
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  formCard: {
    margin: theme.spacing.medium,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.medium,
    paddingHorizontal: theme.spacing.small,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.body,
  },
  input: {
    marginBottom: theme.spacing.medium,
    backgroundColor: theme.colors.background,
  },
  radiusContainer: {
    marginTop: theme.spacing.small,
    marginBottom: theme.spacing.medium,
  },
  radiusLabel: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.small,
  },
  slider: {
    height: 40,
  },
  radiusValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radiusMin: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
  },
  radiusMax: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
  },
  mapCard: {
    margin: theme.spacing.medium,
    marginTop: 0,
    padding: theme.spacing.medium,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapTitle: {
    fontSize: theme.fonts.sizes.subheading,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  mapContainer: {
    height: 300,
    borderRadius: theme.roundness,
    overflow: 'hidden',
    marginVertical: theme.spacing.medium,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    marginVertical: theme.spacing.medium,
  },
  loadingText: {
    color: theme.colors.text,
    marginTop: theme.spacing.small,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.large,
  },
  permissionText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: theme.fonts.sizes.body,
  },
  mapInstructions: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  saveButton: {
    margin: theme.spacing.medium,
    marginTop: 0,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.small,
  },
});

export default AddSafeZoneScreen;