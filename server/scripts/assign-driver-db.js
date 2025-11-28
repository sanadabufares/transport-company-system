require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

const assignDriver = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Successfully connected to the database.');

    // --- Step 1: Find the company ---
    // We'll assume there's only one company for now. 
    // In a multi-company setup, we'd need a specific identifier.
    const [companies] = await connection.execute('SELECT * FROM companies LIMIT 1');
    if (companies.length === 0) {
      throw new Error('No companies found in the database.');
    }
    const company = companies[0];
    console.log(`Found company: ${company.company_name} (ID: ${company.id})`);

    // --- Step 2: Find a pending trip for this company ---
    const [pendingTrips] = await connection.execute(
      'SELECT * FROM trips WHERE company_id = ? AND status = ? LIMIT 1',
      [company.id, 'pending']
    );

    if (pendingTrips.length === 0) {
      throw new Error(`No pending trips found for ${company.company_name}.`);
    }
    const tripToAssign = pendingTrips[0];
    console.log(`Found pending trip to assign (ID: ${tripToAssign.id})`);

    // --- Step 3: Find an available driver ---
    // We'll pick the first driver available. A more complex system would check availability.
    const [drivers] = await connection.execute('SELECT * FROM drivers LIMIT 1');
    if (drivers.length === 0) {
      throw new Error('No drivers found in the database.');
    }
    const driverToAssign = drivers[0];
    console.log(`Found driver to assign: ${driverToAssign.first_name} ${driverToAssign.last_name} (ID: ${driverToAssign.id})`);

    // --- Step 4: Assign the driver and update the trip status ---
    console.log(`Assigning driver ${driverToAssign.id} to trip ${tripToAssign.id}...`);
    const [updateResult] = await connection.execute(
      'UPDATE trips SET driver_id = ?, status = ? WHERE id = ?',
      [driverToAssign.id, 'assigned', tripToAssign.id]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error('Failed to update the trip. No rows were affected.');
    }

    console.log('Driver assigned successfully!');
    console.log('Please refresh your dashboard to see the updated trip status.');

  } catch (error) {
    console.error('An error occurred:', error.message);
  } finally {
    if (connection) {
      console.log('Closing database connection.');
      connection.release();
    }
    // End the pool to allow the script to exit
    pool.end();
  }
};

assignDriver();
