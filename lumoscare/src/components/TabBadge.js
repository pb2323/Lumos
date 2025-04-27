import React from 'react';
import { StyleSheet } from 'react-native';
import { Badge } from 'react-native-paper';
import { theme } from '../utils/theme';

const TabBadge = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <Badge
      style={styles.badge}
      size={16}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -10,
    backgroundColor: theme.colors.error,
  },
});

export default TabBadge;