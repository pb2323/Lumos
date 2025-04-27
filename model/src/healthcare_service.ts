import dotenv from 'dotenv';
import path from 'path';
// Initialize dotenv at the beginning of your file
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { z } from "zod";
import axios from "axios";
import express from 'express';
import twilio from 'twilio';
const app = express();
app.use(express.json());

import { defineDAINService, ToolConfig } from "@dainprotocol/service-sdk";

import {
  CardUIBuilder,
  TableUIBuilder,
  MapUIBuilder,
  LayoutUIBuilder,
} from "@dainprotocol/utils";

const port = Number(process.env.PORT) || 2023;
const expressPort = Number(process.env.EXPRESS_PORT) || 3000;

// Add patient location storage
interface PatientLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
}

const patientLocations = new Map<string, PatientLocation>();

// In-memory logs for alerts and calls
const alertHistory: Array<{
  patientId: string;
  message: string;
  priority: string;
  timestamp: string;
}> = [];

const callHistory: Array<{
  patientId: string;
  phoneNumber: string;
  message: string;
  priority: string;
  callStatus: string;
  callId: string;
  timestamp: string;
}> = [];

// Clear stored data on startup
console.log("\n🧹 Clearing stored data...");
patientLocations.clear();
console.log("✅ Stored data cleared");

// Define safe zones (could be fetched from a database)
const safeZones = [
  {
    name: "Home",
    center: { latitude: 34.0522, longitude: -118.2437 },
    radius: 100,  // 100 meters
    description: "Patient's residence area"
  },
  {
    name: "Doctor's Office",
    center: { latitude: 34.0610, longitude: -118.2501 },
    radius: 50,   // 50 meters
    description: "Medical office location"
  }
];

// Add this before starting the DAIN service
app.post('/api/location-update', (req, res) => {
  const { patientId, latitude, longitude } = req.body;
  
  // Store the latest location
  patientLocations.set(patientId, {
    latitude,
    longitude,
    timestamp: new Date().toISOString()
  });
  
  console.log(`\n📱 Received location update from location agent:`);
  console.log(`   Patient ID: ${patientId}`);
  console.log(`   Location: (${latitude}, ${longitude})`);
  console.log(`   Raw request body:`, req.body);
  console.log(`   Safe zones:`, safeZones);
  
  // Process the location data using your existing handler
  checkLocationStatusConfig.handler(
    { patientId, latitude, longitude, safeZones },
    {
      id: "system",
      agentId: '',
      address: ''
    },
    {
      app: undefined
    }
  ).then(result => {
    console.log(`\n🔍 Location Status from location agent:`);
    console.log(`   ${result.text}`);
    if (result.data.currentZone) {
      console.log(`   Current Zone: ${result.data.currentZone}`);
    }
    console.log(`   Distance: ${result.data.distance.toFixed(2)}m`);
    console.log(`   Safe zones used:`, result.data.safeZones);
    
    // Store result or perform actions based on location status
    if (result.data.status === "unsafe") {
      console.log(`\n⚠️ ALERT: Patient ${patientId} is outside safe zones!`);
      // Log alert
      alertHistory.push({
        patientId,
        message: `Patient is outside safe zones at (${latitude}, ${longitude})`,
        priority: "high",
        timestamp: new Date().toISOString()
      });
      // Here you could trigger notifications or other actions
    }
  }).catch(error => {
    console.error(`\n❌ Error processing location update:`, error);
  });
  
  res.status(200).json({ status: "received" });
});

// Start Express server alongside DAIN service
const expressServer = app.listen(expressPort, () => {
  console.log(`Location update API endpoint available at http://localhost:${expressPort}/api/location-update`);
});

// Helper function to get health status emoji
const getHealthStatusEmoji = (status: string): string => {
  switch (status.toLowerCase()) {
    case "critical":
      return "🚨";
    case "warning":
      return "⚠️";
    case "stable":
      return "✅";
    case "good":
      return "🌟";
    default:
      return "❓";
  }
};

