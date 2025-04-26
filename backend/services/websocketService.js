const WebSocket = require('websocket').server;
const http = require('http');
const jwt = require('jsonwebtoken');

const clients = {}; // Map to store active connections

const setupWebSocket = (server) => {
  const wsServer = new WebSocket({
    httpServer: server,
    autoAcceptConnections: false
  });

  // Verify client origin
  const originIsAllowed = (origin) => {
    // In production, you would check against a list of allowed origins
    return true;
  };

  wsServer.on('request', (request) => {
    if (!originIsAllowed(request.origin)) {
        request.reject();
        console.log(`Connection from origin ${request.origin} rejected.`);
        return;
      }
  
      // Extract token from URL query parameters
      const url = new URL(request.httpRequest.url, 'http://localhost');
      const token = url.searchParams.get('token');
      
      if (!token) {
        request.reject(401, 'No authentication token provided');
        return;
      }
      
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        const connection = request.accept(null, request.origin);
        console.log(`WebSocket connection established for user: ${userId}`);
        
        // Store the connection with the user ID as the key
        clients[userId] = connection;
        
        // Handle messages
        connection.on('message', (message) => {
          if (message.type === 'utf8') {
            console.log(`Received message from user ${userId}: ${message.utf8Data}`);
            
            // Handle different message types based on JSON structure
            try {
              const data = JSON.parse(message.utf8Data);
              
              // Process message based on type
              switch (data.type) {
                case 'ping':
                  connection.sendUTF(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                  break;
                // Add other message types as needed
                default:
                  console.log(`Unknown message type: ${data.type}`);
              }
            } catch (error) {
              console.error('Error processing message:', error);
            }
          }
        });
        
        // Handle connection close
        connection.on('close', (reasonCode, description) => {
          console.log(`Connection closed for user ${userId}: ${reasonCode} - ${description}`);
          delete clients[userId];
        });
        
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        request.reject(401, 'Invalid authentication token');
      }
    });
    
    return wsServer;
  };
  
  // Send notification to a specific user
  const sendToUser = (userId, data) => {
    if (clients[userId]) {
      clients[userId].sendUTF(JSON.stringify(data));
      return true;
    }
    return false;
  };
  
  // Send notification to multiple users
  const sendToUsers = (userIds, data) => {
    let sentCount = 0;
    userIds.forEach(userId => {
      if (sendToUser(userId, data)) {
        sentCount++;
      }
    });
    return sentCount;
  };
  
  // Broadcast to all connected clients
  const broadcast = (data) => {
    let sentCount = 0;
    Object.keys(clients).forEach(userId => {
      clients[userId].sendUTF(JSON.stringify(data));
      sentCount++;
    });
    return sentCount;
  };
  
  module.exports = {
    setupWebSocket,
    sendToUser,
    sendToUsers,
    broadcast
  };