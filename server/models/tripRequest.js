const { pool } = require('../config/db');

const TripRequest = {
  // Create a new trip request
  create: async (request) => {
    const [result] = await pool.execute(
      'INSERT INTO trip_requests (trip_id, driver_id, request_type, status) VALUES (?, ?, ?, ?)',
      [request.trip_id, request.driver_id, request.request_type, request.status || 'pending']
    );
    return result.insertId;
  },

  // Find request by id
  findById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT tr.*, t.company_id, 
       t.pickup_location, t.destination, t.trip_date, t.departure_time,
       t.passenger_count, t.vehicle_type, t.company_price, t.driver_price, t.status as trip_status, t.visa_number,
       c.company_name,
       CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
       d.phone as driver_phone, d.vehicle_plate
       FROM trip_requests tr
       JOIN trips t ON tr.trip_id = t.id
       JOIN companies c ON t.company_id = c.id
       JOIN drivers d ON tr.driver_id = d.id
       WHERE tr.id = ?`,
      [id]
    );
    return rows[0];
  },

  // Find drivers who have requested or been requested for a trip
  getRequestersForTrip: async (tripId) => {
    // console.log(`Getting all driver requesters for trip ID: ${tripId}`);
    const [rows] = await pool.execute(
      `SELECT d.*, 
              tr.request_type, tr.status as request_status, tr.id as request_id,
              (SELECT AVG(r.rating) FROM ratings r WHERE r.rated_id = d.id AND r.rated_type = 'driver') as rating
       FROM trip_requests tr
       JOIN drivers d ON tr.driver_id = d.id
       WHERE tr.trip_id = ? AND tr.status = 'pending'`,
      [tripId]
    );
    // console.log(`Found ${rows.length} driver requesters for trip ${tripId}`);
    return rows;
  },

  // Find request by trip and driver
  findByTripAndDriver: async (tripId, driverId) => {
    const [rows] = await pool.execute(
      'SELECT * FROM trip_requests WHERE trip_id = ? AND driver_id = ?',
      [tripId, driverId]
    );
    return rows[0];
  },

  // Get requests for a company (both sent to company and sent by company)
  getByCompanyId: async (companyId, type = null) => {
    // console.log(`Getting trip requests for company ID: ${companyId}, type: ${type || 'all'}`);
    let query = `SELECT tr.*, t.pickup_location, t.destination, t.trip_date, 
       t.departure_time, t.passenger_count, t.vehicle_type, t.company_price, t.driver_price, t.visa_number,
       CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
       d.vehicle_type as driver_vehicle_type, d.rating as driver_rating,
       d.phone as driver_phone, d.license_number as driver_license
       FROM trip_requests tr
       JOIN trips t ON tr.trip_id = t.id
       JOIN drivers d ON tr.driver_id = d.id
       WHERE t.company_id = ? AND tr.status = 'pending'`;
    
    const params = [companyId];
    
    if (type) {
      query += ` AND tr.request_type = ?`;
      params.push(type);
    }
    
    query += ` ORDER BY tr.created_at DESC`;
    
    const [rows] = await pool.execute(query, params);
    // console.log(`Found ${rows.length} trip requests for company ${companyId}`);
    return rows;
  },

  // Get all requests involving a driver (both sent by driver and sent to driver)
  getByDriverId: async (driverId) => {
    // console.log(`Getting all trip requests for driver ID: ${driverId}`);
    
    // STEP 1: Check if the driver ID exists
    const [driverCheck] = await pool.execute(
      `SELECT id FROM drivers WHERE id = ?`,
      [driverId]
    );
    
    if (driverCheck.length === 0) {
      // console.log(`WARNING: Driver with ID ${driverId} not found in database`);
      return [];
    }
    
    // STEP 2: Debug check - Get statistics of all trip requests in the system
    const [allRequests] = await pool.execute(
      `SELECT COUNT(*) as count, request_type, status FROM trip_requests GROUP BY request_type, status`
    );
    // console.log(`DEBUG - All trip requests in system by type and status:`, allRequests);
    
    // STEP 3: Debug check - Get raw count of company_to_driver requests for this driver directly from the table
    const [directRequests] = await pool.execute(
      `SELECT COUNT(*) as count FROM trip_requests WHERE driver_id = ?`,
      [driverId]
    );
    // console.log(`DEBUG - Direct count of all requests for driver ${driverId}: ${directRequests[0].count}`);
    
    // STEP 4: Debug check - Get details of all company_to_driver requests for this specific driver
    const [companyRequests] = await pool.execute(
      `SELECT id, request_type, status, trip_id, created_at FROM trip_requests 
       WHERE driver_id = ? AND request_type = 'company_to_driver'`,
      [driverId]
    );
    // console.log(`DEBUG - company_to_driver requests for driver ${driverId}:`, companyRequests);
    
    // STEP 5: Debug check - Get details of driver_to_company requests
    const [driverRequests] = await pool.execute(
      `SELECT id, request_type, status, trip_id, created_at FROM trip_requests 
       WHERE driver_id = ? AND request_type = 'driver_to_company'`,
      [driverId]
    );
    // console.log(`DEBUG - driver_to_company requests for driver ${driverId}:`, driverRequests);
    
    // STEP 6: Modified main query with LEFT JOINs to ensure we get all trip requests regardless of join issues
    const [rows] = await pool.execute(
      `SELECT tr.*, 
       t.pickup_location, t.destination, t.trip_date, t.departure_time, 
       t.passenger_count, t.vehicle_type, t.company_price, t.driver_price, 
       t.visa_number, t.status AS trip_status, t.company_id,
       c.company_name, c.rating as company_rating
       FROM trip_requests tr
       LEFT JOIN trips t ON tr.trip_id = t.id
       LEFT JOIN companies c ON t.company_id = c.id
       WHERE tr.driver_id = ?
       ORDER BY tr.created_at DESC`,
      [driverId]
    );
    
    // STEP 7: Debug - log each request to see what we have
    if (rows.length === 0) {
      // console.log(`WARNING: No trip requests found for driver ${driverId} after joins`); 
    } else {
      rows.forEach(row => {
        // console.log(`Request ID: ${row.id}, Type: ${row.request_type}, Status: ${row.status}, Trip ID: ${row.trip_id}, Created: ${row.created_at}`);
      });
    }
    
    // console.log(`Found ${rows.length} trip requests for driver ${driverId}`);
    return rows;
  },

  // Update request status
  updateStatus: async (id, status) => {
    const [result] = await pool.execute(
      'UPDATE trip_requests SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  },

  // Count pending requests for a user by role
  countPendingByRole: async (userId, role) => {
    let query = '';
    let params = [userId];
    
    if (role === 'company') {
      const [company] = await pool.execute('SELECT id FROM companies WHERE user_id = ?', [userId]);
      if (company.length === 0) return 0;
      
      query = `SELECT COUNT(*) as count
               FROM trip_requests tr
               JOIN trips t ON tr.trip_id = t.id
               WHERE t.company_id = ? AND tr.status = 'pending'`;
      params = [company[0].id];
    } else if (role === 'driver') {
      const [driver] = await pool.execute('SELECT id FROM drivers WHERE user_id = ?', [userId]);
      if (driver.length === 0) return 0;
      
      query = `SELECT COUNT(*) as count
               FROM trip_requests
               WHERE driver_id = ? AND status = 'accepted'`; // Or any other relevant status
      params = [driver[0].id];
    } else {
      return 0;
    }
    
    const [rows] = await pool.execute(query, params);
    return rows[0].count;
  },
  
  // Count pending requests for a driver
  countPendingByDriverId: async (driverId) => {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM trip_requests
       WHERE driver_id = ? AND status = 'pending'`,
      [driverId]
    );
    return rows[0].count;
  },
  
  // Get company requests sent to a driver
  getCompanyRequestsForDriver: async (driverId) => {
    // console.log(`Getting company-initiated requests for driver ID: ${driverId}`);
    const [rows] = await pool.execute(
      `SELECT tr.*, t.pickup_location, t.destination, t.trip_date, 
       t.departure_time, t.passenger_count, t.vehicle_type, t.company_price, t.driver_price as price, t.visa_number,
       c.company_name, c.contact_person, c.phone, c.rating
       FROM trip_requests tr
       LEFT JOIN trips t ON tr.trip_id = t.id
       LEFT JOIN companies c ON t.company_id = c.id
       WHERE tr.driver_id = ? AND tr.request_type = 'company_to_driver'
       ORDER BY tr.created_at DESC`,
      [driverId]
    );
    // console.log(`Found ${rows.length} company requests for driver ${driverId}`);
    
    // Debug each request
    rows.forEach(row => {
      // console.log(`Company Request ID: ${row.id}, Status: ${row.status}, Trip ID: ${row.trip_id}, Created: ${row.created_at}`);
    });
    
    return rows;
  },

  // Delete a trip request
  delete: async (id) => {
    const [result] = await pool.execute(
      'DELETE FROM trip_requests WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = TripRequest;