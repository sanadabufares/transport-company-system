const { pool } = require('../config/db');

const Driver = {
  // Create a new driver
  create: async (driver) => {
    const [result] = await pool.execute(
      'INSERT INTO drivers (user_id, first_name, last_name, phone, address, license_number, license_expiry, vehicle_type, vehicle_plate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [driver.user_id, driver.first_name, driver.last_name, driver.phone, driver.address, driver.license_number, driver.license_expiry, driver.vehicle_type, driver.vehicle_plate]
    );
    return result.insertId;
  },

  // Find driver by user_id
  findByUserId: async (userId) => {
    const [rows] = await pool.execute('SELECT * FROM drivers WHERE user_id = ?', [userId]);
    return rows[0];
  },

  // Find driver by id
  findById: async (id) => {
    const [rows] = await pool.execute('SELECT * FROM drivers WHERE id = ?', [id]);
    return rows[0];
  },

  // Get all drivers
  getAll: async () => {
    const [rows] = await pool.execute(
      'SELECT d.*, u.username, u.email, u.is_approved FROM drivers d JOIN users u ON d.user_id = u.id WHERE u.is_approved = TRUE'
    );
    return rows;
  },

  // Update driver
  update: async (id, driver) => {
    const [result] = await pool.execute(
      'UPDATE drivers SET first_name = ?, last_name = ?, phone = ?, address = ?, license_number = ?, license_expiry = ?, vehicle_type = ?, vehicle_plate = ? WHERE id = ?',
      [driver.first_name, driver.last_name, driver.phone, driver.address, driver.license_number, driver.license_expiry, driver.vehicle_type, driver.vehicle_plate, id]
    );
    return result.affectedRows > 0;
  },

  // Update driver availability
  updateAvailability: async (id, location, availableFrom, availableTo) => {
    const [result] = await pool.execute(
      'UPDATE drivers SET current_location = ?, available_from = ?, available_to = ? WHERE id = ?',
      [location, availableFrom, availableTo, id]
    );
    return result.affectedRows > 0;
  },

  // Update driver rating
  updateRating: async (id, rating) => {
    const [driverRows] = await pool.execute('SELECT rating, rating_count FROM drivers WHERE id = ?', [id]);
    if (driverRows.length === 0) return false;

    const currentDriver = driverRows[0];
    const newRatingCount = currentDriver.rating_count + 1;
    const newRating = ((currentDriver.rating * currentDriver.rating_count) + rating) / newRatingCount;

    const [result] = await pool.execute(
      'UPDATE drivers SET rating = ?, rating_count = ? WHERE id = ?',
      [newRating, newRatingCount, id]
    );
    return result.affectedRows > 0;
  },

  // Find available drivers for a trip
  findAvailableDrivers: async (tripDate, departureTime, vehicleType, pickupLocation) => {
    // Create combined timestamp for trip date and time
    const tripDateTime = `${tripDate} ${departureTime}`;
    console.log(`Finding available drivers for trip at ${tripDateTime}, vehicle: ${vehicleType}, location: ${pickupLocation}`);
    
    // First get all drivers with the right vehicle type to see how many we should have
    const [allDriversWithVehicleType] = await pool.execute(
      `SELECT d.id, d.first_name, d.last_name, d.vehicle_type, d.current_location, 
              d.available_from, d.available_to 
       FROM drivers d
       JOIN users u ON d.user_id = u.id
       WHERE u.is_approved = TRUE AND d.vehicle_type = ?`,
      [parseInt(vehicleType, 10)]
    );
    
    console.log(`Found ${allDriversWithVehicleType.length} drivers with vehicle type ${vehicleType}`);
    
    // For each driver, log their availability data to help diagnose issues
    allDriversWithVehicleType.forEach(driver => {
      console.log(`Driver ${driver.id}: ${driver.first_name} ${driver.last_name}`);
      console.log(`  Vehicle Type: ${driver.vehicle_type}, Trip Vehicle Type: ${vehicleType}`);
      console.log(`  Current Location: "${driver.current_location || 'Not set'}"`);
      console.log(`  Available From: ${driver.available_from || 'Not set'}`);
      console.log(`  Available To: ${driver.available_to || 'Not set'}`);
      
      const hasLocation = driver.current_location !== null && driver.current_location !== '';
      const locationMatch = hasLocation && 
        (driver.current_location.includes(pickupLocation) || pickupLocation.includes(driver.current_location));
      
      const hasTimeRange = driver.available_from !== null && driver.available_to !== null;
      
      // More robust date comparison with detailed logging
      let inTimeRange = false;
      if (hasTimeRange) {
        const tripTime = new Date(tripDateTime);
        const availFrom = new Date(driver.available_from);
        const availTo = new Date(driver.available_to);
        
        console.log(`  Trip Time: ${tripTime.toISOString()}`);
        console.log(`  Avail From: ${availFrom.toISOString()}`);
        console.log(`  Avail To: ${availTo.toISOString()}`);
        
        inTimeRange = tripTime >= availFrom && tripTime <= availTo;
      }
      
      console.log(`  Location Match: ${locationMatch ? 'YES' : 'NO'}`);
      console.log(`  Time Range Match: ${inTimeRange ? 'YES' : 'NO'}`);
      console.log(`  Overall Match: ${locationMatch && inTimeRange ? 'YES' : 'NO'}`);
    });
    
    // Now run the actual query to get matching drivers
    const query = `
      SELECT d.*, u.username, u.email
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE 
        u.is_approved = TRUE AND
        /* Handle vehicle type comparison with type safety */
        (d.vehicle_type = ? OR CAST(d.vehicle_type AS CHAR) = ?) AND
        /* Ensure driver has location and availability data */
        d.current_location IS NOT NULL AND d.current_location != '' AND
        d.available_from IS NOT NULL AND d.available_to IS NOT NULL AND
        /* More flexible location matching - driver location appears somewhere in pickup location OR vice versa */
        (d.current_location LIKE ? OR ? LIKE CONCAT('%', d.current_location, '%')) AND
        /* Check if trip time is between driver's available_from and available_to */
        STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s') BETWEEN STR_TO_DATE(d.available_from, '%Y-%m-%d %H:%i:%s') AND STR_TO_DATE(d.available_to, '%Y-%m-%d %H:%i:%s')
    `;
    const params = [
      parseInt(vehicleType, 10), 
      vehicleType.toString(), 
      `%${pickupLocation}%`, 
      pickupLocation,
      tripDateTime
    ];
    
    const [rows] = await pool.execute(query, params);
    console.log(`Found ${rows.length} drivers matching ALL criteria`);
    
    return rows;
  },

  // Count all approved drivers
  countAllApproved: async () => {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM drivers d JOIN users u ON d.user_id = u.id WHERE u.is_approved = TRUE'
    );
    return rows[0].count;
  },

  // Get all approved drivers
  getAllApproved: async () => {
    const [rows] = await pool.execute(
      'SELECT d.*, u.username, u.email, u.is_approved FROM drivers d JOIN users u ON d.user_id = u.id WHERE u.is_approved = TRUE'
    );
    return rows;
  },

  // Check if a driver has a conflicting trip
  hasTripConflict: async (driverId, tripDateTime) => {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count FROM trips 
       WHERE driver_id = ? 
       AND status IN ('assigned', 'in_progress') 
       AND TIMESTAMP(trip_date, departure_time) BETWEEN ? AND DATE_ADD(?, INTERVAL 2 HOUR)`,
      [driverId, tripDateTime, tripDateTime]
    );
    return rows[0].count > 0;
  }
};

module.exports = Driver;