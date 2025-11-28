const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupTestDatabase() {
  // Create a connection to MySQL without specifying a database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('Creating test database...');
    
    // Create test database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS transport_company_test');
    
    // Use the test database
    await connection.query('USE transport_company_test');
    
    // Drop existing tables if they exist
    console.log('Dropping existing tables...');
    await connection.query('DROP TABLE IF EXISTS trip_requests');
    await connection.query('DROP TABLE IF EXISTS trips');
    await connection.query('DROP TABLE IF EXISTS drivers');
    await connection.query('DROP TABLE IF EXISTS companies');
    await connection.query('DROP TABLE IF EXISTS notifications');
    await connection.query('DROP TABLE IF EXISTS ratings');
    await connection.query('DROP TABLE IF EXISTS users');
    
    // Create tables
    console.log('Creating tables...');
    
    // Users table
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'company', 'driver') NOT NULL,
        is_approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Companies table
    await connection.query(`
      CREATE TABLE companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address VARCHAR(255) NOT NULL,
        rating DECIMAL(3,1) DEFAULT 0.0,
        rating_count INT DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Drivers table
    await connection.query(`
      CREATE TABLE drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address VARCHAR(255) NOT NULL,
        license_number VARCHAR(50) NOT NULL,
        license_expiry DATE NOT NULL,
        vehicle_type INT NOT NULL,
        vehicle_plate VARCHAR(20) NOT NULL,
        current_location VARCHAR(255),
        available_from DATETIME,
        available_to DATETIME,
        rating DECIMAL(3,1) DEFAULT 0.0,
        rating_count INT DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Trips table
    await connection.query(`
      CREATE TABLE trips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        driver_id INT,
        pickup_location VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        trip_date DATE NOT NULL,
        departure_time TIME NOT NULL,
        passenger_count INT NOT NULL,
        vehicle_type INT NOT NULL,
        company_price DECIMAL(10,2) NOT NULL,
        driver_price DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        visa_number VARCHAR(50),
        special_instructions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
      )
    `);
    
    // Trip Requests table
    await connection.query(`
      CREATE TABLE trip_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trip_id INT NOT NULL,
        driver_id INT NOT NULL,
        request_type ENUM('driver_to_company', 'company_to_driver', 'reassignment_approval') NOT NULL,
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
      )
    `);
    
    // Notifications table
    await connection.query(`
      CREATE TABLE notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Ratings table
    await connection.query(`
      CREATE TABLE ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trip_id INT NOT NULL,
        company_id INT,
        driver_id INT,
        rated_by ENUM('company', 'driver') NOT NULL,
        rating INT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
      )
    `);
    
    console.log('Test database setup complete!');
    
    // Insert test data
    console.log('Inserting test data...');
    
    // Insert test users
    await connection.query(`
      INSERT INTO users (username, email, password, role, is_approved) VALUES
      ('admin', 'admin@test.com', '$2b$10$3JqfeJsKhg5ERYwVpMXEpubFvETQpkKtg6LcKpQzZ.1Vx1hXgEgOK', 'admin', TRUE),
      ('company1', 'company1@test.com', '$2b$10$3JqfeJsKhg5ERYwVpMXEpubFvETQpkKtg6LcKpQzZ.1Vx1hXgEgOK', 'company', TRUE),
      ('driver1', 'driver1@test.com', '$2b$10$3JqfeJsKhg5ERYwVpMXEpubFvETQpkKtg6LcKpQzZ.1Vx1hXgEgOK', 'driver', TRUE)
    `);
    
    // Insert test companies
    await connection.query(`
      INSERT INTO companies (user_id, company_name, contact_person, phone, address) VALUES
      (2, 'Test Company', 'John Smith', '123-456-7890', '123 Main St, Test City')
    `);
    
    // Insert test drivers
    await connection.query(`
      INSERT INTO drivers (user_id, first_name, last_name, phone, address, license_number, license_expiry, vehicle_type, vehicle_plate, current_location, available_from, available_to) VALUES
      (3, 'Test', 'Driver', '987-654-3210', '456 Oak St, Test City', 'DL12345', '2025-12-31', 8, 'ABC123', 'Test City', '2025-01-01 08:00:00', '2025-12-31 18:00:00')
    `);
    
    console.log('Test data inserted successfully!');
    
  } catch (error) {
    console.error('Error setting up test database:', error);
  } finally {
    await connection.end();
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupTestDatabase()
    .then(() => {
      console.log('Test database setup completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Test database setup failed:', err);
      process.exit(1);
    });
}

module.exports = setupTestDatabase;
