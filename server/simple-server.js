const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }
  next();
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Hardcoded login for testing
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt received:', req.body);
    
    const { username, password } = req.body;
    
    // Simple hardcoded check for testing
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { id: 1, username: 'admin', role: 'admin' },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1d' }
      );
      
      console.log('Login successful - returning token');
      
      res.json({
        token: token,
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@transport.com',
          role: 'admin'
        }
      });
    } else {
      console.log('Login failed - invalid credentials');
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple test server running on port ${PORT}`);
  console.log(`Access at http://localhost:${PORT}`);
  console.log(`Test login at http://localhost:${PORT}/api/auth/login`);
});

// Keep the server alive
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  process.exit();
});