// Tool to check patient's location status
const checkLocationStatusConfig: ToolConfig = {
  id: "check-location-status",
  name: "Check Location Status",
  description: "Checks if a patient is within their safe zones",
  input: z
    .object({
      patientId: z.string().describe("Patient ID"),
      latitude: z.number().describe("Current latitude"),
      longitude: z.number().describe("Current longitude"),
      safeZones: z.array(
        z.object({
          name: z.string(),
          center: z.object({
            latitude: z.number(),
            longitude: z.number(),
          }),
          radius: z.number(),
        })
      ).describe("List of safe zones for the patient"),
    })
    .describe("Input parameters for location check"),
  output: z
    .object({
      status: z.string().describe("Location status (safe/unsafe)"),
      currentZone: z.string().optional().describe("Current safe zone name if within one"),
      distance: z.number().describe("Distance to nearest safe zone in meters"),
      safeZones: z.array(
        z.object({
          name: z.string(),
          center: z.object({
            latitude: z.number(),
            longitude: z.number(),
          }),
          radius: z.number(),
          distance: z.number(),
          isWithin: z.boolean(),
          status: z.string()
        })
      ).describe("List of safe zones with their status")
    })
    .describe("Location status information"),
  pricing: { pricePerUse: 0, currency: "USD" },
  handler: async (
    { patientId, latitude, longitude, safeZones },
    agentInfo,
    context
  ) => {
    // Log initial state
    console.log(`Processing location check for patient ${patientId}`);
    console.log(`Location: (${latitude}, ${longitude})`);
    console.log(`Safe zones: ${safeZones.length} zones defined`);

    console.log(`\n📍 Checking location status:`);
    console.log(`   Patient: ${patientId}`);
    console.log(`   Location: (${latitude}, ${longitude})`);
    console.log(`   Safe Zones: ${safeZones.length} zones defined`);

    // Calculate distance to each safe zone
    const distances = safeZones.map((zone) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        zone.center.latitude,
        zone.center.longitude
      );
      console.log(`\nZone Analysis for ${zone.name}:`);
      console.log(`  Zone center: (${zone.center.latitude.toFixed(6)}, ${zone.center.longitude.toFixed(6)})`);
      console.log(`  Patient location: (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
      console.log(`  Calculated distance: ${distance.toFixed(2)} meters`);
      console.log(`  Zone radius: ${zone.radius} meters`);
      console.log(`  Is within zone: ${distance <= zone.radius ? 'Yes' : 'No'}`);
      console.log(`  Status: ${distance <= zone.radius ? 'SAFE' : 'UNSAFE'}`);
      return { 
        zone, 
        distance, 
        isWithin: distance <= zone.radius,
        status: distance <= zone.radius ? 'safe' : 'unsafe'
      };
    });

    // Find nearest safe zone
    const nearest = distances.reduce((prev, curr) =>
      prev.distance < curr.distance ? prev : curr
    );

    // Check if patient is within ANY safe zone
    const isWithinAnyZone = distances.some(d => d.isWithin);
    const status = isWithinAnyZone ? "safe" : "unsafe";
    const statusEmoji = getHealthStatusEmoji(status);

    // Find which zone they're in (if any)
    const currentZone = distances.find(d => d.isWithin)?.zone.name;

    // Log analysis results
    console.log(`\nFinal Analysis:`);
    console.log(`  Patient location: (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
    console.log(`  Nearest zone: ${nearest.zone.name}`);
    console.log(`  Distance to nearest: ${nearest.distance.toFixed(2)} meters`);
    console.log(`  Zone radius: ${nearest.zone.radius} meters`);
    console.log(`  Is within any zone: ${isWithinAnyZone ? 'Yes' : 'No'}`);
    console.log(`  Current zone: ${currentZone || 'None'}`);
    console.log(`  Final status: ${status.toUpperCase()} ${statusEmoji}`);
    console.log(`  Reason: ${isWithinAnyZone ? 
      `Patient is within ${currentZone} zone` : 
      `Patient is outside all safe zones (nearest: ${nearest.zone.name} at ${nearest.distance.toFixed(2)}m)`}`);

    return {
      text: `Patient ${patientId} is ${status}${currentZone ? ` (within ${currentZone} zone)` : ` (${nearest.distance.toFixed(2)} meters from nearest safe zone)`}`,
      data: {
        status,
        currentZone,
        distance: nearest.distance,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
        safeZones: distances.map(d => ({
          name: d.zone.name,
          center: d.zone.center,
          radius: d.zone.radius,
          distance: d.distance,
          isWithin: d.isWithin,
          status: d.status,
          description: d.zone.description
        }))
      },
      ui: new CardUIBuilder()
        .setRenderMode("page")
        .title(`Location Status for Patient ${patientId} ${statusEmoji}`)
        .addChild(
          new MapUIBuilder()
            .setInitialView(latitude, longitude, 12)
            .setMapStyle("mapbox://styles/mapbox/streets-v12")
            .addMarkers([
              {
                latitude,
                longitude,
                title: `Patient ${patientId}`,
                description: `Status: ${status}\nLocation: (${latitude.toFixed(6)}, ${longitude.toFixed(6)})\nDistance: ${nearest.distance.toFixed(2)} meters\nCurrent Zone: ${currentZone || 'None'}`,
                text: `Patient ${statusEmoji}`,
              },
              ...distances.map((d) => ({
                latitude: d.zone.center.latitude,
                longitude: d.zone.center.longitude,
                title: d.zone.name,
                description: `${d.zone.description}\nSafe Zone (${d.zone.radius} meters radius)\nCenter: (${d.zone.center.latitude.toFixed(6)}, ${d.zone.center.longitude.toFixed(6)})\nDistance: ${d.distance.toFixed(2)} meters\nStatus: ${d.isWithin ? 'WITHIN ZONE' : 'OUTSIDE ZONE'}`,
                text: "🏥",
              })),
            ])
            .setRenderMode("inline")
            .build()
        )
        .content(
          `Status: ${status}\n` +
          `Current Zone: ${currentZone || 'None'}\n` +
          `Patient Location: (${latitude.toFixed(6)}, ${longitude.toFixed(6)})\n` +
          `Distance to nearest safe zone: ${nearest.distance.toFixed(2)} meters\n` +
          `Safe Zones:\n` +
          distances.map(d => 
            `- ${d.zone.name}: ${d.distance.toFixed(2)} meters away (radius: ${d.zone.radius} meters) - ${d.isWithin ? 'WITHIN ZONE' : 'OUTSIDE ZONE'}`
          ).join('\n')
        )
        .setRenderMode("inline")
        .build()
    };
  },
};

// Tool to get patient's health metrics
const getHealthMetricsConfig: ToolConfig = {
  id: "get-health-metrics",
  name: "Get Health Metrics",
  description: "Retrieves patient's health metrics and vital signs",
  input: z
    .object({
      patientId: z.string().describe("Patient ID"),
      timeRange: z
        .string()
        .describe("Time range for metrics (e.g., '1h', '24h', '7d')"),
    })
    .describe("Input parameters for health metrics"),
  output: z
    .object({
      times: z.array(z.string()).describe("Timestamps of measurements"),
      heartRate: z.array(z.number()).describe("Heart rate measurements"),
      bloodPressure: z
        .array(
          z.object({
            systolic: z.number(),
            diastolic: z.number(),
          })
        )
        .describe("Blood pressure measurements"),
      temperature: z.array(z.number()).describe("Body temperature measurements"),
      oxygenSaturation: z
        .array(z.number())
        .describe("Blood oxygen saturation measurements"),
    })
    .describe("Health metrics data"),
  pricing: { pricePerUse: 0, currency: "USD" },
  handler: async ({ patientId, timeRange }, agentInfo, context) => {
    console.log(
      `User / Agent ${agentInfo.id} requested health metrics for patient ${patientId}`
    );

    // Simulate health metrics data
    const now = new Date();
    const times = Array.from({ length: 24 }, (_, i) => {
      const time = new Date(now);
      time.setHours(now.getHours() - i);
      return time.toISOString();
    }).reverse();

    const heartRate = times.map(() => 60 + Math.random() * 40);
    const bloodPressure = times.map(() => ({
      systolic: 110 + Math.random() * 30,
      diastolic: 70 + Math.random() * 20,
    }));
    const temperature = times.map(() => 36.5 + Math.random() * 1.5);
    const oxygenSaturation = times.map(() => 95 + Math.random() * 5);

    const statusEmoji = getHealthStatusEmoji("stable");

    return {
      text: `Health metrics for patient ${patientId} available for the last 24 hours`,
      data: {
        times,
        heartRate,
        bloodPressure,
        temperature,
        oxygenSaturation,
      },
      ui: new LayoutUIBuilder()
        .setRenderMode("page")
        .setLayoutType("column")
        .addChild(
          new CardUIBuilder()
            .title(`Health Metrics for Patient ${patientId} ${statusEmoji}`)
            .content("Last 24 hours of measurements")
            .setRenderMode("inline")
            .build()
        )
        .addChild(
          new TableUIBuilder()
            .addColumns([
              { key: "time", header: "Time", type: "string" },
              { key: "heartRate", header: "Heart Rate (bpm)", type: "number" },
              {
                key: "bloodPressure",
                header: "Blood Pressure (mmHg)",
                type: "string",
              },
              { key: "temperature", header: "Temperature (°C)", type: "number" },
              {
                key: "oxygenSaturation",
                header: "O2 Saturation (%)",
                type: "number",
              },
            ])
            .rows(
              times.map((t, i) => ({
                time: new Date(t).toLocaleString(),
                heartRate: Math.round(heartRate[i]),
                bloodPressure: `${Math.round(
                  bloodPressure[i].systolic
                )}/${Math.round(bloodPressure[i].diastolic)}`,
                temperature: temperature[i].toFixed(1),
                oxygenSaturation: Math.round(oxygenSaturation[i]),
              }))
            )
            .setRenderMode("inline")
            .build()
        )
        .setRenderMode("inline")
        .build(),
    };
  },
};

// Add new tool to get patient location
const getPatientLocationConfig: ToolConfig = {
  id: "get-patient-location",
  name: "Get Patient Location",
  description: "Retrieves the latest known location of a patient",
  input: z
    .object({
      patientId: z.string().describe("Patient ID"),
    })
    .describe("Input parameters for location request"),
  output: z
    .object({
      latitude: z.number().describe("Patient's latitude"),
      longitude: z.number().describe("Patient's longitude"),
      timestamp: z.string().describe("When the location was last updated"),
    })
    .describe("Patient's latest location information"),
  pricing: { pricePerUse: 0, currency: "USD" },
  handler: async ({ patientId }, agentInfo, context) => {
    const location = patientLocations.get(patientId);
    
    if (!location) {
      return {
        text: `No location data available for patient ${patientId}`,
        data: {
          latitude: 0,
          longitude: 0,
          timestamp: new Date().toISOString()
        },
        ui: new CardUIBuilder()
          .setRenderMode("inline")
          .title(`Location for Patient ${patientId}`)
          .content("No location data available")
          .build()
      };
    }

    return {
      text: `Latest location for patient ${patientId}: (${location.latitude}, ${location.longitude})`,
      data: location,
      ui: new CardUIBuilder()
        .setRenderMode("page")
        .title(`Location for Patient ${patientId}`)
        .addChild(
          new MapUIBuilder()
            .setInitialView(location.latitude, location.longitude, 12)
            .setMapStyle("mapbox://styles/mapbox/streets-v12")
            .addMarkers([
              {
                latitude: location.latitude,
                longitude: location.longitude,
                title: `Patient ${patientId}`,
                description: `Last updated: ${new Date(location.timestamp).toLocaleString()}`,
                text: `Patient 📍`,
              }
            ])
            .setRenderMode("inline")
            .build()
        )
        .content(`Last updated: ${new Date(location.timestamp).toLocaleString()}`)
        .setRenderMode("inline")
        .build()
    };
  },
};

// Debug logging for environment variables
console.log('\n🔧 Environment Configuration:');
console.log(`   Current Directory: ${__dirname}`);
console.log(`   .env Path: ${path.resolve(__dirname, '../.env')}`);
console.log(`   TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not Set'}`);
console.log(`   TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not Set'}`);
console.log(`   TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER}`);
console.log(`   BASE_URL: ${process.env.BASE_URL}`);

// Initialize Twilio client with proper credentials
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.error('❌ Twilio credentials not found in environment variables');
  process.exit(1);
}

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Verify Twilio client initialization
console.log('\n🔧 Twilio Client Configuration:');
console.log(`   Account SID: ${twilioClient.username}`);
console.log(`   Account Status: ${twilioClient ? 'Initialized' : 'Failed'}`);

// Helper function to format phone number to E.164
function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If the number doesn't start with 1, add it
  if (!cleaned.startsWith('1')) {
    return `+1${cleaned}`;
  }
  
  // Add the + prefix
  return `+${cleaned}`;
}

