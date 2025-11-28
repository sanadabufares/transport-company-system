const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Company = require('../models/company');
const Driver = require('../models/driver');
const Notification = require('../models/notification');

// Register a new company
exports.registerCompany = async (req, res) => {
  try {
    const { username, email, password, company_name, contact_person, phone, address, description } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findByEmail(email) || await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Create user
    const user = {
      username,
      email,
      password,
      role: 'company'
    };

    const userId = await User.create(user);

    // Create company profile
    const company = {
      user_id: userId,
      company_name,
      contact_person,
      phone,
      address,
      description
    };

    await Company.create(company);

    // Create notification for admin
    const notification = {
      user_id: 1, // Admin ID is 1
      title: 'New Company Registration',
      message: `A new company "${company_name}" has registered and is awaiting approval.`
    };
    
    await Notification.create(notification);

    res.status(201).json({ message: 'Company registered successfully. Please wait for admin approval.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Register a new driver
exports.registerDriver = async (req, res) => {
  try {
    const { 
      username, email, password, first_name, last_name, phone, address,
      license_number, license_expiry, vehicle_type, vehicle_plate 
    } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findByEmail(email) || await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Create user
    const user = {
      username,
      email,
      password,
      role: 'driver'
    };

    const userId = await User.create(user);

    // Create driver profile
    const driver = {
      user_id: userId,
      first_name,
      last_name,
      phone,
      address,
      license_number,
      license_expiry,
      vehicle_type,
      vehicle_plate
    };

    await Driver.create(driver);

    // Create notification for admin
    const notification = {
      user_id: 1, // Admin ID is 1
      title: 'New Driver Registration',
      message: `A new driver "${first_name} ${last_name}" has registered and is awaiting approval.`
    };
    
    await Notification.create(notification);

    res.status(201).json({ message: 'Driver registered successfully. Please wait for admin approval.' });
  } catch (error) {
    console.error('Driver registration error:', error.message);
    console.error(error.stack);
    res.status(500).json({ message: 'Server error during driver registration', error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('[Auth] Login attempt with username:', username);

    // Find user by username
    const user = await User.findByUsername(username);
    if (!user) {
      console.log('[Auth] Login failed: User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    console.log('[Auth] User found:', { id: user.id, username: user.username, role: user.role, password_hash: user.password });

    // Check if user is approved (except for admin)
    if (user.role !== 'admin' && !user.is_approved) {
      // console.log('[Auth] Login failed: Account pending approval');
      return res.status(403).json({ message: 'Your account is pending approval' });
    }

    // Check password
    console.log('[Auth] Comparing password...');
    const isMatch = await User.comparePassword(password, user.password);
    console.log('[Auth] Password match result:', isMatch);
    if (!isMatch) {
      console.log('[Auth] Login failed: Password mismatch');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    console.log('[Auth] Password matched successfully');

    // Fetch profile based on role
    let profile = null;
    if (user.role === 'company') {
      profile = await Company.findByUserId(user.id);
    } else if (user.role === 'driver') {
      profile = await Driver.findByUserId(user.id);
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      profile
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    // console.log('[Auth] Getting current user with ID:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      // console.log('[Auth] User not found with ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // console.log('[Auth] User found:', { id: user.id, username: user.username, role: user.role });

    let profileData = null;
    
    // Get profile data based on role
    if (user.role === 'company') {
      // console.log('[Auth] Getting company profile for user ID:', user.id);
      profileData = await Company.findByUserId(user.id);
      
      if (!profileData) {
        // console.log('[Auth] Company profile not found for user ID:', user.id);
      }
    } else if (user.role === 'driver') {
      // console.log('[Auth] Getting driver profile for user ID:', user.id);
      profileData = await Driver.findByUserId(user.id);
      
      if (!profileData) {
        // console.log('[Auth] Driver profile not found for user ID:', user.id);
      }
    }
    
    // console.log('[Auth] Sending profile response, profile found:', !!profileData);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_approved: user.is_approved,
        created_at: user.created_at
      },
      profile: profileData
    });
  } catch (error) {
    console.error('[Auth] Error in getCurrentUser:', error.message);
    console.error(error.stack);
    res.status(500).json({ message: 'Failed to load profile information. Please try again later.' });
  }
};

// Update user email
exports.updateEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userId = req.user.id;

    // 1. Get user from DB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Check if password is correct
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // 3. Check if new email is already in use
    if (email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
    }

    // 4. Update email
    await User.updateEmail(userId, email);

    res.json({ message: 'Email updated successfully' });

  } catch (error) {
    console.error('[Auth] Error in updateEmail:', error.message);
    res.status(500).json({ message: 'Server error while updating email' });
  }
};
