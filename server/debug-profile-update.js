const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000/api';

async function debugProfileUpdate() {
  console.log('🔍 Debugging company profile update...\n');
  
  try {
    // Step 1: Try to login with one of the existing companies
    console.log('1. Logging in as company user...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'company1@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, got token:', token.substring(0, 20) + '...');
    
    // Step 2: Get current profile to see what data we have
    console.log('\n2. Getting current profile...');
    const profileResponse = await axios.get(`${API_URL}/company/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Current profile data:');
    console.log(JSON.stringify(profileResponse.data, null, 2));
    
    // Step 3: Try to update profile with current data + small change
    console.log('\n3. Attempting to update profile...');
    const updateData = {
      company_name: profileResponse.data.company_name || 'Test Company',
      contact_person: profileResponse.data.contact_person || 'John Doe',
      phone: profileResponse.data.phone || '+1234567890', 
      address: profileResponse.data.address || '123 Test Street',
      description: (profileResponse.data.description || 'Test description') + ' - Updated'
    };
    
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    const updateResponse = await axios.put(`${API_URL}/company/profile`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Update successful!');
    console.log('Response:', updateResponse.data);
    
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error('Message:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', error.response.headers);
    }
    
    if (error.request) {
      console.error('Request was made but no response received');
    }
    
    console.error('\nStack trace:', error.stack);
  }
}

debugProfileUpdate();
