// src/screens/ProfileScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { Surface, Text, Button, TextInput, Divider, List, Avatar } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import AuthService from '../services/AuthService';
import { theme } from '../utils/theme';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    safeZoneAlerts: true,
    medicationReminders: true,
    systemAlerts: true,
    allNotifications: true,
  });
  
  // Load user data
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
  }, [user]);
  
  // Toggle notification setting
  const toggleNotification = (setting) => {
    setNotifications(prev => {
      const updated = { ...prev, [setting]: !prev[setting] };
      
      // Update "all notifications" based on individual settings
      if (setting !== 'allNotifications') {
        updated.allNotifications = updated.safeZoneAlerts && 
                                 updated.medicationReminders && 
                                 updated.systemAlerts;
      } 
      // Update all individual settings when "all" is toggled
      else if (setting === 'allNotifications') {
        updated.safeZoneAlerts = updated.allNotifications;
        updated.medicationReminders = updated.allNotifications;
        updated.systemAlerts = updated.allNotifications;
      }
      
      return updated;
    });
  };
  
  // Handle saving profile changes
  const handleSaveProfile = async () => {
    if (!firstName || !lastName) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Prepare updated user data
      const userData = {
        firstName,
        lastName,
        phone,
      };
      
      // Update user profile through API
      await AuthService.updateUser(userData);
      
      // Exit edit mode
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: () => logout(),
          style: 'destructive' 
        },
      ]
    );
  };
  
  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return '?';
    return `${(user.firstName || '?').charAt(0)}${(user.lastName || '').charAt(0)}`;
  };
  
  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.headerCard}>
        <Avatar.Text
          size={80}
          label={getInitials()}
          backgroundColor={theme.colors.primary}
        />
        <Text style={styles.userName}>{`${firstName} ${lastName}`}</Text>
        <Text style={styles.userEmail}>{email}</Text>
        <Text style={styles.userRole}>Role: {user?.role || 'Caregiver'}</Text>
      </Surface>
      
      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        <Divider style={styles.divider} />
        
        {isEditing ? (
          // Edit mode
          <View style={styles.editForm}>
            <TextInput
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            
            <TextInput
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            
            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            
            <View style={styles.editButtons}>
              <Button
                mode="outlined"
                onPress={() => setIsEditing(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              
              <Button
                mode="contained"
                onPress={handleSaveProfile}
                style={styles.saveButton}
                loading={isSaving}
                disabled={isSaving}
              >
                Save
              </Button>
            </View>
          </View>
        ) : (
          // View mode
          <View>
            <List.Item
              title="First Name"
              description={firstName || 'Not set'}
              left={props => <List.Icon {...props} icon="account" />}
            />
            
            <Divider style={styles.itemDivider} />
            
            <List.Item
              title="Last Name"
              description={lastName || 'Not set'}
              left={props => <List.Icon {...props} icon="account" />}
            />
            
            <Divider style={styles.itemDivider} />
            
            <List.Item
              title="Email"
              description={email || 'Not set'}
              left={props => <List.Icon {...props} icon="email" />}
            />
            
            <Divider style={styles.itemDivider} />
            
            <List.Item
              title="Phone"
              description={phone || 'Not set'}
              left={props => <List.Icon {...props} icon="phone" />}
            />
            
            <Button
              mode="contained"
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
            >
              Edit Profile
            </Button>
          </View>
        )}
      </Surface>
      
      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        <Divider style={styles.divider} />
        
        <List.Item
          title="All Notifications"
          left={props => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={notifications.allNotifications}
              onValueChange={() => toggleNotification('allNotifications')}
              color={theme.colors.primary}
            />
          )}
        />
        
        <Divider style={styles.itemDivider} />
        
        <List.Item
          title="Safe Zone Alerts"
          description="Get notified when patient leaves a safe zone"
          left={props => <List.Icon {...props} icon="map-marker-radius" />}
          right={() => (
            <Switch
              value={notifications.safeZoneAlerts}
              onValueChange={() => toggleNotification('safeZoneAlerts')}
              color={theme.colors.primary}
            />
          )}
        />
        
        <Divider style={styles.itemDivider} />
        
        <List.Item
          title="Medication Reminders"
          description="Get notified about medication schedules"
          left={props => <List.Icon {...props} icon="pill" />}
          right={() => (
            <Switch
              value={notifications.medicationReminders}
              onValueChange={() => toggleNotification('medicationReminders')}
              color={theme.colors.primary}
            />
          )}
        />
        
        <Divider style={styles.itemDivider} />
        
        <List.Item
          title="System Alerts"
          description="Get notified about system status (battery, etc.)"
          left={props => <List.Icon {...props} icon="cog" />}
          right={() => (
            <Switch
              value={notifications.systemAlerts}
              onValueChange={() => toggleNotification('systemAlerts')}
              color={theme.colors.primary}
            />
          )}
        />
      </Surface>
      
      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Divider style={styles.divider} />
        
        <List.Item
          title="Version"
          description="LumosCare v1.0.0"
          left={props => <List.Icon {...props} icon="information" />}
        />
        
        <Divider style={styles.itemDivider} />
        
        <List.Item
          title="Privacy Policy"
          left={props => <List.Icon {...props} icon="shield-account" />}
          onPress={() => Alert.alert('Privacy Policy', 'Privacy policy details would be displayed here.')}
        />
        
        <Divider style={styles.itemDivider} />
        
        <List.Item
          title="Terms of Service"
          left={props => <List.Icon {...props} icon="file-document" />}
          onPress={() => Alert.alert('Terms of Service', 'Terms of service details would be displayed here.')}
        />
      </Surface>
      
      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor={theme.colors.error}
      >
        Logout
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerCard: {
    margin: theme.spacing.medium,
    padding: theme.spacing.large,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  userName: {
    fontSize: theme.fonts.sizes.headline,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.medium,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.primary,
    marginBottom: 8,
  },
  userRole: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.textSecondary,
  },
  section: {
    margin: theme.spacing.medium,
    marginTop: 0,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.subheading,
    fontWeight: 'bold',
    color: theme.colors.text,
    padding: theme.spacing.medium,
  },
  divider: {
    backgroundColor: theme.colors.border,
  },
  itemDivider: {
    backgroundColor: theme.colors.border,
    marginLeft: 16,
  },
  editForm: {
    padding: theme.spacing.medium,
  },
  input: {
    marginBottom: theme.spacing.medium,
    backgroundColor: theme.colors.background,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: theme.spacing.small,
  },
  saveButton: {
    flex: 1,
    marginLeft: theme.spacing.small,
    backgroundColor: theme.colors.primary,
  },
  editButton: {
    margin: theme.spacing.medium,
    backgroundColor: theme.colors.primary,
  },
  logoutButton: {
    margin: theme.spacing.medium,
    marginBottom: theme.spacing.xlarge,
  },
});

export default ProfileScreen;