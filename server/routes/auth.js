const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { auth } = require('../middleware/auth');

// Register routes
router.post('/register/company', authController.registerCompany);
router.post('/register/driver', authController.registerDriver);

// Login route
router.post('/login', authController.login);

// Get current user
router.get('/me', auth, authController.getCurrentUser);

// Update email
router.put('/update-email', auth, authController.updateEmail);

module.exports = router;
