// src/config/api.js
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

// API base URL
export const API_BASE_URL = ENV_API_BASE_URL || "http://localhost:5000/api";

// Rest of the code...
// API endpoints
export const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    GOOGLE: "/auth/google",
    REGISTER: "/auth/register",
  },
  
  // User endpoints
  USERS: {
    ME: "/users/me",
    CARE_CIRCLE: "/users/care-circle",
  },
  
  // Face/Person endpoints
  FACES: {
    BASE: "/faces",
    BY_PATIENT: (patientId) => `/faces/patient/${patientId}`,
    BY_ID: (personId) => `/faces/${personId}`,
  },
  
  // Safe zone endpoints
  SAFE_ZONES: {
    BASE: "/safe-zones",
    BY_PATIENT: (patientId) => `/safe-zones/patient/${patientId}`,
    BY_ID: (zoneId) => `/safe-zones/${zoneId}`,
  },
  
  // Alert endpoints
  ALERTS: {
    BASE: "/alerts",
    BY_PATIENT: (patientId) => `/alerts/patient/${patientId}`,
    STATUS: (alertId) => `/alerts/${alertId}/status`,
  },
  
  // Memory log endpoints
  MEMORY_LOGS: {
    BASE: "/memory-logs",
    BY_PATIENT: (patientId) => `/memory-logs/patient/${patientId}`,
    BY_PERSON: (personId) => `/memory-logs/person/${personId}`,
  },
  
  // Agent endpoints
  AGENT: {
    FACE_RECOGNITION: "/agent/face-recognition",
    CHECK_LOCATION: "/agent/check-location",
    MEDICATION_REMINDER: "/agent/medication-reminder",
  },
};

// Default request timeout (in ms)
export const REQUEST_TIMEOUT = 10000;

// API response status codes
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};