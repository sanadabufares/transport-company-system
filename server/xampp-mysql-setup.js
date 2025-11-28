require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function setupXAMPPDatabase() {
  console.log('🔧 Setting up database for XAMPP MySQL...');
  
  try {
    // XAMPP MySQL default configuration
    const connectionConfig = {
      host: 'localhost',
      user: 'root',
      password: '', // XAMPP MySQL default has no password
      port: 3306
    };
    
    console.log('📡 Connecting to XAMPP MySQL...');
    console.log('Host:', connectionConfig.host);
    console.log('User:', connectionConfig.user);
    console.log('Port:', connectionConfig.port);
    
    // Connect without database first
    const connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected to XAMPP MySQL successfully');
    
    // Create database if it doesn't exist
    const dbName = 'transport_company';
    console.log(`🗄️ Creating database '${dbName}'...`);
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' is ready`);
    
    await connection.end();
    
    // Connect to the specific database
    const dbConnection = await mysql.createConnection({
      ...connectionConfig,
      database: dbName
    });
    
    console.log(`✅ Connected to '${dbName}' database`);
    
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    
    // Create companies table
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    
    // Create drivers table  
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    
    // Create trips table
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
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
      
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user already exists');
      
      // Update admin password to ensure it's correct
      console.log('🔧 Updating admin password to ensure it works...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await dbConnection.execute(
        'UPDATE users SET password = ? WHERE username = ?',
        [hashedPassword, 'admin']
      );
      
      console.log('✅ Admin password updated');
    }
    
    // Verify the admin user and password
    console.log('🔍 Verifying admin user...');
    const [adminUsers] = await dbConnection.execute('SELECT * FROM users WHERE username = ?', ['admin']);
    
    if (adminUsers.length > 0) {
      const adminUser = adminUsers[0];
      const passwordMatch = await bcrypt.compare('admin123', adminUser.password);
      
      console.log('Admin user details:');
      console.log('- ID:', adminUser.id);
      console.log('- Username:', adminUser.username);
      console.log('- Email:', adminUser.email);
      console.log('- Role:', adminUser.role);
      console.log('- Approved:', adminUser.is_approved);
      console.log('- Password verification:', passwordMatch ? '✅ CORRECT' : '❌ INCORRECT');
    }
    
    await dbConnection.end();
    
    console.log('\n🎉 XAMPP MySQL database setup completed successfully!');
    console.log('🔐 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('\n📝 Make sure your .env file has these settings:');
    console.log('   DB_HOST=localhost');
    console.log('   DB_USER=root');
    console.log('   DB_PASSWORD=');
    console.log('   DB_NAME=transport_company');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting for XAMPP:');
    console.log('1. Make sure XAMPP Control Panel is running');
    console.log('2. Start the MySQL service in XAMPP');
    console.log('3. Check that MySQL is running on port 3306');
    console.log('4. Default XAMPP MySQL user is "root" with no password');
  }
}

setupXAMPPDatabase();
