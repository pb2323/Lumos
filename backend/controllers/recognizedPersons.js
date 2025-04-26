const RecognizedPerson = require('../models/RecognizedPerson');
const { validationResult } = require('express-validator');

// Create a new recognized person
exports.createRecognizedPerson = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { name, relationship, faceData, notes, patientId } = req.body;
    
    // Create recognized person
    const person = new RecognizedPerson({
      patientId,
      name,
      relationship,
      faceData,
      notes
    });

    await person.save();

    res.status(201).json({
      success: true,
      data: person
    });
  } catch (error) {
    console.error('Create recognized person error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating recognized person'
    });
  }
};

// Get all recognized persons for a patient
exports.getRecognizedPersons = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const persons = await RecognizedPerson.find({ patientId });
    
    res.status(200).json({
      success: true,
      count: persons.length,
      data: persons
    });
  } catch (error) {
    console.error('Get recognized persons error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving recognized persons'
    });
  }
};

// Update a recognized person
exports.updateRecognizedPerson = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    const { name, relationship, faceData, notes, lastInteractionDate, lastInteractionSummary } = req.body;
    
    // Find and update person
    const person = await RecognizedPerson.findByIdAndUpdate(
      id,
      { 
        name, 
        relationship, 
        faceData, 
        notes,
        lastInteractionDate,
        lastInteractionSummary,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Recognized person not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: person
    });
  } catch (error) {
    console.error('Update recognized person error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating recognized person'
    });
  }
};

// Delete a recognized person
exports.deleteRecognizedPerson = async (req, res) => {
  try {
    const { id } = req.params;
    
    const person = await RecognizedPerson.findByIdAndDelete(id);
    
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Recognized person not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Recognized person deleted successfully'
    });
  } catch (error) {
    console.error('Delete recognized person error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting recognized person'
    });
  }
};
