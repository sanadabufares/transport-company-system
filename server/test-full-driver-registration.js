const axios = require('axios');

async function testDriverRegistration() {
  console.log('🧪 Testing full driver registration API...\n');
  
  const baseURL = 'http://localhost:5000/api';
  
  // Test data
  const driverData = {
    username: `test_driver_${Date.now()}`,
    email: `testdriver${Date.now()}@test.com`,
    password: 'testpass123',
    first_name: 'Test',
    last_name: 'Driver',
    phone: '054-1234567',
    address: '123 Test Street, Test City',
    license_number: 'LIC123456',
    license_expiry: '2025-12-31',
    vehicle_type: '8',
    vehicle_plate: '123-45-678'
  };
  
  try {
    console.log('📤 Sending driver registration request...');
    console.log('Data:', JSON.stringify(driverData, null, 2));
    
    const response = await axios.post(`${baseURL}/auth/register/driver`, driverData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('\n✅ SUCCESS Response:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.log('\n❌ ERROR Response:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      console.log('No response received');
      console.log('Request:', error.request);
    } else {
      console.log('Error:', error.message);
    }
  }
  
  // Check if user was actually created in database
  try {
    console.log('\n🔍 Checking if user was created in database...');
    const db = require('./config/db');
    const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [driverData.username]);
    const [drivers] = await db.execute('SELECT * FROM drivers WHERE user_id = ?', [users[0]?.id]);
    
    if (users.length > 0) {
      console.log('✅ User created in database:', {
        id: users[0].id,
        username: users[0].username,
        email: users[0].email,
        role: users[0].role
      });
      
      if (drivers.length > 0) {
        console.log('✅ Driver profile created:', {
          first_name: drivers[0].first_name,
          last_name: drivers[0].last_name,
          phone: drivers[0].phone
        });
      } else {
        console.log('❌ Driver profile NOT created');
      }
      
      // Clean up test data
      await db.execute('DELETE FROM drivers WHERE user_id = ?', [users[0].id]);
      await db.execute('DELETE FROM users WHERE id = ?', [users[0].id]);
      console.log('🧹 Test data cleaned up');
    } else {
      console.log('❌ User NOT created in database');
    }
    
  } catch (dbError) {
    console.error('Database check error:', dbError.message);
  }
  
  process.exit(0);
}

// Make sure server is running
console.log('Waiting for server to be ready...');
setTimeout(() => {
  testDriverRegistration();
}, 2000);
