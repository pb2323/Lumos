const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const CLOUDFLARE_API_URL = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts`;

// Deploy a Cloudflare Worker
const deployWorker = async (scriptName, scriptContent) => {
  try {
    const response = await axios({
      method: 'PUT',
      url: `${CLOUDFLARE_API_URL}/${scriptName}`,
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/javascript'
      },
      data: scriptContent
    });
    
    return response.data;
  } catch (error) {
    console.error('Cloudflare Worker deployment error:', error);
    throw new Error('Failed to deploy Cloudflare Worker');
  }
};

// Create alert processing worker script
const createAlertProcessingWorker = () => {
  const scriptContent = `
    addEventListener('fetch', event => {
      event.respondWith(handleRequest(event.request))
    })
    
    async function handleRequest(request) {
      // Process incoming alert data
      if (request.method === 'POST') {
        try {
          const alertData = await request.json()
          
          // Process the alert
          const result = await processAlert(alertData)
          
          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
          })
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
          })
        }
      }
      
      // Handle other requests
      return new Response('Alert Processing Worker', {
        headers: { 'Content-Type': 'text/plain' },
        status: 200
      })
    }
    
    async function processAlert(alertData) {
      // Process the alert based on its type
      switch (alertData.type) {
        case 'location':
          // Process location alert
          return await processLocationAlert(alertData)
        case 'medication':
          // Process medication alert
          return await processMedicationAlert(alertData)
        default:
          return { status: 'processed', message: 'Generic alert processed' }
      }
    }
    
    async function processLocationAlert(alertData) {
      // Simulate sending notification to caregiver
      console.log(\`Location alert for patient \${alertData.patientId}: \${alertData.message}\`)
      
      // In a real implementation, you would call APIs to send notifications
      
      return {
        status: 'processed',
        timestamp: new Date().toISOString(),
        message: 'Location alert processed and notifications sent'
      }
    }
    
    async function processMedicationAlert(alertData) {
      // Simulate sending reminder to patient
      console.log(\`Medication reminder for patient \${alertData.patientId}: \${alertData.message}\`)
      
      // In a real implementation, you would call APIs to send notifications
      
      return {
        status: 'processed',
        timestamp: new Date().toISOString(),
        message: 'Medication alert processed and reminders sent'
      }
    }
  `;
  
  return deployWorker('lumos-alert-processor', scriptContent);
};

module.exports = {
  deployWorker,
  createAlertProcessingWorker
};
