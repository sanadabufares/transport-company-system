require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDatabase() {
  console.log('🔍 Checking database configuration...');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[EMPTY]');
  console.log('DB_NAME:', process.env.DB_NAME);
  
  try {
    // Test connection without database first
    console.log('\n📡 Testing MySQL connection...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    console.log('✅ MySQL connection successful');
    
    // Check if database exists
    console.log('\n🗄️ Checking if database exists...');
    const [databases] = await connection.execute('SHOW DATABASES LIKE ?', [process.env.DB_NAME]);
    
    if (databases.length === 0) {
      console.log(`❌ Database '${process.env.DB_NAME}' does not exist`);
      console.log('🔧 Creating database...');
      await connection.execute(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`✅ Database '${process.env.DB_NAME}' created`);
    } else {
      console.log(`✅ Database '${process.env.DB_NAME}' exists`);
    }
    
    await connection.end();
    
    // Test connection with database
    console.log('\n📡 Testing connection to specific database...');
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME
    });
    
    console.log('✅ Database connection successful');
    
    // Check if users table exists
    console.log('\n📋 Checking if users table exists...');
    try {
      const [tables] = await dbConnection.execute("SHOW TABLES LIKE 'users'");
      
      if (tables.length === 0) {
        console.log('❌ Users table does not exist');
        console.log('🔧 You need to run the database initialization script');
        console.log('Run: node init-db.js');
      } else {
        console.log('✅ Users table exists');
        
        // Check if admin user exists
        console.log('\n👤 Checking admin user...');
        const [users] = await dbConnection.execute('SELECT * FROM users WHERE username = ?', ['admin']);
        
        if (users.length === 0) {
          console.log('❌ Admin user does not exist');
          console.log('🔧 You need to run the database initialization script');
          console.log('Run: node init-db.js');
        } else {
          console.log('✅ Admin user exists');
          console.log('User details:', {
            id: users[0].id,
            username: users[0].username,
            role: users[0].role,
            is_approved: users[0].is_approved
          });
        }
      }
    } catch (error) {
      console.log('❌ Error checking tables:', error.message);
    }
    
    await dbConnection.end();
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure XAMPP MySQL is running');
    console.log('2. Check your .env file database credentials');
    console.log('3. Make sure MySQL is running on port 3306');
  }
}

checkDatabase();
