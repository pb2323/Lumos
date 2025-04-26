import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Surface, Text, Card, Button, Avatar, Badge, IconButton } from 'react-native-paper';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { usePeople } from '../context/PeopleContext';
import { useSafeZones } from '../context/SafeZonesContext';
import { useAlerts } from '../context/AlertsContext';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { people } = usePeople();
  const { safeZones } = useSafeZones();
  const { alerts, resolveAlert } = useAlerts();
  
  const patientName = user?.patients?.[0]?.name || 'No patient added';
  
  // Find active safe zone
  const currentZone = safeZones.find(zone => zone.active) || null;
  
  // Get recent active alerts (up to 2)
  const recentAlerts = alerts
    .filter(alert => !alert.resolved)
    .sort((a, b) => new Date(b.created) - new Date(a.created))
    .slice(0, 2);
  
  const renderPriorityBadge = (priority) => {
    let color;
    switch (priority) {
      case 'high':
        return <Badge style={[styles.priorityBadge, { backgroundColor: theme.colors.error }]} size={12} />;
      case 'medium':
        return <Badge style={[styles.priorityBadge, { backgroundColor: theme.colors.accent }]} size={12} />;
      default:
        return <Badge style={[styles.priorityBadge, { backgroundColor: theme.colors.secondary }]} size={12} />;
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
      await resolveAlert(alertId, 'Marked as resolved from Dashboard');
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.headerCard}>
        <View style={styles.headerContent}>
          <Avatar.Text
            size={64}
            label={patientName.substring(0, 2)}
            backgroundColor={theme.colors.primary}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.patientName}>{patientName}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: currentZone ? theme.colors.secondary : theme.colors.disabled }]} />
              <Text style={styles.statusText}>
                Current location: {currentZone ? currentZone.name : 'Unknown'}
              </Text>
            </View>
            <Text style={styles.lastActivity}>Last activity: 10 minutes ago</Text>
          </View>
        </View>
        <View style={styles.quickActions}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AddPerson')}
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
            compact
          >
            Add Person
          </Button>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AddSafeZone')}
            style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
            labelStyle={styles.actionButtonLabel}
            compact
          >
            Add Zone
          </Button>
        </View>
      </Surface>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Alerts</Text>
          <IconButton
            icon="arrow-right"
            color={theme.colors.text}
            size={20}
            onPress={() => navigation.navigate('Alerts')}
          />
        </View>
        
        {recentAlerts.length > 0 ? (
          recentAlerts.map(alert => (
            <Card key={alert.id} style={styles.alertCard}>
              <Card.Content style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  {renderPriorityBadge(alert.priority)}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    <Text style={styles.alertTime}>{formatTime(alert.created)}</Text>
                  </View>
                </View>
                <Button 
                  mode="text" 
                  compact
                  onPress={() => handleResolveAlert(alert.id)}
                >
                  Resolve
                </Button>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyCardText}>No active alerts right now</Text>
            </Card.Content>
          </Card>
        )}
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recognized People</Text>
          <IconButton
            icon="arrow-right"
            color={theme.colors.text}
            size={20}
            onPress={() => navigation.navigate('People')}
          />
        </View>
        
        <View style={styles.recognizedPeopleGrid}>
          {people.slice(0, 3).map(person => (
            <TouchableOpacity 
              key={person.id} 
              style={styles.personContainer}
              onPress={() => navigation.navigate('PersonDetail', { personId: person.id })}
            >
              <Avatar.Text
                size={48}
                label={person.name.substring(0, 2)}
                backgroundColor={theme.colors.primary}
              />
              <Text style={styles.personName}>{person.name}</Text>
              <Text style={styles.personRelationship}>{person.relationship}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={styles.personContainer}
            onPress={() => navigation.navigate('AddPerson')}
          >
            <Avatar.Icon
              size={48}
              icon="plus"
              backgroundColor={theme.colors.surface}
              color={theme.colors.primary}
              style={styles.addPersonIcon}
            />
            <Text style={[styles.personName, { color: theme.colors.primary }]}>Add Person</Text>
            <Text style={styles.personRelationship}></Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Safe Zones</Text>
          <IconButton
            icon="arrow-right"
            color={theme.colors.text}
            size={20}
            onPress={() => navigation.navigate('Safe Zones')}
          />
        </View>
        
        <View style={styles.safeZonesContainer}>
          {safeZones.slice(0, 2).map((zone) => (
            <TouchableOpacity
              key={zone.id}
              style={styles.safeZoneCard}
              onPress={() => navigation.navigate('SafeZoneDetail', { zoneId: zone.id })}
            >
              <View style={styles.safeZoneInfo}>
                <View style={styles.safeZoneNameContainer}>
                  <View style={[styles.activeIndicator, { backgroundColor: zone.active ? theme.colors.secondary : theme.colors.disabled }]} />
                  <Text style={styles.safeZoneName}>{zone.name}</Text>
                </View>
                <Text style={styles.safeZoneRadius}>Radius: {zone.radius}m</Text>
              </View>
              <IconButton
                icon="chevron-right"
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[styles.safeZoneCard, styles.addSafeZoneCard]}
            onPress={() => navigation.navigate('AddSafeZone')}
          >
            <Text style={[styles.safeZoneName, { color: theme.colors.primary }]}>Add New Safe Zone</Text>
            <IconButton
              icon="plus"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Memory Journal</Text>
          <IconButton
            icon="arrow-right"
            color={theme.colors.text}
            size={20}
            onPress={() => navigation.navigate('Journal')}
          />
        </View>
        
        <Card style={styles.journalCard}>
          <Card.Content>
            <Text style={styles.journalEntryTime}>Today, 10:35 AM</Text>
            <Text style={styles.journalEntry}>
              "I had a wonderful morning in the garden. The roses are blooming beautifully this year."
            </Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerCard: {
    margin: theme.spacing.medium,
    padding: theme.spacing.medium,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: theme.spacing.medium,
    flex: 1,
  },
  patientName: {
    fontSize: theme.fonts.sizes.subheading,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
  },
  lastActivity: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.medium,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonLabel: {
    fontSize: 12,
  },
  section: {
    marginHorizontal: theme.spacing.medium,
    marginBottom: theme.spacing.large,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.small,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.subheading,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  alertCard: {
    marginBottom: theme.spacing.small,
    backgroundColor: theme.colors.surface,
  },
  alertContent: {
    padding: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    marginRight: theme.spacing.small,
  },
  alertMessage: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.text,
    marginBottom: 2,
  },
  alertTime: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.medium,
  },
  emptyCardText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  recognizedPeopleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  personContainer: {
    width: '25%', // 4 persons per row
    alignItems: 'center',
    marginBottom: theme.spacing.medium,
  },
  personName: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  personRelationship: {
    fontSize: theme.fonts.sizes.status,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  addPersonIcon: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  safeZonesContainer: {
    marginTop: theme.spacing.small,
  },
  safeZoneCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.small,
  },
  safeZoneInfo: {
    flex: 1,
  },
  safeZoneNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  safeZoneName: {
    fontSize: theme.fonts.sizes.body,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  safeZoneRadius: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
  },
  addSafeZoneCard: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  journalCard: {
    backgroundColor: theme.colors.surface,
  },
  journalEntryTime: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  journalEntry: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.text,
    fontStyle: 'italic',
  },
});

export default DashboardScreen;