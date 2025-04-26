const axios = require('axios');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

// Generate memory context
const generateMemoryContext = async (person, previousInteractions = []) => {
  try {
    const prompt = `
      Generate a natural, supportive memory prompt about this person:
      Name: ${person.name}
      Relationship: ${person.relationship}
      Notes: ${person.notes || 'None'}
      Previous interactions: ${JSON.stringify(previousInteractions)}
      
      Keep the prompt concise (under 50 words), warm, and conversational. 
      Include relationship context and maybe one memory detail if available.
    `;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100
        }
      }
    );

    if (response.data &&
        response.data.candidates &&
        response.data.candidates.length > 0 &&
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts.length > 0) {
      return response.data.candidates[0].content.parts[0].text.trim();
    }
    
    return null;
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
};

// Summarize journal entry
const summarizeJournalEntry = async (journalText) => {
  try {
    const prompt = `
      Summarize this journal entry in 1-2 sentences, preserving key emotions and events:
      
      ${journalText}
    `;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 100
        }
      }
    );

    if (response.data &&
        response.data.candidates &&
        response.data.candidates.length > 0 &&
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts.length > 0) {
      return response.data.candidates[0].content.parts[0].text.trim();
    }
    
    return null;
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
};

module.exports = {
  generateMemoryContext,
  summarizeJournalEntry
};
