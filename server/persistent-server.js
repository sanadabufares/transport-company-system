const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = 5001;

console.log('Starting persistent server...');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enhanced logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  if (req.method === 'POST' && req.url === '/api/auth/login') {
    console.log('[LOGIN] Received login request');
    console.log('[LOGIN] Body:', JSON.stringify(req.body, null, 2));
  }
  
  next();
});

// Test route
app.get('/api/test', (req, res) => {
  console.log('[TEST] Test endpoint called');
  res.json({ 
    message: 'Server is working!', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Login endpoint with detailed logging
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('[LOGIN] Processing login request...');
    
    const { username, password } = req.body;
    
    console.log('[LOGIN] Username:', username);
    console.log('[LOGIN] Password length:', password ? password.length : 'undefined');
    
    // Hardcoded credentials for testing
    if (username === 'admin' && password === 'admin123') {
      console.log('[LOGIN] Credentials match - generating token');
      
      const token = jwt.sign(
        { 
          id: 1, 
          username: 'admin', 
          email: 'admin@transport.com',
          role: 'admin' 
        },
        process.env.JWT_SECRET || 'transport_company_secret_key',
        { expiresIn: '1d' }
      );
      
      const response = {
        token: token,
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@transport.com',
          role: 'admin'
        }
      };
      
      console.log('[LOGIN] Success - sending response');
      console.log('[LOGIN] Token generated:', token.substring(0, 20) + '...');
      
      res.json(response);
    } else {
      console.log('[LOGIN] Invalid credentials provided');
      console.log('[LOGIN] Expected: admin/admin123');  
      console.log('[LOGIN] Received:', username + '/' + (password ? '[HIDDEN]' : 'undefined'));
      
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Auth/me endpoint
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'transport_company_secret_key');
    res.json({
      user: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('[ERROR]', error);
  res.status(500).json({ message: 'Internal server error' });
});

// Keep server alive
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Persistent server running on port ${PORT}`);
  console.log(`📍 Access at http://localhost:${PORT}`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`✅ CORS enabled for localhost:3000`);
  console.log(`📊 Ready to handle requests...`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
