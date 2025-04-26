const MemoryLog = require('../models/MemoryLog');
const { validationResult } = require('express-validator');
const { summarizeJournalEntry } = require('../services/geminiApi');

// Create a new memory log
exports.createMemoryLog = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { 
      patientId, 
      type, 
      content, 
      relatedPersons, 
      coordinates 
    } = req.body;
    
    // Create memory log
    const memoryLog = new MemoryLog({
      patientId,
      type,
      content,
      relatedPersons,
      location: coordinates ? {
        type: 'Point',
        coordinates
      } : undefined
    });

    // Generate summary for journal entries
    if (type === 'journal' && content) {
      const summary = await summarizeJournalEntry(content);
      if (summary) {
        memoryLog.summary = summary;
      }
    }

    await memoryLog.save();

    res.status(201).json({
      success: true,
      data: memoryLog
    });
  } catch (error) {
    console.error('Create memory log error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating memory log'
    });
  }
};

// Get memory logs for a patient
exports.getMemoryLogs = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { type, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = { patientId };
    
    if (type) {
      query.type = type;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch logs
    const logs = await MemoryLog.find(query)
      .populate('relatedPersons', 'name relationship')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const totalCount = await MemoryLog.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: logs.length,
      total: totalCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      },
      data: logs
    });
  } catch (error) {
    console.error('Get memory logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving memory logs'
    });
  }
};

// Get memory logs related to a specific person
exports.getPersonMemoryLogs = async (req, res) => {
  try {
    const { personId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch logs related to this person
    const logs = await MemoryLog.find({ relatedPersons: personId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const totalCount = await MemoryLog.countDocuments({ relatedPersons: personId });
    
    res.status(200).json({
      success: true,
      count: logs.length,
      total: totalCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      },
      data: logs
    });
  } catch (error) {
    console.error('Get person memory logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving person memory logs'
    });
  }
};
