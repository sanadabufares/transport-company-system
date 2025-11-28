require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function setupDatabase() {
  console.log('🔧 Setting up database for MariaDB/XAMPP...');
  
  try {
    // Connect without database first
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: 3306
    });
    
    console.log('✅ Connected to MariaDB');
    
    // Create database if it doesn't exist
    console.log('🗄️ Creating database...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    console.log(`✅ Database '${process.env.DB_NAME}' ready`);
    
    await connection.end();
    
    // Connect to the specific database
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      port: 3306
    });
    
    console.log('✅ Connected to transport_company database');
    
    // Create users table
    console.log('📋 Creating users table...');
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'company', 'driver') NOT NULL,
        is_approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create other necessary tables
    console.log('📋 Creating companies table...');
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        company_name VARCHAR(100) NOT NULL,
        contact_person VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        license_number VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('📋 Creating drivers table...');
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        license_number VARCHAR(50),
        experience_years INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('📋 Creating trips table...');
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS trips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT,
        driver_id INT,
        pickup_location TEXT NOT NULL,
        destination TEXT NOT NULL,
        trip_date DATE NOT NULL,
        trip_time TIME NOT NULL,
        price DECIMAL(10,2),
        status ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
      )
    `);
    
    // Check if admin user exists
    console.log('👤 Checking admin user...');
    const [existingUsers] = await dbConnection.execute('SELECT * FROM users WHERE username = ?', ['admin']);
    
    if (existingUsers.length === 0) {
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await dbConnection.execute(
        'INSERT INTO users (username, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@transport.com', hashedPassword, 'admin', true]
      );
      
      console.log('✅ Admin user created');
      console.log('Credentials: username=admin, password=admin123');
    } else {
      console.log('✅ Admin user already exists');
      
      // Update admin password to make sure it's correct
      console.log('🔧 Updating admin password...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await dbConnection.execute(
        'UPDATE users SET password = ? WHERE username = ?',
        [hashedPassword, 'admin']
      );
      
      console.log('✅ Admin password updated');
      console.log('Credentials: username=admin, password=admin123');
    }
    
    await dbConnection.end();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('You can now login with:');
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Make sure:');
    console.log('1. XAMPP is running');
    console.log('2. MySQL/MariaDB service is started');
    console.log('3. Port 3306 is available');
  }
}

setupDatabase();