// Add phone call configuration
const phoneCallConfig: ToolConfig = {
  id: "make-phone-call",
  name: "Make Phone Call",
  description: "Makes a phone call to notify about patient status",
  input: z
    .object({
      patientId: z.string().describe("Patient ID"),
      phoneNumber: z.string().describe("Phone number to call"),
      message: z.string().describe("Message to deliver"),
      priority: z.enum(["high", "medium", "low"]).describe("Call priority"),
    })
    .describe("Input parameters for phone call"),
  output: z
    .object({
      callStatus: z.string().describe("Status of the call"),
      callId: z.string().describe("Twilio call ID"),
      timestamp: z.string().describe("When the call was made"),
    })
    .describe("Phone call result"),
  pricing: { pricePerUse: 0, currency: "USD" },
  handler: async ({ patientId, phoneNumber, message, priority }, agentInfo, context) => {
    console.log(`\n📞 Making phone call:`);
    console.log(`   Patient ID: ${patientId}`);
    console.log(`   Original Phone Number: ${phoneNumber}`);
    
    // Format the phone number
    const formattedNumber = formatPhoneNumber(phoneNumber);
    console.log(`   Formatted Phone Number: ${formattedNumber}`);
    console.log(`   Message: ${message}`);
    console.log(`   Priority: ${priority}`);
    console.log(`   Twilio Config:`);
    console.log(`     Account SID: ${process.env.TWILIO_ACCOUNT_SID}`);
    console.log(`     From Number: ${process.env.TWILIO_PHONE_NUMBER}`);
    console.log(`     Base URL: ${process.env.BASE_URL}`);

    try {
      // Make the call using Twilio
      console.log(`   Initiating Twilio call...`);
      const call = await twilioClient.calls.create({
        to: formattedNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
        twiml: `<Response><Say>${message}</Say></Response>`,
        statusCallback: `${process.env.BASE_URL}/api/call-status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST'
      });

      // Log call
      callHistory.push({
        patientId,
        phoneNumber,
        message,
        priority,
        callStatus: call.status,
        callId: call.sid,
        timestamp: new Date().toISOString()
      });

      console.log(`   ✅ Call initiated successfully`);
      console.log(`   Call ID: ${call.sid}`);
      console.log(`   Call Status: ${call.status}`);
      console.log(`   Call Direction: ${call.direction}`);
      console.log(`   Call Duration: ${call.duration}`);

      return {
        text: `Phone call to ${formattedNumber} initiated successfully`,
        data: {
          callStatus: "initiated",
          callId: call.sid,
          timestamp: new Date().toISOString()
        },
        ui: new CardUIBuilder()
          .setRenderMode("page")
          .title(`Phone Call Status 📞`)
          .content(
            `Patient ID: ${patientId}\n` +
            `Phone Number: ${formattedNumber}\n` +
            `Message: ${message}\n` +
            `Priority: ${priority}\n` +
            `Status: Initiated\n` +
            `Call ID: ${call.sid}\n` +
            `Call Status: ${call.status}\n` +
            `Call Direction: ${call.direction}`
          )
          .setRenderMode("inline")
          .build()
      };
    } catch (error) {
      console.error(`   ❌ Error making phone call:`, error);
      console.error(`   Error details:`, {
        message: error.message,
        code: error.code,
        status: error.status,
        moreInfo: error.moreInfo
      });
      return {
        text: `Failed to make phone call to ${formattedNumber}`,
        data: {
          callStatus: "failed",
          error: error.message,
          timestamp: new Date().toISOString()
        },
        ui: new CardUIBuilder()
          .setRenderMode("page")
          .title(`Phone Call Status ❌`)
          .content(
            `Patient ID: ${patientId}\n` +
            `Phone Number: ${formattedNumber}\n` +
            `Message: ${message}\n` +
            `Priority: ${priority}\n` +
            `Status: Failed\n` +
            `Error: ${error.message}\n` +
            `Error Code: ${error.code}\n` +
            `Error Status: ${error.status}`
          )
          .setRenderMode("inline")
          .build()
      };
    }
  },
};

// Add make-call endpoint
app.post('/api/make-call', async (req, res) => {
  const { patientId, phoneNumber, message, priority } = req.body;
  
  console.log(`\n📞 Received call request:`);
  console.log(`   Patient ID: ${patientId}`);
  console.log(`   Phone Number: ${phoneNumber}`);
  console.log(`   Message: ${message}`);
  console.log(`   Priority: ${priority}`);
  
  try {
    // Format the phone numbers
    const formattedToNumber = formatPhoneNumber(phoneNumber);
    const formattedFromNumber = formatPhoneNumber(process.env.TWILIO_PHONE_NUMBER || '');
    
    console.log(`   Formatted To Number: ${formattedToNumber}`);
    console.log(`   Formatted From Number: ${formattedFromNumber}`);
    console.log(`   Twilio Config:`);
    console.log(`     Account SID: ${process.env.TWILIO_ACCOUNT_SID}`);
    console.log(`     From Number: ${formattedFromNumber}`);
    console.log(`     Base URL: ${process.env.BASE_URL}`);
    
    // Configure call based on priority
    const callConfig = {
      to: formattedToNumber,
      from: formattedFromNumber,
      twiml: `<Response><Say>${message}</Say></Response>`,
      statusCallback: `${process.env.BASE_URL}/api/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    };

    // Add priority-specific settings
    if (priority === 'high') {
      callConfig['timeout'] = 30;  // 30 seconds timeout for high priority
      callConfig['retry'] = true;  // Retry if call fails
      callConfig['retryAttempts'] = 3;  // Try up to 3 times
    } else {
      callConfig['timeout'] = 60;  // 60 seconds timeout for normal calls
    }
    
    // Make the call using Twilio
    console.log(`   Initiating Twilio call...`);
    console.log(`   Priority: ${priority}`);
    console.log(`   Call Config:`, callConfig);
    
    const call = await twilioClient.calls.create(callConfig);

    // Log call
    callHistory.push({
      patientId,
      phoneNumber,
      message,
      priority,
      callStatus: call.status,
      callId: call.sid,
      timestamp: new Date().toISOString()
    });
    
    // For high priority calls, wait for initial status
    if (priority === 'high') {
      console.log(`   Waiting for high-priority call status...`);
      // Wait for a short time to get initial status
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get updated call status
      const updatedCall = await twilioClient.calls(call.sid).fetch();
      console.log(`   Updated Call Status: ${updatedCall.status}`);
      
      // If call is queued, try to force it through
      if (updatedCall.status === 'queued') {
        console.log(`   Call is queued, attempting to force through...`);
        try {
          await twilioClient.calls(call.sid).update({
            status: 'in-progress' as any
          });
          console.log(`   Call status updated to in-progress`);
        } catch (error) {
          console.error(`   Failed to force call through:`, error);
        }
      }
    }
    
    res.status(200).json({
      status: "success",
      callId: call.sid,
      callStatus: call.status,
      priority: priority
    });
  } catch (error) {
    console.error(`   ❌ Error making phone call:`, error);
    console.error(`   Error details:`, {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo
    });
    
    res.status(500).json({
      status: "error",
      error: error.message,
      code: error.code
    });
  }
});

// Add call status webhook endpoint
app.post('/api/call-status', async (req, res) => {
  const { CallSid, CallStatus, CallDuration, From, To } = req.body;
  console.log(`\n📞 Call Status Update:`);
  console.log(`   Call ID: ${CallSid}`);
  console.log(`   Status: ${CallStatus}`);
  console.log(`   Duration: ${CallDuration}`);
  console.log(`   From: ${From}`);
  console.log(`   To: ${To}`);
  
  // Handle different call statuses
  switch (CallStatus) {
    case 'initiated':
      console.log(`   Call is being initiated...`);
      break;
    case 'ringing':
      console.log(`   Phone is ringing...`);
      break;
    case 'answered':
      console.log(`   Call was answered!`);
      break;
    case 'completed':
      console.log(`   Call completed successfully`);
      break;
    case 'failed':
      console.log(`   Call failed`);
      break;
    case 'busy':
      console.log(`   Line was busy`);
      break;
    case 'no-answer':
      console.log(`   No answer`);
      break;
    case 'queued':
      console.log(`   Call is queued, attempting to force through...`);
      try {
        await twilioClient.calls(CallSid).update({
          status: 'in-progress' as any
        });
        console.log(`   Call status updated to in-progress`);
      } catch (error) {
        console.error(`   Failed to force call through:`, error);
      }
      break;
    default:
      console.log(`   Unknown status: ${CallStatus}`);
  }
  
  res.status(200).send('OK');
});

// Helper function to calculate distance between two points in meters
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  // Calculate raw coordinate differences
  const latDiff = lat2 - lat1;
  const lonDiff = lon2 - lon1;
  const latDiffMeters = latDiff * 111000; // Approximate meters per degree of latitude
  const lonDiffMeters = lonDiff * 111000 * Math.cos((lat1 + lat2) * Math.PI / 360); // Approximate meters per degree of longitude

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters

  console.log(`\nDistance calculation details:`);
  console.log(`  From: (${lat1.toFixed(6)}, ${lon1.toFixed(6)})`);
  console.log(`  To: (${lat2.toFixed(6)}, ${lon2.toFixed(6)})`);
  console.log(`  Raw coordinate differences:`);
  console.log(`    Latitude: ${latDiff.toFixed(6)} degrees (≈ ${latDiffMeters.toFixed(2)} meters)`);
  console.log(`    Longitude: ${lonDiff.toFixed(6)} degrees (≈ ${lonDiffMeters.toFixed(2)} meters)`);
  console.log(`  Haversine distance: ${distance.toFixed(2)} meters`);
  return distance;
}

