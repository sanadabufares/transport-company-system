const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const companyRoutes = require('./routes/company');
const driverRoutes = require('./routes/driver');
const tripRoutes = require('./routes/trip');
const reportRoutes = require('./routes/report');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Configure CORS to allow requests from anywhere
app.use(cors({
  origin: '*', // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));
console.log('Serving static files from public directory');


// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.url === '/api/auth/login' && req.method === 'POST') {
    console.log('Login attempt with username:', req.body.username);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/report', reportRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API Server is working properly!' });
});

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Transport Company API' });
});

// Start server with explicit host binding
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
  console.log(`Server accessible at http://127.0.0.1:${PORT}`);
  console.log('CORS is configured to allow all origins');
});
