// src/screens/LoginScreen.js

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText, Divider } from 'react-native-paper';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { login, register, signInWithGoogle, loading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  
  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };
  
  // Handle legacy email/password sign in
  const handleEmailSignIn = async () => {
    if (showRegister) {
      await register(name, email, password);
    } else {
      await login(email, password);
    }
  };
  
  const toggleForm = () => {
    setShowRegister(!showRegister);
    // Clear form fields and errors when switching forms
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>LumosCare</Text>
          <Text style={styles.tagline}>Brings light back to fading memories</Text>
        </View>
        
        <Surface style={styles.formContainer}>
          <Text style={styles.formTitle}>{showRegister ? 'Create Account' : 'Welcome Back'}</Text>
          
          {error ? (
            <HelperText type="error" visible={true}>
              {error}
            </HelperText>
          ) : null}
          
          {/* Google Sign In Button */}
          <Button
            mode="outlined"
            icon="google"
            onPress={handleGoogleSignIn}
            style={styles.googleButton}
            loading={loading}
            disabled={loading}
          >
            Continue with Google
          </Button>
          
          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <Divider style={styles.divider} />
          </View>
          
          {/* Legacy Email/Password Form */}
          {showRegister && (
            <TextInput
              label="Full Name"
              mode="outlined"
              value={name}
              onChangeText={setName}
              style={styles.input}
              textColor='#FFFFFF'
              theme={{ colors: { primary: theme.colors.primary } }}
              dense
            />
          )}
          
          <TextInput
            label="Email"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
            textColor='#FFFFFF'
            theme={{ colors: { primary: theme.colors.primary } }}
            dense
            autoCapitalize="none"
          />
          
          <TextInput
            label="Password"
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            textColor='#FFFFFF'
            theme={{ colors: { primary: theme.colors.primary } }}
            dense
          />
          
          {!showRegister && (
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
          
          <Button
            mode="contained"
            onPress={handleEmailSignIn}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            {showRegister ? 'Register' : 'Login'}
          </Button>
          
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {showRegister ? 'Already have an account?' : 'Don\'t have an account?'}
            </Text>
            <TouchableOpacity onPress={toggleForm}>
              <Text style={styles.toggleButton}>{showRegister ? 'Sign In' : 'Register'}</Text>
            </TouchableOpacity>
          </View>
        </Surface>
        
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>About LumosCare</Text>
          <Text style={styles.introText}>
            LumosCare is an AI-powered memory assistance system designed for individuals with Alzheimer's and memory-related conditions.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.large,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xlarge,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.tiny,
  },
  tagline: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  formContainer: {
    padding: theme.spacing.large,
    borderRadius: theme.roundness,
    elevation: 4,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.large,
  },
  formTitle: {
    fontSize: theme.fonts.sizes.subheading,
    fontWeight: 'bold',
    marginBottom: theme.spacing.medium,
    color: theme.colors.text,
    textAlign: 'center',
  },
  googleButton: {
    marginBottom: theme.spacing.medium,
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.medium,
  },
  divider: {
    flex: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing.small,
    fontSize: theme.fonts.sizes.small,
  },
  input: {
    marginBottom: theme.spacing.medium,
    backgroundColor: theme.colors.background,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.medium,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.small,
  },
  button: {
    marginVertical: theme.spacing.medium,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.tiny,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.small,
  },
  toggleText: {
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.small,
  },
  toggleButton: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  introContainer: {
    marginTop: theme.spacing.large,
  },
  introTitle: {
    fontSize: theme.fonts.sizes.subheading,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.medium,
  },
  introText: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
});

export default LoginScreen;