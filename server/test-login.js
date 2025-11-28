const bcrypt = require('bcrypt');
const db = require('./config/db');

async function testLogin() {
  try {
    console.log('Testing login functionality...');
    
    // 1. Check if MySQL connection works
    console.log('Checking database connection...');
    await db.execute('SELECT 1');
    console.log('✅ Database connection successful');
    
    // 2. Check if admin user exists
    console.log('\nChecking admin user...');
    const [users] = await db.execute('SELECT * FROM users WHERE username = ?', ['admin']);
    
    if (users.length === 0) {
      console.log('❌ Admin user not found in database');
      
      // Create admin user if not exists
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db.execute(
        'INSERT INTO users (username, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@transport.com', hashedPassword, 'admin', true]
      );
      
      console.log('✅ Admin user created successfully');
      
      // Verify admin was created
      const [newUsers] = await db.execute('SELECT * FROM users WHERE username = ?', ['admin']);
      console.log('Admin user details:', {
        id: newUsers[0].id,
        username: newUsers[0].username,
        role: newUsers[0].role,
        is_approved: newUsers[0].is_approved
      });
    } else {
      console.log('✅ Admin user exists in database');
      console.log('Admin user details:', {
        id: users[0].id,
        username: users[0].username,
        role: users[0].role,
        is_approved: users[0].is_approved
      });
      
      // 3. Test password comparison
      console.log('\nTesting password verification...');
      const adminUser = users[0];
      
      console.log('Current hashed password:', adminUser.password);
      
      // Test with admin123 password
      const testPassword = 'admin123';
      const passwordMatch = await bcrypt.compare(testPassword, adminUser.password);
      
      if (passwordMatch) {
        console.log(`✅ Password '${testPassword}' is correct for admin`);
      } else {
        console.log(`❌ Password '${testPassword}' is NOT correct for admin`);
        
        // Update password if it doesn't match
        console.log('Updating admin password...');
        const newHashedPassword = await bcrypt.hash(testPassword, 10);
        
        await db.execute(
          'UPDATE users SET password = ? WHERE username = ?',
          [newHashedPassword, 'admin']
        );
        
        console.log(`✅ Admin password updated to '${testPassword}'`);
        console.log('New hashed password:', newHashedPassword);
      }
    }
    
    // 4. Verify JWT secret exists
    console.log('\nChecking JWT secret...');
    if (!process.env.JWT_SECRET) {
      console.log('❌ JWT_SECRET not found in environment variables');
    } else {
      console.log('✅ JWT_SECRET exists:', process.env.JWT_SECRET);
    }
    
    console.log('\nLogin test completed. You should now be able to log in with:');
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error during login test:', error);
  } finally {
    // Close DB connection
    await db.end();
  }
}

testLogin();