// Add DAIN tool: get-alert-call-history
const getAlertCallHistoryConfig: ToolConfig = {
  id: "get-alert-call-history",
  name: "Get Alert/Call History",
  description: "Shows all alerts and phone calls for a patient",
  input: z.object({ patientId: z.string() }),
  output: z.object({
    alerts: z.array(z.object({
      message: z.string(),
      priority: z.string(),
      timestamp: z.string()
    })),
    calls: z.array(z.object({
      phoneNumber: z.string(),
      message: z.string(),
      priority: z.string(),
      callStatus: z.string(),
      callId: z.string(),
      timestamp: z.string()
    }))
  }),
  handler: async ({ patientId }, agentInfo, context) => {
    const alerts = alertHistory.filter(a => a.patientId === patientId);
    const calls = callHistory.filter(c => c.patientId === patientId);

    return {
      text: `Alert and call history for patient ${patientId}`,
      data: { alerts, calls },
      ui: new LayoutUIBuilder()
        .setRenderMode("page")
        .setLayoutType("column")
        .addChild(
          new CardUIBuilder()
            .title(`Alerts for ${patientId}`)
            .content(alerts.length === 0 ? "No alerts." : "")
            .setRenderMode("inline")
            .build()
        )
        .addChild(
          new TableUIBuilder()
            .addColumns([
              { key: "timestamp", header: "Time", type: "string" },
              { key: "message", header: "Message", type: "string" },
              { key: "priority", header: "Priority", type: "string" }
            ])
            .rows(alerts.map(a => ({
              timestamp: new Date(a.timestamp).toLocaleString(),
              message: a.message,
              priority: a.priority
            })))
            .setRenderMode("inline")
            .build()
        )
        .addChild(
          new CardUIBuilder()
            .title(`Calls for ${patientId}`)
            .content(calls.length === 0 ? "No calls." : "")
            .build()
        )
        .addChild(
          new TableUIBuilder()
            .addColumns([
              { key: "timestamp", header: "Time", type: "string" },
              { key: "phoneNumber", header: "Phone", type: "string" },
              { key: "message", header: "Message", type: "string" },
              { key: "priority", header: "Priority", type: "string" },
              { key: "callStatus", header: "Status", type: "string" }
            ])
            .rows(calls.map(c => ({
              timestamp: new Date(c.timestamp).toLocaleString(),
              phoneNumber: c.phoneNumber,
              message: c.message,
              priority: c.priority,
              callStatus: c.callStatus
            })))
            .setRenderMode("inline")
            .build()
        )
        .setRenderMode("inline")
        .build()
    };
  }
};

