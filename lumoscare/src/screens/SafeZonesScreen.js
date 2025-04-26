import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Surface, Switch, IconButton, FAB, ActivityIndicator, Divider } from 'react-native-paper';
import { useSafeZones } from '../context/SafeZonesContext';
import { theme } from '../utils/theme';

const SafeZonesScreen = ({ navigation }) => {
  const { safeZones, loading, updateSafeZone } = useSafeZones();
  const [expandedZone, setExpandedZone] = useState(null);
  
  // Toggle zone active status
  const toggleZoneActive = async (zone) => {
    try {
      await updateSafeZone(zone.id, { active: !zone.active });
    } catch (error) {
      console.error('Error toggling zone status:', error);
    }
  };
  
  // Render a single safe zone item
  const renderZoneItem = ({ item }) => {
    const isExpanded = expandedZone === item.id;
    
    return (
      <Surface style={styles.zoneCard}>
        <TouchableOpacity
          style={styles.zoneHeader}
          onPress={() => setExpandedZone(isExpanded ? null : item.id)}
        >
          <View style={styles.zoneInfo}>
            <Text style={styles.zoneName}>{item.name}</Text>
            <Text style={styles.zoneAddress} numberOfLines={isExpanded ? undefined : 1}>
              {item.address}
            </Text>
          </View>
          
          <View style={styles.zoneControls}>
            <Switch
              value={item.active}
              onValueChange={() => toggleZoneActive(item)}
              color={theme.colors.primary}
            />
            <IconButton
              icon={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              onPress={() => setExpandedZone(isExpanded ? null : item.id)}
              color={theme.colors.text}
            />
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <Divider style={styles.divider} />
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>Radius:</Text>
              <Text style={styles.expandedValue}>{item.radius} meters</Text>
            </View>
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>Status:</Text>
              <Text 
                style={[
                  styles.expandedValue, 
                  { color: item.active ? theme.colors.secondary : theme.colors.textSecondary }
                ]}
              >
                {item.active ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <View style={styles.expandedActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('SafeZoneDetail', { zoneId: item.id })}
              >
                <IconButton
                  icon="pencil"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={[styles.actionText, { color: theme.colors.primary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('SafeZoneDetail', { 
                  zoneId: item.id,
                  initialTab: 'map'
                })}
              >
                <IconButton
                  icon="map-marker"
                  size={20}
                  color={theme.colors.text}
                />
                <Text style={styles.actionText}>View Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Surface>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading safe zones...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {safeZones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No safe zones configured</Text>
          <Text style={styles.emptySubtext}>
            Safe zones help monitor when a patient wanders outside of familiar areas.
          </Text>
        </View>
      ) : (
        <FlatList
          data={safeZones}
          keyExtractor={(item) => item.id}
          renderItem={renderZoneItem}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <FAB
        style={styles.fab}
        icon="plus"
        color="#fff"
        onPress={() => navigation.navigate('AddSafeZone')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.medium,
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.body,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.large,
  },
  emptyText: {
    fontSize: theme.fonts.sizes.subheading,
    color: theme.colors.text,
    marginBottom: theme.spacing.medium,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.large,
  },
  listContent: {
    padding: theme.spacing.medium,
  },
  zoneCard: {
    marginBottom: theme.spacing.medium,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.medium,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: theme.fonts.sizes.subheading,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  zoneAddress: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
  },
  zoneControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandedContent: {
    padding: theme.spacing.medium,
    paddingTop: 0,
  },
  divider: {
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.medium,
  },
  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.small,
  },
  expandedLabel: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.textSecondary,
  },
  expandedValue: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  expandedActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.medium,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.small,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default SafeZonesScreen;