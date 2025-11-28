const { pool } = require('../config/db');

const Trip = {
  // Create a new trip
  create: async (trip) => {
    const [result] = await pool.execute(
      'INSERT INTO trips (company_id, pickup_location, destination, trip_date, departure_time, passenger_count, vehicle_type, company_price, driver_price, visa_number, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [trip.company_id, trip.pickup_location, trip.destination, trip.trip_date, trip.departure_time, trip.passenger_count, trip.vehicle_type, trip.company_price, trip.driver_price, trip.visa_number, trip.status]
    );
    return result.insertId;
  },

  // Find trip by id
  findById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT t.*, c.company_name, 
       CONCAT(d.first_name, ' ', d.last_name) AS driver_name 
       FROM trips t 
       LEFT JOIN companies c ON t.company_id = c.id 
       LEFT JOIN drivers d ON t.driver_id = d.id 
       WHERE t.id = ?`,
      [id]
    );
    return rows[0];
  },

  // Get all trips for a company
  getByCompanyId: async (companyId, status) => {
    let query = `SELECT 
        t.id, t.company_id, t.driver_id, t.pickup_location, t.destination, 
        t.trip_date, t.departure_time, t.passenger_count, t.vehicle_type, 
        t.company_price, t.driver_price, t.visa_number, t.status, 
        CAST(t.created_at AS CHAR) as created_at, 
        CONCAT(d.first_name, ' ', d.last_name) AS driver_name 
       FROM trips t 
       LEFT JOIN drivers d ON t.driver_id = d.id 
       WHERE t.company_id = ?`;
    const params = [companyId];

    if (status) {
      if (status === 'active') {
        query += ` AND t.status IN ('pending', 'assigned', 'in_progress')`;
      } else {
        query += ' AND t.status = ?';
        params.push(status);
      }
    }

    query += ' ORDER BY t.created_at DESC';

    try {
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error in Trip.getByCompanyId:', error);
      throw error;
    }
  },

  // Get all trips for a driver
  getByDriverId: async (driverId) => {
    const [rows] = await pool.execute(
      `SELECT t.*, c.company_name, c.contact_person, c.phone as contact_phone, 
       t.driver_price as price
       FROM trips t 
       JOIN companies c ON t.company_id = c.id 
       WHERE t.driver_id = ? 
       ORDER BY t.created_at DESC`,
      [driverId]
    );
    return rows;
  },

  // Get available trips for a driver based on location and availability
  getAvailableTripsForDriver: async (driverId, location, availableFrom, availableTo) => {
    // Add debug log for troubleshooting
    console.log(`Finding available trips for driver: ${driverId}`);
    console.log(`Location: ${location}, Available from: ${availableFrom}, Available to: ${availableTo}`);
    
    // More flexible location matching by breaking down the location strings
    // and comparing key parts rather than requiring an exact substring match
    const [rows] = await pool.execute(
      `SELECT t.*, c.company_name, c.contact_person, c.phone, c.rating, t.driver_price as price,
       (SELECT COUNT(*) FROM trip_requests tr 
        WHERE tr.trip_id = t.id AND tr.driver_id = ? AND tr.status IN ('pending', 'accepted')) as has_active_request,
       (SELECT tr.status FROM trip_requests tr 
        WHERE tr.trip_id = t.id AND tr.driver_id = ? 
        ORDER BY tr.created_at DESC LIMIT 1) as last_request_status
       FROM trips t 
       JOIN companies c ON t.company_id = c.id 
       WHERE t.status = 'pending' 
       AND t.driver_id IS NULL
       AND TIMESTAMP(t.trip_date, t.departure_time) >= ? 
       AND TIMESTAMP(t.trip_date, t.departure_time) <= ?
       AND (
         /* More flexible location matching */
         t.pickup_location LIKE CONCAT('%', ?, '%') OR
         /* Check if location words appear in pickup_location */
         (REPLACE(LOWER(t.pickup_location), ',', ' ') LIKE CONCAT('%', REPLACE(LOWER(?), ',', ' '), '%'))
       )
       HAVING has_active_request = 0 OR (has_active_request = 0 AND last_request_status = 'rejected')
       ORDER BY t.created_at DESC`,
      [driverId, driverId, availableFrom, availableTo, location, location]
    );
    
    // Add debug log for result count
    console.log(`Found ${rows.length} available trips for driver ${driverId}, including previously rejected ones`);
    return rows;
  },

  // Get all available drivers for a trip (direct assignment)
  getAvailableDriversForTrip: async (tripId) => {
    console.log(`[DEBUG] getAvailableDriversForTrip called for trip ID: ${tripId}`);
    
    // Get the trip details
    const [trips] = await pool.execute('SELECT * FROM trips WHERE id = ?', [tripId]);
    if (trips.length === 0) return [];
    const trip = trips[0];
    
    // Format the trip date and time
    const tripDateTime = `${trip.trip_date} ${trip.departure_time}`;
    console.log(`[DEBUG] Trip details: ${trip.pickup_location} to ${trip.destination} at ${tripDateTime}`);
    
    // Get all drivers
    const [allDrivers] = await pool.execute(
      `SELECT d.*, u.username, u.email
       FROM drivers d
       JOIN users u ON d.user_id = u.id
       WHERE u.is_approved = TRUE`
    );
    
    console.log(`[DEBUG] Found ${allDrivers.length} total drivers`);
    
    // Filter drivers manually to ensure complete control over the logic
    const availableDrivers = [];
    
    for (const driver of allDrivers) {
      // Check vehicle type (numeric comparison)
      const vehicleTypeOk = parseInt(driver.vehicle_type) >= parseInt(trip.vehicle_type);
      
      // Check location (case-insensitive, trimmed)
      const locationOk = driver.current_location && 
        driver.current_location.trim().toLowerCase() === trip.pickup_location.trim().toLowerCase();
      
      // Check availability window
      const availabilityOk = driver.available_from && driver.available_to && 
        tripDateTime >= driver.available_from && tripDateTime <= driver.available_to;
      
      // Check for conflicts
      const [conflictRows] = await pool.execute(
        `SELECT COUNT(*) as conflict_count FROM trips t 
         WHERE t.driver_id = ? 
         AND t.status IN ('assigned', 'in_progress') 
         AND ABS(TIMESTAMPDIFF(MINUTE, TIMESTAMP(t.trip_date, t.departure_time), ?)) < 120`,
        [driver.id, tripDateTime]
      );
      const conflictOk = conflictRows[0].conflict_count === 0;
      
      // Check for active requests
      const [requestRows] = await pool.execute(
        `SELECT COUNT(*) as request_count FROM trip_requests tr 
         WHERE tr.trip_id = ? AND tr.driver_id = ? AND tr.status IN ('pending', 'accepted')`,
        [tripId, driver.id]
      );
      const requestOk = requestRows[0].request_count === 0;
      
      // Log the results for debugging
      console.log(`[DEBUG] Driver ${driver.id} (${driver.first_name} ${driver.last_name}):`, {
        vehicleTypeOk,
        locationOk,
        availabilityOk,
        conflictOk,
        requestOk
      });
      
      // If all conditions pass, add the driver to the available list
      if (vehicleTypeOk && locationOk && availabilityOk && conflictOk && requestOk) {
        availableDrivers.push(driver);
      }
    }
    
    console.log(`[DEBUG] Found ${availableDrivers.length} available drivers for direct assignment.`);
    return availableDrivers;
  },

  // Get only drivers who requested this specific trip (for edit trip assignment)
  getRequestingDriversForTrip: async (tripId) => {
    console.log(`[DEBUG] getRequestingDriversForTrip called for trip ID: ${tripId}`);
    
    const [trip] = await pool.execute('SELECT * FROM trips WHERE id = ?', [tripId]);
    if (trip.length === 0) return [];

    const currentTrip = trip[0];
    const tripDateTime = `${currentTrip.trip_date} ${currentTrip.departure_time}`;
    
    console.log(`[DEBUG] Trip info - Date: ${currentTrip.trip_date}, Time: ${currentTrip.departure_time}, Vehicle: ${currentTrip.vehicle_type}`);

    const [rows] = await pool.execute(
      `SELECT d.*, u.username, u.email,
       tr.status as request_status,
       tr.created_at as request_date,
       tr.id as request_id,
       (SELECT COUNT(*) FROM trips t 
        WHERE t.driver_id = d.id 
        AND t.status IN ('assigned', 'in_progress') 
        AND TIMESTAMP(t.trip_date, t.departure_time) 
        BETWEEN ? AND DATE_ADD(?, INTERVAL 2 HOUR)) as has_conflict
       FROM drivers d 
       JOIN users u ON d.user_id = u.id 
       JOIN trip_requests tr ON tr.driver_id = d.id
       WHERE u.is_approved = TRUE 
       AND CAST(d.vehicle_type AS UNSIGNED) >= CAST(? AS UNSIGNED)
       AND tr.trip_id = ?
       AND tr.request_type = 'driver_to_company'
       AND tr.status = 'pending'
       HAVING has_conflict = 0
       ORDER BY tr.created_at ASC`,
      [tripDateTime, tripDateTime, currentTrip.vehicle_type, currentTrip.id]
    );
    
    console.log(`[DEBUG] Found ${rows.length} drivers who requested this trip`);
    return rows;
  },

  // Update trip
  update: async (id, trip) => {
    console.log(`[DEBUG] Trip.update called for ID: ${id}`);
    console.log(`[DEBUG] Trip data received:`, trip);
    
    // Build dynamic query based on provided fields
    const updates = [];
    const values = [];
    
    if (trip.pickup_location !== undefined) {
      updates.push('pickup_location = ?');
      values.push(trip.pickup_location);
    }
    if (trip.destination !== undefined) {
      updates.push('destination = ?');
      values.push(trip.destination);
    }
    if (trip.trip_date !== undefined) {
      updates.push('trip_date = ?');
      values.push(trip.trip_date);
    }
    if (trip.departure_time !== undefined) {
      updates.push('departure_time = ?');
      values.push(trip.departure_time);
    }
    if (trip.passenger_count !== undefined) {
      updates.push('passenger_count = ?');
      values.push(trip.passenger_count);
    }
    if (trip.vehicle_type !== undefined) {
      updates.push('vehicle_type = ?');
      values.push(trip.vehicle_type);
    }
    if (trip.company_price !== undefined) {
      updates.push('company_price = ?');
      values.push(trip.company_price);
    }
    if (trip.driver_price !== undefined) {
      updates.push('driver_price = ?');
      values.push(trip.driver_price);
    }
    if (trip.visa_number !== undefined) {
      updates.push('visa_number = ?');
      values.push(trip.visa_number);
    }
    if (trip.driver_id !== undefined) {
      updates.push('driver_id = ?');
      values.push(trip.driver_id);
    }
    if (trip.status !== undefined) {
      updates.push('status = ?');
      values.push(trip.status);
    }
    
    if (updates.length === 0) {
      console.log(`[DEBUG] No updates to make for trip ${id}`);
      return false; // No updates to make
    }
    
    const query = `UPDATE trips SET ${updates.join(', ')} WHERE id = ?`;
    values.push(id);
    
    console.log(`[DEBUG] Final query: ${query}`);
    console.log(`[DEBUG] Final values: [${values.join(', ')}]`);
    
    try {
      const [result] = await pool.execute(query, values);
      console.log(`[DEBUG] Update result: affected rows = ${result.affectedRows}`);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`[DEBUG] Trip.update error:`, error);
      throw error;
    }
  },

  // Delete trip
  delete: async (id, companyId) => {
    const [result] = await pool.execute(
      'DELETE FROM trips WHERE id = ? AND company_id = ? AND status = "pending"',
      [id, companyId]
    );
    return result.affectedRows > 0;
  },

  // Assign driver to trip
  assignDriver: async (tripId, driverId) => {
    const [result] = await pool.execute(
      'UPDATE trips SET driver_id = ?, status = "assigned" WHERE id = ? AND status = "pending"',
      [driverId, tripId]
    );
    return result.affectedRows > 0;
  },

  // Assign a driver and reject other requests in a transaction
  assignDriverAndRejectOthers: async (tripId, driverId, acceptedRequestId) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Assign the driver and update trip status
      await connection.execute(
        'UPDATE trips SET driver_id = ?, status = \"assigned\" WHERE id = ? AND status = \"pending\"',
        [driverId, tripId]
      );

      // 2. Accept the chosen trip request
      await connection.execute(
        'UPDATE trip_requests SET status = \"accepted\" WHERE id = ?',
        [acceptedRequestId]
      );

      // 3. Reject all other pending requests for this trip
      await connection.execute(
        'UPDATE trip_requests SET status = \"rejected\" WHERE trip_id = ? AND status = \"pending\"',
        [tripId]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Transaction failed in assignDriverAndRejectOthers:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update trip status
  updateStatus: async (id, status) => {
    console.log(`[DEBUG] Updating trip ${id} status to: ${status}`);
    
    // Check current status first
    const [current] = await pool.execute('SELECT status FROM trips WHERE id = ?', [id]);
    console.log(`[DEBUG] Current status for trip ${id}:`, current[0]?.status || 'NOT FOUND');
    
    const [result] = await pool.execute(
      'UPDATE trips SET status = ? WHERE id = ?',
      [status, id]
    );
    
    console.log(`[DEBUG] Update result - affectedRows: ${result.affectedRows}, changedRows: ${result.changedRows}`);
    
    // Verify the update worked
    const [updated] = await pool.execute('SELECT status FROM trips WHERE id = ?', [id]);
    console.log(`[DEBUG] New status for trip ${id}:`, updated[0]?.status || 'NOT FOUND');
    
    return result.affectedRows > 0;
  },

  // Get trips by visa number
  getByVisaNumber: async (visaNumber) => {
    const [rows] = await pool.execute(
      `SELECT t.*, c.company_name, 
       CONCAT(d.first_name, ' ', d.last_name) AS driver_name 
       FROM trips t 
       LEFT JOIN companies c ON t.company_id = c.id 
       LEFT JOIN drivers d ON t.driver_id = d.id 
       WHERE t.visa_number = ?`,
      [visaNumber]
    );
    return rows;
  },

  // Get trips by date range
  getByDateRange: async (userId, role, startDate, endDate, filters = {}) => {
    let query = '';
    let params = [];

    if (role === 'company') {
      const [company] = await pool.execute('SELECT id FROM companies WHERE user_id = ?', [userId]);
      if (company.length === 0) return [];

      query = `SELECT t.*, 
               CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
               u.email AS driver_email
               FROM trips t 
               LEFT JOIN drivers d ON t.driver_id = d.id 
               LEFT JOIN users u ON d.user_id = u.id
               WHERE t.company_id = ?`;
      params.push(company[0].id);

      if (filters.visaNumber) {
        query += ' AND t.visa_number = ?';
        params.push(filters.visaNumber);
      } else {
        if (filters.driverEmail) {
          query += ' AND u.email = ?';
          params.push(filters.driverEmail);
        }

        // Add date range filter if it's provided and not a visa search
        if (startDate && endDate) {
          query += ' AND t.trip_date BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
      }

      query += ' ORDER BY t.trip_date, t.departure_time';

    } else if (role === 'driver') {
      const [driver] = await pool.execute('SELECT id FROM drivers WHERE user_id = ?', [userId]);
      if (driver.length === 0) return [];
      
      query = `SELECT t.*, c.company_name
               FROM trips t 
               JOIN companies c ON t.company_id = c.id 
               WHERE t.driver_id = ? 
               AND t.trip_date BETWEEN ? AND ? 
               ORDER BY t.trip_date, t.departure_time`;
      params = [driver[0].id, startDate, endDate];
    } else {
      return [];
    }
    
    const [rows] = await pool.execute(query, params);
    return rows;
  },
  
  // Get recent trips for a driver (limited to a specific number)
  getRecentByDriverId: async (driverId, limit = 5) => {
    const [rows] = await pool.execute(
      `SELECT t.*, c.company_name
       FROM trips t 
       JOIN companies c ON t.company_id = c.id 
       WHERE t.driver_id = ? 
       ORDER BY t.created_at DESC
       LIMIT ?`,
      [driverId, limit]
    );
    return rows;
  },
  
  // Count available trips for a driver
  countAvailableTrips: async (driverId) => {
    // Get driver's availability details
    const [driver] = await pool.execute('SELECT * FROM drivers WHERE id = ?', [driverId]);
    if (driver.length === 0) return 0;
    
    const driverInfo = driver[0];
    
    // If driver isn't available or missing availability info, return 0
    if (!driverInfo.current_location || !driverInfo.available_from || !driverInfo.available_to) {
      return 0;
    }
    
    // Add debug log for troubleshooting
    console.log(`Counting available trips for driver: ${driverId}`);
    console.log(`Location: ${driverInfo.current_location}, Available from: ${driverInfo.available_from}, Available to: ${driverInfo.available_to}`);
    
    // Count available trips matching driver's availability with improved location matching
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM trips t 
       WHERE t.status = 'pending' 
       AND t.driver_id IS NULL
       AND TIMESTAMP(t.trip_date, t.departure_time) >= ? 
       AND TIMESTAMP(t.trip_date, t.departure_time) <= ?
       AND (
         /* More flexible location matching */
         t.pickup_location LIKE CONCAT('%', ?, '%') OR
         /* Check if location words appear in pickup_location */
         (REPLACE(LOWER(t.pickup_location), ',', ' ') LIKE CONCAT('%', REPLACE(LOWER(?), ',', ' '), '%'))
       )
       AND NOT EXISTS (SELECT 1 FROM trip_requests tr WHERE tr.trip_id = t.id AND tr.driver_id = ?)`,
      [driverInfo.available_from, driverInfo.available_to, driverInfo.current_location, driverInfo.current_location, driverId]
    );
    
    console.log(`Found ${rows[0].count} available trips for driver ${driverId}`);
    return rows[0].count;
  },

  // Unassign driver from trip
  unassignDriver: async (tripId) => {
    const [result] = await pool.execute(
      'UPDATE trips SET driver_id = NULL, status = "pending" WHERE id = ?',
      [tripId]
    );
    return result.affectedRows > 0;
  },

  // Find a trip by visa number and company ID
  findByVisaNumberAndCompany: async (visaNumber, companyId) => {
    const [rows] = await pool.execute(
      'SELECT * FROM trips WHERE visa_number = ? AND company_id = ?',
      [visaNumber, companyId]
    );
    return rows[0];
  },

  // Count trips by company and status
  countByCompanyIdAndStatus: async (companyId, status) => {
    console.log(`[DEBUG] countByCompanyIdAndStatus called with companyId: ${companyId}, status: ${status}`);
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM trips WHERE company_id = ? AND status = ?',
      [companyId, status]
    );
    console.log(`[DEBUG] countByCompanyIdAndStatus result: ${rows[0].count}`);
    return rows[0].count;
  }
};


module.exports = Trip;
