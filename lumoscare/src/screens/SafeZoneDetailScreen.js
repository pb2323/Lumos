import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Surface, Button, Divider, TextInput, Switch, Dialog, Portal, SegmentedButtons } from 'react-native-paper';
import MapView, { Circle, Marker } from 'react-native-maps';
import { useSafeZones } from '../context/SafeZonesContext';
import { theme } from '../utils/theme';

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

const SafeZoneDetailScreen = ({ route, navigation }) => {
  const { zoneId, initialTab = 'details' } = route.params;
  const { getSafeZoneById, updateSafeZone, deleteSafeZone, loading } = useSafeZones();
  const [safeZone, setSafeZone] = useState(getSafeZoneById(zoneId));
  const [editedName, setEditedName] = useState(safeZone?.name || '');
  const [editedAddress, setEditedAddress] = useState(safeZone?.address || '');
  const [editedRadius, setEditedRadius] = useState(safeZone?.radius || 100);
  const [isActive, setIsActive] = useState(safeZone?.active || false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(initialTab);
  
  // Map region calculated from safe zone location
  const mapRegion = safeZone ? {
    latitude: safeZone.latitude,
    longitude: safeZone.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : null;
  
  if (!safeZone) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Safe zone not found</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: theme.colors.primary }}
        >
          Go Back
        </Button>
      </View>
    );
  }
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Handle save button
  const handleSave = async () => {
    try {
      const updatedZone = await updateSafeZone(safeZone.id, {
        name: editedName,
        address: editedAddress,
        radius: editedRadius,
        active: isActive,
      });
      
      setSafeZone(updatedZone);
      Alert.alert('Success', 'Safe zone updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update safe zone');
    }
  };
  
  // Handle delete button
  const handleDelete = async () => {
    try {
      await deleteSafeZone(safeZone.id);
      setShowDeleteDialog(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete safe zone');
    }
  };
  
  return (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <Text style={styles.title}>{safeZone.name}</Text>
        <Text style={styles.address}>{safeZone.address}</Text>
        <Divider style={styles.divider} />
        <SegmentedButtons
          value={currentTab}
          onValueChange={setCurrentTab}
          buttons={[
            { value: 'details', label: 'Details' },
            { value: 'map', label: 'Map' },
          ]}
          style={styles.segmentedButtons}
        />
      </Surface>
      
      {currentTab === 'details' ? (
        <ScrollView style={styles.scrollView}>
          <Surface style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Zone Information</Text>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Name:</Text>
              <TextInput
                value={editedName}
                onChangeText={setEditedName}
                style={styles.input}
                textColor='#FFFFFF'
                theme={{ colors: { primary: theme.colors.primary } }}
                dense
              />
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Address:</Text>
              <TextInput
                value={editedAddress}
                onChangeText={setEditedAddress}
                style={styles.input}
                textColor='#FFFFFF'
                theme={{ colors: { primary: theme.colors.primary } }}
                dense
              />
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Radius:</Text>
              <View style={styles.radiusInputContainer}>
                <TextInput
                  value={editedRadius.toString()}
                  onChangeText={(value) => {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                      setEditedRadius(numValue);
                    } else if (value === '') {
                      setEditedRadius('');
                    }
                  }}
                  keyboardType="numeric"
                  style={styles.radiusInput}
                  textColor='#FFFFFF'
                  theme={{ colors: { primary: theme.colors.primary } }}
                  dense
                />
                <Text style={styles.radiusUnit}>meters</Text>
              </View>
            </View>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Active:</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                color={theme.colors.primary}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.metaContainer}>
              <Text style={styles.metaLabel}>Created:</Text>
              <Text style={styles.metaValue}>
                {formatDate(safeZone.createdAt)}
              </Text>
            </View>
            
            {safeZone.updatedAt && (
              <View style={styles.metaContainer}>
                <Text style={styles.metaLabel}>Last Updated:</Text>
                <Text style={styles.metaValue}>
                  {formatDate(safeZone.updatedAt)}
                </Text>
              </View>
            )}
            
            <View style={styles.actions}>
              <Button
                mode="contained"
                onPress={handleSave}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                loading={loading}
                disabled={loading}
              >
                Save Changes
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowDeleteDialog(true)}
                style={styles.actionButton}
                textColor={theme.colors.error}
              >
                Delete Zone
              </Button>
            </View>
          </Surface>
        </ScrollView>
      ) : (
        <View style={styles.mapContainer}>
          {mapRegion && (
            <MapView
              style={styles.map}
              region={mapRegion}
              customMapStyle={darkMapStyle}
            >
              <Marker
                coordinate={{
                  latitude: safeZone.latitude,
                  longitude: safeZone.longitude,
                }}
                title={safeZone.name}
                description={safeZone.address}
              />
              <Circle
                center={{
                  latitude: safeZone.latitude,
                  longitude: safeZone.longitude,
                }}
                radius={safeZone.radius}
                strokeColor={theme.colors.primary}
                fillColor="rgba(66, 133, 244, 0.2)"
              />
            </MapView>
          )}
        </View>
      )}
      
      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.text }}>Delete Safe Zone</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.text }}>
              Are you sure you want to delete the {safeZone.name} safe zone? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)} textColor={theme.colors.primary}>
              Cancel
            </Button>
            <Button 
              onPress={handleDelete} 
              textColor={theme.colors.error}
              loading={loading}
              disabled={loading}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.large,
    backgroundColor: theme.colors.background,
  },
  notFoundText: {
    fontSize: theme.fonts.sizes.subheading,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.large,
  },
  header: {
    padding: theme.spacing.medium,
    borderRadius: 0,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: theme.fonts.sizes.headline,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  address: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.medium,
  },
  divider: {
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.medium,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  detailsCard: {
    margin: theme.spacing.medium,
    padding: theme.spacing.medium,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.subheading,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.medium,
  },
  fieldContainer: {
    marginBottom: theme.spacing.medium,
  },
  fieldLabel: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: theme.colors.background,
  },
  radiusInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusInput: {
    backgroundColor: theme.colors.background,
    width: 100,
  },
  radiusUnit: {
    marginLeft: theme.spacing.small,
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.textSecondary,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.medium,
  },
  switchLabel: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.textSecondary,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.small,
  },
  metaLabel: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
    width: 100,
  },
  metaValue: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.text,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.large,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.small,
  },
  mapContainer: {
    flex: 1,
    margin: theme.spacing.medium,
    borderRadius: theme.roundness,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default SafeZoneDetailScreen;