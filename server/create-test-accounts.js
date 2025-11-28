const bcrypt = require('bcrypt');
const { pool } = require('./config/db');

async function createTestAccounts() {
  try {
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create company user
    const [companyUser] = await pool.execute(
      'INSERT INTO users (username, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
      ['company1', 'company@test.com', hashedPassword, 'company', true]
    );
    
    // Create company profile
    await pool.execute(
      'INSERT INTO companies (user_id, company_name, contact_person, phone, address, description) VALUES (?, ?, ?, ?, ?, ?)',
      [companyUser.insertId, 'Test Transport Co', 'John Smith', '050-1234567', 'Tel Aviv, Israel', 'A test transport company']
    );
    
    console.log('Company user created!');
    console.log('  Username: company1');
    console.log('  Password: test123');

    // Create driver user
    const [driverUser] = await pool.execute(
      'INSERT INTO users (username, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
      ['driver1', 'driver@test.com', hashedPassword, 'driver', true]
    );
    
    // Create driver profile
    await pool.execute(
      'INSERT INTO drivers (user_id, first_name, last_name, phone, address, license_number, license_expiry, vehicle_type, vehicle_plate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [driverUser.insertId, 'David', 'Cohen', '050-7654321', 'Jerusalem, Israel', 'DL123456', '2026-12-31', '14', '12-345-67']
    );
    
    console.log('\nDriver user created!');
    console.log('  Username: driver1');
    console.log('  Password: test123');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTestAccounts();
