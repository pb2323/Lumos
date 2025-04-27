import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme as PaperDefaultTheme } from 'react-native-paper';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { theme } from './src/utils/theme';
import AppNavigator from './src/navigation/AppNavigator';

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

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={CombinedTheme}>
        <NavigationContainer theme={CombinedTheme}>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}