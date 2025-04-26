const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { setupWebSocket } = require('./services/websocketService');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 50001;

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket
const wsServer = setupWebSocket(server);

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Connect to MongoDB
connectDB();

// Import routes
const userRoutes = require('./routes/users');
const faceRoutes = require('./routes/faces');
const safeZoneRoutes = require('./routes/safeZones');
const alertRoutes = require('./routes/alerts');
const memoryLogRoutes = require('./routes/memoryLogs');
const agentRoutes = require('./routes/agent');
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/faces', faceRoutes);
app.use('/api/safe-zones', safeZoneRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/memory-logs', memoryLogRoutes);
app.use('/api/agent', agentRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({
    message: 'LumosCare API is running',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});