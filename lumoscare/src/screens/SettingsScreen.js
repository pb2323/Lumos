// src/screens/SettingsScreen.js
import React from 'react';
import ProfileScreen from './ProfileScreen';

// For simplicity, we'll just use the ProfileScreen as our SettingsScreen
const SettingsScreen = (props) => {
  return <ProfileScreen {...props} />;
};

export default SettingsScreen;