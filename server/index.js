const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
require('dotenv').config();
// nodemon: reload ping

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const companyRoutes = require('./routes/company');
const driverRoutes = require('./routes/driver');
const tripRoutes = require('./routes/trip');
const reportRoutes = require('./routes/report');
const debugRoutes = require('./routes/debug');

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
// Configure CORS more explicitly
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
  'http://localhost:3003',
  'http://127.0.0.1:3003'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow all localhost origins during development
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // For login requests, log more details
  if (req.url === '/api/auth/login' && req.method === 'POST') {
    console.log('Login attempt with username:', req.body.username);
  }
  
  next();
});

// Test endpoint for database connectivity
app.get('/api/test', async (req, res) => {
  try {
    const [result] = await db.execute('SELECT COUNT(*) as user_count FROM users');
    res.json({ 
      message: 'Transport Company API is working!',
      database: 'Connected to XAMPP MySQL',
      userCount: result[0].user_count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Database connection failed', 
      error: error.message 
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/debug', debugRoutes);

// DEBUG: list registered routes per router
app.get('/api/__routes', (req, res) => {
  const toList = (stack, base = '') => {
    try {
      return stack
        .filter(l => l.route)
        .map(l => ({
          path: base + l.route.path,
          methods: Object.keys(l.route.methods || {})
        }));
    } catch (e) {
      return [{ error: e.message }];
    }
  };

  res.json({
    auth: toList(authRoutes.stack, '/api/auth'),
    admin: toList(adminRoutes.stack, '/api/admin'),
    company: toList(companyRoutes.stack, '/api/company'),
    driver: toList(driverRoutes.stack, '/api/driver'),
    trip: toList(tripRoutes.stack, '/api/trip'),
    report: toList(reportRoutes.stack, '/api/report')
  });
});


// Add debug routes
app.get('/api/debug/routes', (req, res) => {
  const routers = {
    '/api/auth': authRoutes,
    '/api/admin': adminRoutes,
    '/api/company': companyRoutes,
    '/api/driver': driverRoutes,
    '/api/trip': tripRoutes,
    '/api/report': reportRoutes
  };
  
  const allRoutes = [];
  
  for (const [prefix, router] of Object.entries(routers)) {
    if (!router.stack) {
      allRoutes.push({ path: prefix, status: 'Router has no stack' });
      continue;
    }
    
    router.stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods)
          .map(m => m.toUpperCase())
          .join(', ');
        allRoutes.push({
          path: prefix + layer.route.path,
          methods: methods,
          middleware: layer.route.stack.length
        });
      }
    });
  }
  
  res.json({
    allRoutes,
    totalCount: allRoutes.length
  });
});

app.get('/api/debug/auth-test', (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let decoded;
    let valid = false;
    
    try {
      if (token) {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        valid = true;
      }
    } catch (e) {
      // Token verification failed
    }
    
    res.json({
      tokenProvided: !!token,
      tokenDecoded: decoded || null,
      tokenValid: valid,
      headers: req.headers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add test notification endpoint without auth
app.get('/api/debug/notifications/test-count', (req, res) => {
  res.json({ count: 5 }); // Always return 5 for testing
});

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Transport Company API' });
});

// Start server with database connection test
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Transport Company Server running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🔐 API Base: http://localhost:${PORT}/api`);
  
  // Test database connection on startup
  try {
    const [result] = await db.execute('SELECT 1 as test');
    console.log('✅ XAMPP MySQL database connected successfully');
    
    const [adminCheck] = await db.execute('SELECT * FROM users WHERE username = ?', ['admin']);
    if (adminCheck.length > 0) {
      console.log('✅ Admin user ready - Username: admin, Password: admin123');
    } else {
      console.log('⚠️  Admin user not found - run "node xampp-mysql-setup.js" first');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Make sure XAMPP MySQL is running on port 3306');
  }
});