// Add DAIN tool: get-patients-outside-safe-zones
const getPatientsOutsideSafeZonesConfig: ToolConfig = {
  id: "get-patients-outside-safe-zones",
  name: "Get Patients Outside Safe Zones",
  description: "Lists all patients currently outside their safe zones",
  input: z.object({}),
  output: z.array(z.object({
    patientId: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    timestamp: z.string()
  })),
  handler: async (_, agentInfo, context) => {
    const outOfZone: Array<{ patientId: string, latitude: number, longitude: number, timestamp: string }> = [];
    for (const [patientId, location] of patientLocations.entries()) {
      // Use the same logic as checkLocationStatusConfig
      const distances = safeZones.map((zone) => {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          zone.center.latitude,
          zone.center.longitude
        );
        return distance <= zone.radius;
      });
      const isSafe = distances.some(Boolean);
      if (!isSafe) {
        outOfZone.push({
          patientId,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp
        });
      }
    }
    return {
      text: `Patients currently outside safe zones: ${outOfZone.length}`,
      data: outOfZone,
      ui: new TableUIBuilder()
        .addColumns([
          { key: "patientId", header: "Patient ID", type: "string" },
          { key: "latitude", header: "Latitude", type: "number" },
          { key: "longitude", header: "Longitude", type: "number" },
          { key: "timestamp", header: "Last Updated", type: "string" }
        ])
        .rows(outOfZone.map(p => ({
          patientId: p.patientId,
          latitude: p.latitude,
          longitude: p.longitude,
          timestamp: new Date(p.timestamp).toLocaleString()
        })))
        .setRenderMode("inline")
        .build()
    };
  }
};

