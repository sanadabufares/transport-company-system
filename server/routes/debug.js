const express = require('express');
const router = express.Router();
const debugController = require('../controllers/debug');
const { pool } = require('../config/db');

// Route to add a log entry
router.post('/log', debugController.addLog);

// Route to get all logs
router.get('/logs', debugController.getLogs);

// Route to clear all logs
router.delete('/logs', debugController.clearLogs);

// Route to check health
router.get('/health', debugController.checkHealth);

// New debug endpoints
router.get('/trip-requests', debugController.getAllTripRequests);
router.get('/driver-requests/:driverId', debugController.getDriverTripRequests);
router.get('/drivers', debugController.getAllDrivers);
router.post('/create-test-request', debugController.createTestTripRequest);

// Get all trips with time
router.get('/trips-with-time', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, pickup_location, destination, trip_date, departure_time, status FROM trips ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get trips', error: error.message });
  }
});

// Get all drivers with availability
router.get('/drivers/availability', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, first_name, last_name, available_from, available_to FROM drivers');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get drivers', error: error.message });
  }
});

// Get all raw driver data
router.get('/drivers/raw', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM drivers');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get raw driver data', error: error.message });
  }
});

// Get drivers by vehicle type - extremely simple query
router.get('/drivers/by-vehicle/:vehicleType', async (req, res) => {
  try {
    const vehicleType = req.params.vehicleType;
    const [rows] = await pool.execute(
      'SELECT * FROM drivers WHERE vehicle_type >= ?',
      [vehicleType]
    );
    res.json({
      vehicleType,
      drivers: rows,
      query: 'SELECT * FROM drivers WHERE vehicle_type >= ?',
      params: [vehicleType]
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get drivers by vehicle type', error: error.message });
  }
});

// Get drivers by location - extremely simple query
router.get('/drivers/by-location/:location', async (req, res) => {
  try {
    const location = req.params.location;
    const [rows] = await pool.execute(
      'SELECT * FROM drivers WHERE LOWER(TRIM(current_location)) = LOWER(TRIM(?))',
      [location]
    );
    res.json({
      location,
      drivers: rows,
      query: 'SELECT * FROM drivers WHERE LOWER(TRIM(current_location)) = LOWER(TRIM(?))',
      params: [location]
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get drivers by location', error: error.message });
  }
});

// Get drivers by availability - extremely simple query
router.get('/drivers/by-availability/:datetime', async (req, res) => {
  try {
    const datetime = req.params.datetime;
    const [rows] = await pool.execute(
      'SELECT * FROM drivers WHERE ? BETWEEN available_from AND available_to',
      [datetime]
    );
    res.json({
      datetime,
      drivers: rows,
      query: 'SELECT * FROM drivers WHERE ? BETWEEN available_from AND available_to',
      params: [datetime]
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get drivers by availability', error: error.message });
  }
});

// Get drivers by all conditions - extremely simple query
router.get('/drivers/by-all/:vehicleType/:location/:datetime', async (req, res) => {
  try {
    const { vehicleType, location, datetime } = req.params;
    const [rows] = await pool.execute(
      `SELECT * FROM drivers 
       WHERE vehicle_type + 0 >= ? 
       AND LOWER(TRIM(current_location)) = LOWER(TRIM(?)) 
       AND ? BETWEEN available_from AND available_to`,
      [parseInt(vehicleType, 10), location, datetime]
    );
    res.json({
      vehicleType,
      location,
      datetime,
      drivers: rows,
      query: `SELECT * FROM drivers 
       WHERE vehicle_type + 0 >= ? 
       AND LOWER(TRIM(current_location)) = LOWER(TRIM(?)) 
       AND ? BETWEEN available_from AND available_to`,
      params: [parseInt(vehicleType, 10), location, datetime]
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get drivers by all conditions', error: error.message });
  }
});

// Test each condition for each driver
router.get('/drivers/test-all/:vehicleType/:location/:datetime', async (req, res) => {
  try {
    const { vehicleType, location, datetime } = req.params;
    const numVehicleType = parseInt(vehicleType, 10);
    
    // Get all drivers
    const [allDrivers] = await pool.execute('SELECT * FROM drivers');
    
    // Test each condition for each driver
    const results = await Promise.all(allDrivers.map(async (driver) => {
      // Test vehicle type
      const [vehicleRows] = await pool.execute(
        'SELECT ? + 0 >= ? + 0 as vehicle_ok',
        [driver.vehicle_type, numVehicleType]
      );
      
      // Test location
      const [locationRows] = await pool.execute(
        'SELECT LOWER(TRIM(?)) = LOWER(TRIM(?)) as location_ok',
        [driver.current_location, location]
      );
      
      // Test availability
      const [availabilityRows] = await pool.execute(
        'SELECT ? BETWEEN ? AND ? as availability_ok',
        [datetime, driver.available_from, driver.available_to]
      );
      
      return {
        driver_id: driver.id,
        name: `${driver.first_name} ${driver.last_name}`,
        vehicle_type: driver.vehicle_type,
        current_location: driver.current_location,
        available_from: driver.available_from,
        available_to: driver.available_to,
        vehicle_ok: vehicleRows[0].vehicle_ok === 1,
        location_ok: locationRows[0].location_ok === 1,
        availability_ok: availabilityRows[0].availability_ok === 1,
        all_ok: vehicleRows[0].vehicle_ok === 1 && locationRows[0].location_ok === 1 && availabilityRows[0].availability_ok === 1
      };
    }));
    
    res.json({
      vehicleType,
      location,
      datetime,
      results
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to test all conditions', error: error.message });
  }
});

// Check for conflicts and active requests
router.get('/drivers/check-conflicts/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Get trip details
    const [trips] = await pool.execute('SELECT * FROM trips WHERE id = ?', [tripId]);
    if (trips.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    const trip = trips[0];
    const tripDateTime = `${trip.trip_date} ${trip.departure_time}`;
    
    // Get all drivers
    const [allDrivers] = await pool.execute('SELECT * FROM drivers');
    
    // Check for conflicts and active requests for each driver
    const results = await Promise.all(allDrivers.map(async (driver) => {
      // Check for conflicts
      const [conflictRows] = await pool.execute(
        `SELECT COUNT(*) as conflict_count FROM trips t 
         WHERE t.driver_id = ? 
         AND t.status IN ('assigned', 'in_progress') 
         AND ABS(TIMESTAMPDIFF(MINUTE, TIMESTAMP(t.trip_date, t.departure_time), ?)) < 120`,
        [driver.id, tripDateTime]
      );
      
      // Check for active requests
      const [requestRows] = await pool.execute(
        `SELECT COUNT(*) as request_count FROM trip_requests tr 
         WHERE tr.trip_id = ? AND tr.driver_id = ? AND tr.status IN ('pending', 'accepted')`,
        [tripId, driver.id]
      );
      
      return {
        driver_id: driver.id,
        name: `${driver.first_name} ${driver.last_name}`,
        vehicle_type: driver.vehicle_type,
        current_location: driver.current_location,
        conflict_count: conflictRows[0].conflict_count,
        request_count: requestRows[0].request_count,
        conflict_ok: conflictRows[0].conflict_count === 0,
        request_ok: requestRows[0].request_count === 0
      };
    }));
    
    res.json({
      tripId,
      tripDateTime,
      results
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check conflicts', error: error.message });
  }
});

// Final debug route - execute the exact query from the main application
router.get('/drivers/final-check/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Get trip details
    const [trips] = await pool.execute('SELECT * FROM trips WHERE id = ?', [tripId]);
    if (trips.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    const trip = trips[0];
    const tripDateTime = `${trip.trip_date} ${trip.departure_time}`;
    
    // This is the exact query from getAvailableDriversForTrip in trip.js
    const query = `
      SELECT d.*, u.username, u.email
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN trip_requests tr ON tr.driver_id = d.id AND tr.trip_id = ? AND tr.status IN ('pending', 'accepted')
      LEFT JOIN trips conflicting_trip ON conflicting_trip.driver_id = d.id
        AND conflicting_trip.status IN ('assigned', 'in_progress')
        AND ABS(TIMESTAMPDIFF(MINUTE, TIMESTAMP(conflicting_trip.trip_date, conflicting_trip.departure_time), ?)) < 120
      WHERE u.is_approved = TRUE
        AND d.vehicle_type + 0 >= ?
        AND d.current_location IS NOT NULL
        AND LOWER(TRIM(d.current_location)) = LOWER(TRIM(?))
        AND ? BETWEEN d.available_from AND d.available_to
        AND tr.id IS NULL
        AND conflicting_trip.id IS NULL
      GROUP BY d.id
    `;
    
    const params = [tripId, tripDateTime, parseInt(trip.vehicle_type, 10), trip.pickup_location, tripDateTime];
    
    // Execute the query
    const [rows] = await pool.execute(query, params);
    
    res.json({
      tripId,
      tripDateTime,
      query,
      params,
      drivers: rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to execute final check', error: error.message });
  }
});

// New debug route - execute our new query directly
router.get('/drivers/new-check/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Get trip details
    const [trips] = await pool.execute('SELECT * FROM trips WHERE id = ?', [tripId]);
    if (trips.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    const trip = trips[0];
    const tripDateTime = `${trip.trip_date} ${trip.departure_time}`;
    
    // This is the new query with NOT EXISTS
    const query = `
      SELECT d.*, u.username, u.email
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE u.is_approved = TRUE
        AND d.vehicle_type + 0 >= ?
        AND d.current_location IS NOT NULL
        AND LOWER(TRIM(d.current_location)) = LOWER(TRIM(?))
        AND ? BETWEEN d.available_from AND d.available_to
        AND NOT EXISTS (
          SELECT 1 FROM trip_requests tr 
          WHERE tr.driver_id = d.id 
          AND tr.trip_id = ? 
          AND tr.status IN ('pending', 'accepted')
        )
        AND NOT EXISTS (
          SELECT 1 FROM trips t 
          WHERE t.driver_id = d.id 
          AND t.status IN ('assigned', 'in_progress') 
          AND ABS(TIMESTAMPDIFF(MINUTE, TIMESTAMP(t.trip_date, t.departure_time), ?)) < 120
        )
    `;
    
    const params = [parseInt(trip.vehicle_type, 10), trip.pickup_location, tripDateTime, tripId, tripDateTime];
    
    // Execute the query
    const [rows] = await pool.execute(query, params);
    
    res.json({
      tripId,
      tripDateTime,
      query,
      params,
      drivers: rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to execute new check', error: error.message });
  }
});

// Simplest possible query - just check vehicle type and location
router.get('/drivers/simplest-check/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Get trip details
    const [trips] = await pool.execute('SELECT * FROM trips WHERE id = ?', [tripId]);
    if (trips.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    const trip = trips[0];
    
    // This is the simplest possible query
    const query = `
      SELECT d.*, u.username, u.email
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE u.is_approved = TRUE
        AND d.vehicle_type + 0 >= ?
        AND d.current_location IS NOT NULL
        AND LOWER(TRIM(d.current_location)) = LOWER(TRIM(?))
    `;
    
    const params = [parseInt(trip.vehicle_type, 10), trip.pickup_location];
    
    // Execute the query
    const [rows] = await pool.execute(query, params);
    
    res.json({
      tripId,
      query,
      params,
      drivers: rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to execute simplest check', error: error.message });
  }
});

// Even simpler query - just check if there are any approved drivers at all
router.get('/drivers/approved', async (req, res) => {
  try {
    // This is the simplest possible query
    const query = `
      SELECT d.*, u.username, u.email
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE u.is_approved = TRUE
    `;
    
    // Execute the query
    const [rows] = await pool.execute(query);
    
    res.json({
      query,
      drivers: rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check approved drivers', error: error.message });
  }
});

// Check each condition individually for each driver, but without using SQL
router.get('/drivers/manual-check/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Get trip details
    const [trips] = await pool.execute('SELECT * FROM trips WHERE id = ?', [tripId]);
    if (trips.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    const trip = trips[0];
    const tripDateTime = `${trip.trip_date} ${trip.departure_time}`;
    
    // Get all drivers
    const [allDrivers] = await pool.execute(
      `SELECT d.*, u.username, u.email, u.is_approved
       FROM drivers d
       JOIN users u ON d.user_id = u.id`
    );
    
    // Check each condition individually for each driver
    const results = allDrivers.map(driver => {
      // Check if driver is approved
      const isApproved = driver.is_approved === 1;
      
      // Check vehicle type
      const vehicleTypeOk = parseInt(driver.vehicle_type) >= parseInt(trip.vehicle_type);
      
      // Check location
      const locationOk = driver.current_location && 
        driver.current_location.trim().toLowerCase() === trip.pickup_location.trim().toLowerCase();
      
      // Check availability
      const availabilityOk = driver.available_from && driver.available_to && 
        tripDateTime >= driver.available_from && tripDateTime <= driver.available_to;
      
      return {
        driver_id: driver.id,
        name: `${driver.first_name} ${driver.last_name}`,
        vehicle_type: driver.vehicle_type,
        current_location: driver.current_location,
        available_from: driver.available_from,
        available_to: driver.available_to,
        is_approved: isApproved,
        vehicle_type_ok: vehicleTypeOk,
        location_ok: locationOk,
        availability_ok: availabilityOk,
        all_ok: isApproved && vehicleTypeOk && locationOk && availabilityOk
      };
    });
    
    res.json({
      tripId,
      tripDateTime,
      results
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to execute manual check', error: error.message });
  }
});

// Debug route to show the exact response from the available-drivers API endpoint
router.get('/api-response/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Get the company controller
    const companyController = require('../controllers/company');
    
    // Create a mock request and response
    const mockReq = {
      params: { tripId },
      user: { id: 3 } // Assuming user ID 3 is a company user
    };
    
    let responseData = null;
    const mockRes = {
      json: (data) => {
        responseData = data;
      },
      status: (code) => ({
        json: (data) => {
          responseData = { statusCode: code, ...data };
        }
      })
    };
    
    // Call the controller function directly
    await companyController.getAvailableDrivers(mockReq, mockRes);
    
    // Return the response data
    res.json({
      tripId,
      apiResponse: responseData
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get API response', error: error.message });
  }
});

module.exports = router;
