const DebugLog = require('../models/debugLog');
const pool = require('../config/db');
const TripRequest = require('../models/tripRequest');

exports.addLog = (req, res) => {
  const { level, message, data } = req.body;
  DebugLog.add({ level, message, data });
  res.status(200).send({ status: 'logged' });
};

exports.getLogs = (req, res) => {
  const logs = DebugLog.getAll();
  res.json(logs);
};

exports.clearLogs = (req, res) => {
  DebugLog.clear();
  res.status(200).send({ status: 'cleared' });
};

exports.checkHealth = async (req, res) => {
  try {
    // Check database connection
    const [result] = await pool.execute('SELECT 1');
    if (result) {
      res.json({ status: 'ok', message: 'Database connection is healthy' });
    } else {
      res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Debug endpoint to check all trip requests
exports.getAllTripRequests = async (req, res) => {
  try {
    // Get all trip requests from the database
    const [allRequests] = await pool.execute(
      `SELECT tr.*, 
      d.first_name, d.last_name, d.phone as driver_phone,
      t.pickup_location, t.destination, t.trip_date, t.departure_time, 
      t.passenger_count, t.vehicle_type, t.company_price, t.driver_price, 
      t.status as trip_status,
      c.company_name
      FROM trip_requests tr
      LEFT JOIN trips t ON tr.trip_id = t.id
      LEFT JOIN companies c ON t.company_id = c.id
      LEFT JOIN drivers d ON tr.driver_id = d.id
      ORDER BY tr.created_at DESC`
    );
    
    // Get statistics
    const [requestStats] = await pool.execute(
      `SELECT request_type, status, COUNT(*) as count 
       FROM trip_requests 
       GROUP BY request_type, status`
    );

    res.json({
      total: allRequests.length,
      statistics: requestStats,
      requests: allRequests
    });
  } catch (error) {
    console.error('Error getting all trip requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Debug endpoint to check specific driver's trip requests
exports.getDriverTripRequests = async (req, res) => {
  try {
    const { driverId } = req.params;
    
    if (!driverId) {
      return res.status(400).json({ message: 'Driver ID is required' });
    }
    
    // Get all trip requests for this driver
    const requests = await TripRequest.getByDriverId(driverId);
    
    res.json({
      driverId,
      total: requests.length,
      requests
    });
  } catch (error) {
    console.error('Error getting driver trip requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Debug endpoint to get all drivers
exports.getAllDrivers = async (req, res) => {
  try {
    const [drivers] = await pool.execute(
      `SELECT d.id, d.first_name, d.last_name, d.user_id, u.username 
       FROM drivers d 
       JOIN users u ON d.user_id = u.id`
    );
    
    res.json({
      total: drivers.length,
      drivers
    });
  } catch (error) {
    console.error('Error getting all drivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Debug endpoint to create test trip request
exports.createTestTripRequest = async (req, res) => {
  try {
    const { driverId, companyId, tripId, requestType, status } = req.body;
    
    // Validate required parameters
    if (!driverId || !tripId) {
      return res.status(400).json({ message: 'Driver ID and Trip ID are required' });
    }
    
    // First check if the driver exists
    const [driverExists] = await pool.execute(
      'SELECT id FROM drivers WHERE id = ?',
      [driverId]
    );
    
    if (driverExists.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Check if the trip exists
    const [tripExists] = await pool.execute(
      'SELECT id, company_id FROM trips WHERE id = ?',
      [tripId]
    );
    
    if (tripExists.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    // Check if there's an existing request
    const [existingRequest] = await pool.execute(
      'SELECT id FROM trip_requests WHERE trip_id = ? AND driver_id = ?',
      [tripId, driverId]
    );
    
    if (existingRequest.length > 0) {
      return res.status(400).json({ 
        message: 'Trip request already exists',
        requestId: existingRequest[0].id
      });
    }
    
    // Create the new trip request
    const newRequest = { 
      trip_id: tripId, 
      driver_id: driverId, 
      request_type: requestType || 'company_to_driver', 
      status: status || 'pending' 
    };
    
    const requestId = await TripRequest.create(newRequest);
    
    res.status(201).json({
      message: 'Test trip request created successfully',
      requestId,
      requestData: newRequest
    });
  } catch (error) {
    console.error('Error creating test trip request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
