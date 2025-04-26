import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { theme } from '../utils/theme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { PeopleProvider } from '../context/PeopleContext';
import LoginScreen from '../screens/LoginScreen';
import MainTabNavigator from './MainTabNavigator';
import AddPersonScreen from '../screens/AddPersonScreen';
import PersonDetailScreen from '../screens/PersonDetailScreen';

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
          </>
        )}
      </Stack.Navigator>
    </PeopleProvider>
  );
};

// Wrap the navigation with the auth provider
const AppNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContents />
    </AuthProvider>
  );
};

export default AppNavigator;