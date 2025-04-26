import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Surface, Text, Card, Button, Avatar, Badge, IconButton } from 'react-native-paper';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { usePeople } from '../context/PeopleContext';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { people } = usePeople();
  
  const patientName = user?.patients?.[0]?.name || 'No patient added';
  
  // Mock data for our dashboard
  const mockData = {
    location: 'Home',
    lastActivity: '10 minutes ago',
    alerts: [
      { id: '1', type: 'zone', message: 'Left safe zone: Home', time: '15 minutes ago', priority: 'high' },
      { id: '2', type: 'reminder', message: 'Missed medication: Aricept', time: '2 hours ago', priority: 'medium' },
    ],
  };
  
  const renderPriorityBadge = (priority) => {
    let color;
    switch (priority) {
      case 'high':
        color = '#CF6679'; // Error color
        break;
      case 'medium':
        color = theme.colors.accent;
        break;
      default:
        color = theme.colors.secondary;
    }
    
    return (
      <Badge
        style={[styles.priorityBadge, { backgroundColor: color }]}
        size={12}
      />
    );
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
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Current location: {mockData.location}</Text>
            </View>
            <Text style={styles.lastActivity}>Last activity: {mockData.lastActivity}</Text>
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
            onPress={() => navigation.navigate('SafeZones')}
            style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
            labelStyle={styles.actionButtonLabel}
            compact
          >
            Safe Zones
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
        
        {mockData.alerts.map(alert => (
          <Card key={alert.id} style={styles.alertCard}>
            <Card.Content style={styles.alertContent}>
              <View style={styles.alertHeader}>
                {renderPriorityBadge(alert.priority)}
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <Text style={styles.alertTime}>{alert.time}</Text>
                </View>
              </View>
              <Button 
                mode="text" 
                compact
                onPress={() => {}}
              >
                Resolve
              </Button>
            </Card.Content>
          </Card>
        ))}
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
    backgroundColor: theme.colors.secondary,
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