const healthcareService = defineDAINService({
  metadata: {
    title: "Healthcare Monitoring DAIN Service",
    description:
      "A DAIN service for monitoring patient locations and health metrics",
    version: "1.0.0",
    author: "Your Name",
    tags: ["healthcare", "monitoring", "patient", "dain"],
    logo: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
  },
  exampleQueries: [
    {
      category: "Location",
      queries: [
        "Is patient 123 within their safe zones?",
        "Check location status for patient 456",
        "Where is patient 789?",
        "Get latest location for patient 123",
      ],
    },
    {
      category: "Health Metrics",
      queries: [
        "Show me patient 123's vital signs",
        "Get health metrics for patient 456",
        "What are patient 789's latest measurements?",
      ],
    },
    {
      category: "Phone Calls",
      queries: [
        "Call patient 123 about their location",
        "Make an emergency call to patient 456",
        "Schedule a wellness check call for patient 789",
      ],
    },
  ],
  identity: {
    apiKey: process.env.DAIN_API_KEY
  },
  tools: [
    checkLocationStatusConfig,
    getHealthMetricsConfig,
    getPatientLocationConfig,
    phoneCallConfig,
    getAlertCallHistoryConfig,
    getPatientsOutsideSafeZonesConfig
  ],
});

// Add error handling for service startup
healthcareService.startNode({ port: port })
  .then(({ address }) => {
    console.log("Healthcare DAIN Service is running at :" + address().port);
  })
  .catch((error) => {
    console.error("Failed to start Healthcare DAIN Service:", error);
    process.exit(1);
  }); 

// Add shutdown handler
process.on('SIGINT', () => {
  expressServer.close();
  process.exit(0);
});