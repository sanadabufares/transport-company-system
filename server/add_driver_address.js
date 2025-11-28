const mysql = require('mysql2/promise');
require('dotenv').config();

async function addDriverAddressColumn() {
  try {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'transport_company'
    });
    
    console.log('Connected successfully to database');
    console.log('Adding address column to drivers table...');
    
    // Check if column already exists
    const database = process.env.DB_NAME || 'transport_company';
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'drivers' AND COLUMN_NAME = 'address'",
      [database]
    );
    
    if (columns.length > 0) {
      console.log('Address column already exists in drivers table');
    } else {
      // Add the address column
      await connection.execute(
        "ALTER TABLE drivers ADD COLUMN address VARCHAR(255) NOT NULL DEFAULT ''"
      );
      console.log('Successfully added address column to drivers table');
    }
    
    await connection.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error updating database schema:', error);
    process.exit(1);
  }
}

addDriverAddressColumn();
