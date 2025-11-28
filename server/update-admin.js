const db = require('./config/db');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function updateAdminPassword() {
  try {
    console.log('Starting admin password update...');
    
    // Generate hash for the new password "admin123"
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the admin user password
    const [result] = await db.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, 'admin']
    );
    
    console.log('Admin password updated successfully!');
    console.log(`Affected rows: ${result.affectedRows}`);
    console.log('You can now log in with:');
    console.log('Username: admin');
    console.log(`Password: ${newPassword}`);
    
    // Close the database connection
    await db.end();
    
  } catch (error) {
    console.error('Error updating admin password:', error);
  }
}

updateAdminPassword();
