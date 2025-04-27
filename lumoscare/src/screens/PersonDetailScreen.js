import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Surface, Button, Avatar, Divider, TextInput, IconButton, Dialog, Portal } from 'react-native-paper';
import { usePeople } from '../context/PeopleContext';
import { theme } from '../utils/theme';

const PersonDetailScreen = ({ route, navigation }) => {
  const { personId } = route.params;
  const { getPersonById, updatePerson, deletePerson, loading } = usePeople();
  const [person, setPerson] = useState(getPersonById(personId));
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(person?.name || '');
  const [editedRelationship, setEditedRelationship] = useState(person?.relationship || '');
  const [editedNotes, setEditedNotes] = useState(person?.notes || '');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  if (!person) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Person not found</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: theme.colors.primary }}
        >
          Go Back
        </Button>
      </View>
    );
  }
  
  // Format the last interaction date
  const formatLastInteraction = (dateString) => {
    if (!dateString) return 'No interactions';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };
  
  // Save edited information
  const handleSave = async () => {
    try {
      const updatedPerson = await updatePerson(person.id, {
        name: editedName,
        relationship: editedRelationship,
        notes: editedNotes,
      });
      
      setPerson(updatedPerson);
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update person');
    }
  };
  
  // Delete this person
  const handleDelete = async () => {
    try {
      await deletePerson(person.id);
      setShowDeleteDialog(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete person');
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header}>
        <View style={styles.profileSection}>
          <Avatar.Text
            size={80}
            label={person.name.substring(0, 2)}
            backgroundColor={theme.colors.primary}
          />
          
          {!isEditing ? (
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{person.name}</Text>
              <Text style={styles.relationship}>{person.relationship}</Text>
              <Text style={styles.lastSeen}>
                Last seen: {formatLastInteraction(person.lastInteraction)}
              </Text>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <TextInput
                value={editedName}
                onChangeText={setEditedName}
                style={styles.editInput}
                textColor='#FFFFFF'
                theme={{ colors: { primary: theme.colors.primary } }}
                dense
              />
              <TextInput
                value={editedRelationship}
                onChangeText={setEditedRelationship}
                style={styles.editInput}
                textColor='#FFFFFF'
                theme={{ colors: { primary: theme.colors.primary } }}
                dense
              />
            </View>
          )}
        </View>
        
        <View style={styles.actions}>
          {isEditing ? (
            <>
              <Button
                mode="contained"
                onPress={handleSave}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                loading={loading}
                disabled={loading}
              >
                Save
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  setEditedName(person.name);
                  setEditedRelationship(person.relationship);
                  setEditedNotes(person.notes);
                  setIsEditing(false);
                }}
                style={styles.actionButton}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                mode="contained"
                onPress={() => setIsEditing(true)}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              >
                Edit
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowDeleteDialog(true)}
                style={styles.actionButton}
                textColor={theme.colors.error}
              >
                Delete
              </Button>
            </>
          )}
        </View>
      </Surface>
      
      <Surface style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Notes & Context</Text>
        {!isEditing ? (
          <Text style={styles.notes}>{person.notes || 'No notes added yet.'}</Text>
        ) : (
          <TextInput
            value={editedNotes}
            onChangeText={setEditedNotes}
            multiline
            numberOfLines={4}
            style={styles.editNotesInput}
            textColor='#FFFFFF'
            theme={{ colors: { primary: theme.colors.primary } }}
          />
        )}
      </Surface>
      
      <Surface style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Interaction History</Text>
        <Text style={styles.emptyText}>No interaction history yet.</Text>
      </Surface>
      
      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.text }}>Delete Person</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.text }}>
              Are you sure you want to delete {person.name}? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)} textColor={theme.colors.primary}>
              Cancel
            </Button>
            <Button 
              onPress={handleDelete} 
              textColor={theme.colors.error}
              loading={loading}
              disabled={loading}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.large,
    backgroundColor: theme.colors.background,
  },
  notFoundText: {
    fontSize: theme.fonts.sizes.subheading,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.large,
  },
  header: {
    padding: theme.spacing.medium,
    borderRadius: 0,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.medium,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.medium,
  },
  profileInfo: {
    marginLeft: theme.spacing.medium,
    flex: 1,
  },
  name: {
    fontSize: theme.fonts.sizes.headline,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  relationship: {
    fontSize: theme.fonts.sizes.subheading,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  lastSeen: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
  },
  editInput: {
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.small,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.small,
  },
  detailsCard: {
    margin: theme.spacing.medium,
    marginTop: 0,
    padding: theme.spacing.medium,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.subheading,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.medium,
  },
  notes: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.text,
    lineHeight: 22,
  },
  editNotesInput: {
    backgroundColor: theme.colors.background,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default PersonDetailScreen;