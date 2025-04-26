import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing people in AsyncStorage
const PEOPLE_STORAGE_KEY = 'lumoscare_people';

// Get a list of all people for a specific patient
export const getPeople = async (patientId) => {
  try {
    const peopleJSON = await AsyncStorage.getItem(PEOPLE_STORAGE_KEY);
    if (peopleJSON) {
      const people = JSON.parse(peopleJSON);
      return people.filter(person => person.patientId === patientId);
    }
    return [];
  } catch (error) {
    console.error('Error getting people:', error);
    return [];
  }
};

// Get a specific person by ID
export const getPersonById = async (personId) => {
  try {
    const peopleJSON = await AsyncStorage.getItem(PEOPLE_STORAGE_KEY);
    if (peopleJSON) {
      const people = JSON.parse(peopleJSON);
      return people.find(person => person.id === personId);
    }
    return null;
  } catch (error) {
    console.error('Error getting person by ID:', error);
    return null;
  }
};

// Add a new person
export const addPerson = async (personData) => {
  try {
    // Generate a unique ID (in a real app, this would come from the backend)
    const newPerson = {
      ...personData,
      id: Math.random().toString(36).substring(2, 15),
      lastInteraction: new Date().toISOString()
    };
    
    // Get existing people
    const peopleJSON = await AsyncStorage.getItem(PEOPLE_STORAGE_KEY);
    let people = [];
    if (peopleJSON) {
      people = JSON.parse(peopleJSON);
    }
    
    // Add new person
    people.push(newPerson);
    
    // Save updated list
    await AsyncStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people));
    
    return newPerson;
  } catch (error) {
    console.error('Error adding person:', error);
    throw error;
  }
};

// Update an existing person
export const updatePerson = async (personId, updatedData) => {
  try {
    const peopleJSON = await AsyncStorage.getItem(PEOPLE_STORAGE_KEY);
    if (peopleJSON) {
      let people = JSON.parse(peopleJSON);
      
      // Find person index
      const personIndex = people.findIndex(p => p.id === personId);
      
      if (personIndex !== -1) {
        // Update person data
        people[personIndex] = {
          ...people[personIndex],
          ...updatedData
        };
        
        // Save updated list
        await AsyncStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people));
        return people[personIndex];
      }
    }
    throw new Error('Person not found');
  } catch (error) {
    console.error('Error updating person:', error);
    throw error;
  }
};

// Delete a person
export const deletePerson = async (personId) => {
  try {
    const peopleJSON = await AsyncStorage.getItem(PEOPLE_STORAGE_KEY);
    if (peopleJSON) {
      let people = JSON.parse(peopleJSON);
      
      // Filter out the person to delete
      const updatedPeople = people.filter(p => p.id !== personId);
      
      // Save updated list
      await AsyncStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(updatedPeople));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting person:', error);
    throw error;
  }
};

// Add sample data for development/demo purposes
export const addSamplePeople = async (patientId) => {
  const samplePeople = [
    {
      id: 'sample1',
      name: 'Sarah Johnson',
      relationship: 'Daughter',
      photoUrl: null, // In a real app, this would be a URL
      notes: 'Has two children named Emma and Jack',
      lastInteraction: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      patientId,
    },
    {
      id: 'sample2',
      name: 'Michael Smith',
      relationship: 'Son',
      photoUrl: null,
      notes: 'Lives in Chicago, visits monthly',
      lastInteraction: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      patientId,
    },
    {
      id: 'sample3',
      name: 'Robert Adams',
      relationship: 'Friend',
      photoUrl: null,
      notes: 'Plays chess together every Sunday',
      lastInteraction: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      patientId,
    },
  ];
  
  try {
    await AsyncStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(samplePeople));
    return samplePeople;
  } catch (error) {
    console.error('Error adding sample people:', error);
    throw error;
  }
};