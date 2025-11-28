const axios = require('axios');

async function testDirectLogin() {
  try {
    console.log('Testing direct login to API...');
    
    const response = await axios.post('http://127.0.0.1:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('Login successful!');
    console.log('Response:', response.data);
    
    // Test the JWT token
    const token = response.data.token;
    console.log('Token received:', token);
    
    // Test the me endpoint with the token
    console.log('\nTesting auth/me endpoint with token...');
    const profileResponse = await axios.get('http://127.0.0.1:5000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Profile data received:');
    console.log(profileResponse.data);
    
    console.log('\n---------------------------------');
    console.log('Authentication is working correctly on the server side');
    console.log('Use these credentials in the login form:');
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error during direct login test:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testDirectLogin();
