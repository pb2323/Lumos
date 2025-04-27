import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Surface, Text, Divider, List, Switch, Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { theme } from '../utils/theme';

const SettingsScreen = () => {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(true);
  
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
  
  // In a real app, we would save these settings to AsyncStorage
  const toggleNotifications = () => setNotificationsEnabled(!notificationsEnabled);
  const toggleLocationTracking = () => setLocationTrackingEnabled(!locationTrackingEnabled);
  const toggleDarkMode = () => setDarkModeEnabled(!darkModeEnabled);
  
  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.userCard}>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
        <Text style={styles.userRole}>Role: {user?.role || 'Caregiver'}</Text>
      </Surface>
      
      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <Divider style={styles.divider} />
        
        <List.Item
          title="Push Notifications"
          description="Receive alerts about your patient"
          right={() => (
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              color={theme.colors.primary}
            />
          )}
        />
        
        <Divider style={styles.itemDivider} />
        
        <List.Item
          title="Location Tracking"
          description="Track patient's location within safe zones"
          right={() => (
            <Switch
              value={locationTrackingEnabled}
              onValueChange={toggleLocationTracking}
              color={theme.colors.primary}
            />
          )}
        />
        
        <Divider style={styles.itemDivider} />
        
        <List.Item
          title="Dark Mode"
          description="Use dark theme for the app"
          right={() => (
            <Switch
              value={darkModeEnabled}
              onValueChange={toggleDarkMode}
              color={theme.colors.primary}
            />
          )}
        />
      </Surface>
      
      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Divider style={styles.divider} />
        
        <List.Item
          title="Safe Zone Alerts"
          description="Get notified when patient leaves a safe zone"
          right={() => <List.Icon icon="check" color={theme.colors.primary} />}
        />
        
        <Divider style={styles.itemDivider} />
        
        <List.Item
          title="Medication Reminders"
          description="Get notified about medication schedules"
          right={() => <List.Icon icon="check" color={theme.colors.primary} />}
        />
        
        <Divider style={styles.itemDivider} />
        
        <List.Item
          title="System Alerts"
          description="Get notified about system status (battery, etc.)"
          right={() => <List.Icon icon="check" color={theme.colors.primary} />}
        />
      </Surface>
      
      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Divider style={styles.divider} />
        
        <List.Item
          title="Version"
          description="LumosCare v1.0.0"
        />
        
        <Divider style={styles.itemDivider} />
        
        <List.Item
          title="Terms of Service"
          description="View the terms of service"
          right={() => <List.Icon icon="chevron-right" color={theme.colors.text} />}
          onPress={() => Alert.alert('Terms of Service', 'Terms of service would be displayed here.')}
        />
        
        <Divider style={styles.itemDivider} />
        
        <List.Item
          title="Privacy Policy"
          description="View our privacy policy"
          right={() => <List.Icon icon="chevron-right" color={theme.colors.text} />}
          onPress={() => Alert.alert('Privacy Policy', 'Privacy policy would be displayed here.')}
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
  userCard: {
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
  logoutButton: {
    margin: theme.spacing.medium,
    marginBottom: theme.spacing.xlarge,
  },
});

export default SettingsScreen;