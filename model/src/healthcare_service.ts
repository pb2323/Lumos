import dotenv from 'dotenv';
// Initialize dotenv at the beginning of your file
dotenv.config();
import { z } from "zod";
import axios from "axios";

import { defineDAINService, ToolConfig } from "@dainprotocol/service-sdk";

import {
  CardUIBuilder,
  TableUIBuilder,
  MapUIBuilder,
  LayoutUIBuilder,
} from "@dainprotocol/utils";

const port = Number(process.env.PORT) || 2023;

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
    })
    .describe("Location status information"),
  pricing: { pricePerUse: 0, currency: "USD" },
  handler: async (
    { patientId, latitude, longitude, safeZones },
    agentInfo,
    context
  ) => {
    console.log(
      `Checking location status for patient ${patientId} at (${latitude},${longitude})`
    );

    // Calculate distance to each safe zone
    const distances = safeZones.map((zone) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        zone.center.latitude,
        zone.center.longitude
      );
      return { zone, distance };
    });

    // Find nearest safe zone
    const nearest = distances.reduce((prev, curr) =>
      prev.distance < curr.distance ? prev : curr
    );

    const status = nearest.distance <= nearest.zone.radius ? "safe" : "unsafe";
    const statusEmoji = getHealthStatusEmoji(status);

    return {
      text: `Patient ${patientId} is ${status} (${nearest.distance.toFixed(2)}m from nearest safe zone)`,
      data: {
        status,
        currentZone: status === "safe" ? nearest.zone.name : undefined,
        distance: nearest.distance,
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
                description: `Status: ${status}\nDistance: ${nearest.distance.toFixed(2)}m`,
                text: `Patient ${statusEmoji}`,
              },
              ...safeZones.map((zone) => ({
                latitude: zone.center.latitude,
                longitude: zone.center.longitude,
                title: zone.name,
                description: `Safe Zone (${zone.radius}m radius)`,
                text: "🏥",
              })),
            ])
            .setRenderMode("inline")
            .build()
        )
        .content(
          `Status: ${status}\nDistance to nearest safe zone: ${nearest.distance.toFixed(
            2
          )}m`
        )
        .setRenderMode("inline")
        .build(),
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
            .build()
        )
        .build(),
    };
  },
};

// Helper function to calculate distance between two points
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

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

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
  ],
  identity: {
    apiKey: process.env.DAIN_API_KEY
  },
  tools: [checkLocationStatusConfig, getHealthMetricsConfig],
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