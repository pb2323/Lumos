import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { theme } from '../utils/theme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { PeopleProvider } from '../context/PeopleContext';
import { SafeZonesProvider } from '../context/SafeZonesContext';
import { AlertsProvider } from '../context/AlertsContext';
import LoginScreen from '../screens/LoginScreen';
import MainTabNavigator from './MainTabNavigator';
import AddPersonScreen from '../screens/AddPersonScreen';
import PersonDetailScreen from '../screens/PersonDetailScreen';
import AddSafeZoneScreen from '../screens/AddSafeZoneScreen';
import SafeZoneDetailScreen from '../screens/SafeZoneDetailScreen';
import { NetInfoProvider, useNetInfo } from '@react-native-community/netinfo';

// Custom network status component
const NetworkStatus = () => {
  const netInfo = useNetInfo();
  
  if (!netInfo.isConnected && !netInfo.isInternetReachable) {
    return (
      <View style={{
        backgroundColor: theme.colors.error,
        padding: 5,
        alignItems: 'center',
      }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          No Internet Connection
        </Text>
      </View>
    );
  }
  
  return null;
};

const Stack = createStackNavigator();

// Navigation container that depends on authentication state
const NavigationContents = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  return (
    <PeopleProvider>
      <SafeZonesProvider>
        <AlertsProvider>
          <View style={{ flex: 1 }}>
            <NetworkStatus />
            <Stack.Navigator
              screenOptions={{
                headerStyle: {
                  backgroundColor: theme.colors.surface,
                },
                headerTintColor: theme.colors.text,
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
                cardStyle: { backgroundColor: theme.colors.background },
              }}
            >
              {!user ? (
                // Auth Screens
                <Stack.Screen
                  name="Login"
                  component={LoginScreen}
                  options={{ headerShown: false }}
                />
              ) : (
                // App Screens
                <>
                  <Stack.Screen
                    name="Main"
                    component={MainTabNavigator}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="AddPerson"
                    component={AddPersonScreen}
                    options={{ title: 'Add Person' }}
                  />
                  <Stack.Screen
                    name="PersonDetail"
                    component={PersonDetailScreen}
                    options={{ title: 'Person Details' }}
                  />
                  <Stack.Screen
                    name="AddSafeZone"
                    component={AddSafeZoneScreen}
                    options={{ title: 'Add Safe Zone' }}
                  />
                  <Stack.Screen
                    name="SafeZoneDetail"
                    component={SafeZoneDetailScreen}
                    options={{ title: 'Safe Zone Details' }}
                  />
                </>
              )}
            </Stack.Navigator>
          </View>
        </AlertsProvider>
      </SafeZonesProvider>
    </PeopleProvider>
  );
};

// Wrap the navigation with the auth provider
const AppNavigator = () => {
  return (
    <NetInfoProvider>
      <AuthProvider>
        <NavigationContents />
      </AuthProvider>
    </NetInfoProvider>
  );
};

export default AppNavigator;