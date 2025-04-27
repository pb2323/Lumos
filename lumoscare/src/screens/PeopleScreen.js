import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, Searchbar, Button, Surface, FAB, Chip, ActivityIndicator } from 'react-native-paper';
import { usePeople } from '../context/PeopleContext';
import { theme } from '../utils/theme';

const PeopleScreen = ({ navigation }) => {
  const { people, loading } = usePeople();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  
  useEffect(() => {
    if (people) {
      filterPeople(searchQuery, activeFilter);
    }
  }, [people, searchQuery, activeFilter]);
  
  const filterPeople = (query, filter) => {
    let filtered = [...people];
    
    // Apply text search
    if (query) {
      filtered = filtered.filter(person => 
        person.name.toLowerCase().includes(query.toLowerCase()) ||
        person.relationship.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(person => 
        person.relationship.toLowerCase() === filter.toLowerCase()
      );
    }
    
    setFilteredPeople(filtered);
  };
  
  // Get all unique relationships for filter chips
  const getUniqueRelationships = () => {
    const relationships = people.map(person => person.relationship);
    return ['all', ...new Set(relationships)];
  };
  
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
  
  // Render a single person item
  const renderPersonItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PersonDetail', { personId: item.id })}
    >
      <Surface style={styles.personCard}>
        <Avatar.Text
          size={50}
          label={item.name.substring(0, 2)}
          backgroundColor={theme.colors.primary}
        />
        <View style={styles.personInfo}>
          <Text style={styles.personName}>{item.name}</Text>
          <Text style={styles.personRelationship}>{item.relationship}</Text>
          <Text style={styles.lastInteraction}>
            Last seen: {formatLastInteraction(item.lastInteraction)}
          </Text>
        </View>
      </Surface>
    </TouchableOpacity>
  );
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading people...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search people..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
        inputStyle={{ color: theme.colors.text }}
        placeholderTextColor={theme.colors.textSecondary}
        textColor='#FFFFFF'
        theme={{ colors: { primary: theme.colors.primary } }}
      />
      
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={getUniqueRelationships()}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Chip
              selected={item === activeFilter}
              onPress={() => setActiveFilter(item)}
              style={[
                styles.filterChip,
                item === activeFilter && styles.activeFilterChip
              ]}
              textStyle={[
                styles.filterChipText,
                item === activeFilter && styles.activeFilterChipText
              ]}
            >
              {item === 'all' ? 'All' : item}
            </Chip>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>
      
      {filteredPeople.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No people found</Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AddPerson')}
            style={styles.addButton}
          >
            Add Person
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredPeople}
          keyExtractor={(item) => item.id}
          renderItem={renderPersonItem}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <FAB
        style={styles.fab}
        icon="plus"
        color="#fff"
        onPress={() => navigation.navigate('AddPerson')}
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
  searchBar: {
    margin: theme.spacing.medium,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
  },
  filterChip: {
    marginRight: theme.spacing.small,
    backgroundColor: theme.colors.surface,
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
  listContent: {
    padding: theme.spacing.medium,
  },
  personCard: {
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  personInfo: {
    marginLeft: theme.spacing.medium,
    flex: 1,
  },
  personName: {
    fontSize: theme.fonts.sizes.subheading,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  personRelationship: {
    fontSize: theme.fonts.sizes.body,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  lastInteraction: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.large,
  },
  emptyText: {
    fontSize: theme.fonts.sizes.subheading,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.large,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default PeopleScreen;