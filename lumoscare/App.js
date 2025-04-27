import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme as PaperDefaultTheme } from 'react-native-paper';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { theme } from './src/utils/theme';
import AppNavigator from './src/navigation/AppNavigator';
import SyncManager from './src/utils/SyncManager';
import PeopleService from './src/services/PeopleService';
import SafeZonesService from './src/services/SafeZonesService';
import AlertsService from './src/services/AlertsService';

// Create a theme that includes both React Navigation and React Native Paper
const CombinedTheme = {
  ...NavigationDefaultTheme,
  ...PaperDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    ...PaperDefaultTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.card,
    text: theme.colors.text,
    border: theme.colors.border,
    surface: theme.colors.surface,
    accent: theme.colors.accent,
  },
};

function App() {
  // Set up network change listener for synchronization
  useEffect(() => {
    // Initial sync
    const apiServices = {
      peopleService: PeopleService,
      safeZonesService: SafeZonesService,
      alertsService: AlertsService,
    };
    
    SyncManager.synchronize(apiServices);
    
    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        // When connection is restored, synchronize pending operations
        SyncManager.synchronize(apiServices);
      }
    });
    
    // Clean up on unmount
    return () => {
      unsubscribe()
    };
  }, []);
  
  return (
    <SafeAreaProvider>
      <PaperProvider theme={CombinedTheme}>
        <NavigationContainer>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;