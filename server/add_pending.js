/**
 * Simple script to add a pending approval to the database
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Database configuration from .env file
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'transportant'
};

async function addPendingApproval() {
  console.log('Adding a pending approval to the database...');

  let connection;
  try {
    // Connect to the database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to the database.');

    // Create data for a pending company
    const pendingCompany = {
      username: 'pending_company',
      email: 'pending@example.com',
      password: 'password123',
      company_name: 'Pending Approval Company',
      contact_person: 'Jane Pending',
      phone: '050-9876543',
      address: 'Tel Aviv, Main St 123',
      description: 'This company is awaiting admin approval'
    };

    // Hash the password
    const hashedPassword = await bcrypt.hash(pendingCompany.password, 10);
    
    // Add user record with is_approved = FALSE
    const [userResult] = await connection.execute(
      'INSERT INTO users (username, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
      [pendingCompany.username, pendingCompany.email, hashedPassword, 'company', false]
    );
    
    const userId = userResult.insertId;
    
    // Add company record
    await connection.execute(
      'INSERT INTO companies (user_id, company_name, contact_person, phone, address, description, rating, rating_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, pendingCompany.company_name, pendingCompany.contact_person, pendingCompany.phone, pendingCompany.address, pendingCompany.description, 0, 0]
    );
    
    console.log(`Added pending company: ${pendingCompany.company_name}`);
    
    // Verify pending users exist
    const [pendingUsers] = await connection.execute(
      'SELECT u.id, u.username, u.email, u.role, u.created_at FROM users u WHERE u.is_approved = FALSE AND u.role != "admin"'
    );
    
    console.log(`There are now ${pendingUsers.length} pending users in the database.`);
    
    console.log('Pending approval added successfully!');
  } catch (error) {
    console.error('Error adding pending approval:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the function
addPendingApproval();
