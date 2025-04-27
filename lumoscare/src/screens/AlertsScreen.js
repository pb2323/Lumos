import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Surface, Chip, IconButton, Badge, ActivityIndicator, Divider, Button, Searchbar, Menu } from 'react-native-paper';
import { useAlerts } from '../context/AlertsContext';
import { theme } from '../utils/theme';

const AlertsScreen = ({ navigation }) => {
  const { alerts, loading, resolveAlert } = useAlerts();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState(null);
  
  // Filter alerts based on search, resolution status, type, and priority
  const filteredAlerts = alerts.filter(alert => {
    // Filter by search query
    const matchesSearch = alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (alert.details && alert.details.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by resolution status
    const matchesResolution = showResolved ? true : !alert.resolved;
    
    // Filter by type
    const matchesType = filterType === 'all' || alert.type === filterType;
    
    // Filter by priority
    const matchesPriority = filterPriority === 'all' || alert.priority === filterPriority;
    
    return matchesSearch && matchesResolution && matchesType && matchesPriority;
  });
  
  // Get the appropriate icon for each alert type
  const getAlertIcon = (type) => {
    switch (type) {
      case 'zone':
        return 'map-marker-radius';
      case 'reminder':
        return 'pill';
      case 'system':
        return 'cog';
      default:
        return 'bell';
    }
  };
  
  // Get color for priority badge
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.accent;
      default:
        return theme.colors.disabled;
    }
  };
  
  // Format time string
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} minute${diffInMins !== 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };
  
  // Handle resolving an alert
  const handleResolveAlert = async (alertId) => {
    try {
      await resolveAlert(alertId, 'Marked as resolved by caregiver');
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };
  
  // Render a single alert item
  const renderAlertItem = ({ item }) => {
    const isExpanded = expandedAlert === item.id;
    
    return (
      <Surface style={[styles.alertCard, item.resolved && styles.resolvedCard]}>
        <TouchableOpacity
          style={styles.alertHeader}
          onPress={() => setExpandedAlert(isExpanded ? null : item.id)}
        >
          <View style={styles.alertHeaderLeft}>
            <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]} />
            <IconButton
              icon={getAlertIcon(item.type)}
              size={24}
              color={item.resolved ? theme.colors.disabled : theme.colors.text}
            />
            <View style={styles.alertInfo}>
              <Text style={[styles.alertMessage, item.resolved && styles.resolvedText]}>{item.message}</Text>
              <Text style={styles.alertTime}>{formatTime(item.created)}</Text>
            </View>
          </View>
          <IconButton
            icon={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.text}
            onPress={() => setExpandedAlert(isExpanded ? null : item.id)}
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <Divider style={styles.divider} />
            
            <Text style={styles.detailsTitle}>Details:</Text>
            <Text style={styles.detailsText}>{item.details || 'No additional details available.'}</Text>
            
            <View style={styles.alertMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Type:</Text>
                <Chip style={styles.typeChip}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Chip>
              </View>
              
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Priority:</Text>
                <Chip 
                  style={[styles.priorityChip, { backgroundColor: getPriorityColor(item.priority) }]}
                  textStyle={styles.priorityChipText}
                >
                  {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                </Chip>
              </View>
            </View>
            
            {item.resolved ? (
              <View style={styles.resolutionInfo}>
                <Text style={styles.resolutionLabel}>Resolved: {formatTime(item.resolvedAt)}</Text>
                {item.resolutionNotes && (
                  <Text style={styles.resolutionNotes}>{item.resolutionNotes}</Text>
                )}
              </View>
            ) : (
              <Button
                mode="contained"
                onPress={() => handleResolveAlert(item.id)}
                style={styles.resolveButton}
              >
                Mark as Resolved
              </Button>
            )}
          </View>
        )}
      </Surface>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading alerts...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Surface style={styles.filtersContainer}>
        <Searchbar
          placeholder="Search alerts..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={{ color: theme.colors.text }}
          iconColor={theme.colors.primary}
          placeholderTextColor={theme.colors.disabled}
        />
        
        <View style={styles.filterChips}>
          <Chip
            selected={!showResolved}
            onPress={() => setShowResolved(false)}
            style={[styles.filterChip, !showResolved && styles.activeFilterChip]}
            textStyle={[styles.filterChipText, !showResolved && styles.activeFilterChipText]}
          >
            Active
          </Chip>
          <Chip
            selected={showResolved}
            onPress={() => setShowResolved(true)}
            style={[styles.filterChip, showResolved && styles.activeFilterChip]}
            textStyle={[styles.filterChipText, showResolved && styles.activeFilterChipText]}
          >
            Resolved
          </Chip>
          
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Chip
                icon="filter-variant"
                onPress={() => setMenuVisible(true)}
                style={styles.filterMenuChip}
              >
                Filters
              </Chip>
            }
            contentStyle={styles.menuContent}
          >
            <Menu.Item
              onPress={() => {}}
              title="Filter by Type"
              titleStyle={styles.menuSectionTitle}
              disabled
            />
            <Menu.Item
              onPress={() => setFilterType('all')}
              title="All Types"
              titleStyle={filterType === 'all' ? styles.selectedMenuItem : styles.menuItem}
            />
            <Menu.Item
              onPress={() => setFilterType('zone')}
              title="Location Alerts"
              titleStyle={filterType === 'zone' ? styles.selectedMenuItem : styles.menuItem}
            />
            <Menu.Item
              onPress={() => setFilterType('reminder')}
              title="Reminders"
              titleStyle={filterType === 'reminder' ? styles.selectedMenuItem : styles.menuItem}
            />
            <Menu.Item
              onPress={() => setFilterType('system')}
              title="System Alerts"
              titleStyle={filterType === 'system' ? styles.selectedMenuItem : styles.menuItem}
            />
            <Divider />
            <Menu.Item
              onPress={() => {}}
              title="Filter by Priority"
              titleStyle={styles.menuSectionTitle}
              disabled
            />
            <Menu.Item
              onPress={() => setFilterPriority('all')}
              title="All Priorities"
              titleStyle={filterPriority === 'all' ? styles.selectedMenuItem : styles.menuItem}
            />
            <Menu.Item
              onPress={() => setFilterPriority('high')}
              title="High"
              titleStyle={filterPriority === 'high' ? styles.selectedMenuItem : styles.menuItem}
            />
            <Menu.Item
              onPress={() => setFilterPriority('medium')}
              title="Medium"
              titleStyle={filterPriority === 'medium' ? styles.selectedMenuItem : styles.menuItem}
            />
            <Menu.Item
              onPress={() => setFilterPriority('low')}
              title="Low"
              titleStyle={filterPriority === 'low' ? styles.selectedMenuItem : styles.menuItem}
            />
          </Menu>
        </View>
      </Surface>
      
      {filteredAlerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No alerts found</Text>
          <Text style={styles.emptySubText}>
            {searchQuery || filterType !== 'all' || filterPriority !== 'all' 
              ? 'Try adjusting your filters'
              : showResolved 
                ? 'No resolved alerts yet'
                : 'No active alerts right now'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAlerts}
          keyExtractor={(item) => item.id}
          renderItem={renderAlertItem}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  filtersContainer: {
    padding: theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  searchBar: {
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.small,
    elevation: 0,
  },
  filterChips: {
    flexDirection: 'row',
    marginTop: theme.spacing.small,
  },
  filterChip: {
    marginRight: theme.spacing.small,
    backgroundColor: theme.colors.background,
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.text,
  },
  activeFilterChipText: {
    color: '#fff',
  },
  filterMenuChip: {
    marginRight: theme.spacing.small,
    backgroundColor: theme.colors.background,
  },
  menuContent: {
    backgroundColor: theme.colors.surface,
  },
  menuSectionTitle: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  menuItem: {
    color: theme.colors.text,
  },
  selectedMenuItem: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.large,
  },
  emptyText: {
    fontSize: theme.fonts.sizes.subheading,
    color: theme.colors.text,
    marginBottom: theme.spacing.small,
  },
  emptySubText: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    padding: theme.spacing.medium,
  },
  alertCard: {
    marginBottom: theme.spacing.medium,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  resolvedCard: {
    opacity: 0.7,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.small,
  },
  alertHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  alertInfo: {
    flex: 1,
  },
  alertMessage: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  resolvedText: {
    color: theme.colors.textSecondary,
  },
  alertTime: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
  },
  expandedContent: {
    padding: theme.spacing.medium,
  },
  divider: {
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.medium,
  },
  detailsTitle: {
    fontSize: theme.fonts.sizes.body,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.small,
  },
  detailsText: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.medium,
  },
  alertMeta: {
    flexDirection: 'row',
    marginBottom: theme.spacing.medium,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.large,
  },
  metaLabel: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.small,
  },
  typeChip: {
    height: 24,
    backgroundColor: theme.colors.background,
  },
  priorityChip: {
    height: 24,
  },
  priorityChipText: {
    color: '#fff',
  },
  resolutionInfo: {
    marginTop: theme.spacing.small,
    padding: theme.spacing.small,
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
  },
  resolutionLabel: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
  },
  resolutionNotes: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.text,
    marginTop: theme.spacing.small,
    fontStyle: 'italic',
  },
  resolveButton: {
    marginTop: theme.spacing.small,
    backgroundColor: theme.colors.secondary,
  },
});

export default AlertsScreen;