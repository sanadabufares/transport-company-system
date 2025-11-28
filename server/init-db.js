const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
  console.log('Starting database initialization...');
  
  // Database connection parameters
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };
  
  try {
    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'config', 'database.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Create connection
    console.log('Connecting to MySQL server...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Execute SQL script
    console.log('Executing SQL script...');
    await connection.query(sqlScript);
    
    console.log('Database initialized successfully!');
    
    // Close connection
    await connection.end();
    
    console.log('Connection closed.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initializeDatabase();
