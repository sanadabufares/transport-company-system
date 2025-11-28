const axios = require('axios');

async function testCompanyProfile() {
  try {
    // Login as company
    console.log('Logging in as company...');
    const loginResponse = await axios.post('http://127.0.0.1:5000/api/auth/login', {
      username: 'testcompany',
      password: 'test123'
    });
    const token = loginResponse.data.token;
    console.log('Got company token');

    // Update profile
    console.log('\nUpdating company profile...');
    const updateResponse = await axios.put(
      'http://127.0.0.1:5000/api/company/profile',
      {
        contact_person: 'John Smith',
        phone: '123-456-7890',
        address: '123 Main St'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Update response:', updateResponse.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testCompanyProfile();
