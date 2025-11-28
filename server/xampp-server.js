const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection pool for XAMPP MySQL
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'transport_company',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.url === '/api/auth/login') {
    console.log('[LOGIN] Login attempt for username:', req.body.username);
  }
  next();
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'XAMPP MySQL Server is working!',
    database: 'Connected to XAMPP MySQL',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('[AUTH] Login attempt with username:', username);

    // Find user by username
    const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) {
      console.log('[AUTH] User not found:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    console.log('[AUTH] User found:', { id: user.id, username: user.username, role: user.role });

    // Check if user is approved (except for admin)
    if (user.role !== 'admin' && !user.is_approved) {
      console.log('[AUTH] Account pending approval');
      return res.status(403).json({ message: 'Your account is pending approval' });
    }

    // Check password
    console.log('[AUTH] Verifying password...');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('[AUTH] Password mismatch');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('[AUTH] Password verified successfully');

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('[AUTH] Login successful - token generated');

    res.json({
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('[AUTH] Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user endpoint
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_approved: user.is_approved,
        created_at: user.created_at
      },
      profile: null
    });

  } catch (error) {
    console.error('[AUTH] Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Database connection test
app.get('/api/db-test', async (req, res) => {
  try {
    const [result] = await db.execute('SELECT COUNT(*) as user_count FROM users');
    const [adminCheck] = await db.execute('SELECT * FROM users WHERE username = ?', ['admin']);
    
    res.json({
      message: 'Database connection successful',
      userCount: result[0].user_count,
      adminExists: adminCheck.length > 0,
      adminDetails: adminCheck.length > 0 ? {
        username: adminCheck[0].username,
        role: adminCheck[0].role,
        approved: adminCheck[0].is_approved
      } : null
    });
  } catch (error) {
    console.error('[DB] Database test error:', error);
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 XAMPP MySQL Server running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
  
  // Test database connection on startup
  try {
    const [result] = await db.execute('SELECT 1 as test');
    console.log('✅ XAMPP MySQL database connected successfully');
    
    const [adminCheck] = await db.execute('SELECT * FROM users WHERE username = ?', ['admin']);
    if (adminCheck.length > 0) {
      console.log('✅ Admin user ready - Username: admin, Password: admin123');
    } else {
      console.log('❌ Admin user not found - run xampp-mysql-setup.js first');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(async () => {
    await db.end();
    console.log('✅ Server and database connections closed');
    process.exit(0);
  });
});
