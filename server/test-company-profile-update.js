const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000/api';

async function testCompanyProfileUpdate() {
  console.log('🧪 Testing Company Profile Update...\n');
  
  try {
    // Step 1: Login as company user
    console.log('1. Logging in as company user...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'company1@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Get current profile
    console.log('\n2. Getting current company profile...');
    const profileResponse = await axios.get(`${API_URL}/company/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const currentProfile = profileResponse.data;
    console.log('✅ Current profile:', {
      company_name: currentProfile.company_name,
      contact_person: currentProfile.contact_person,
      phone: currentProfile.phone,
      address: currentProfile.address
    });
    
    // Step 3: Update profile
    console.log('\n3. Updating company profile...');
    const updatedData = {
      company_name: currentProfile.company_name || 'Test Company Updated',
      contact_person: currentProfile.contact_person || 'John Doe Updated',
      phone: currentProfile.phone || '+1234567890',
      address: currentProfile.address || '123 Updated Street',
      description: currentProfile.description || 'Updated company description'
    };
    
    const updateResponse = await axios.put(`${API_URL}/company/profile`, updatedData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Profile update response:', updateResponse.data.message);
    
    // Step 4: Verify update by fetching profile again
    console.log('\n4. Verifying profile was updated...');
    const verifyResponse = await axios.get(`${API_URL}/company/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const updatedProfile = verifyResponse.data;
    console.log('✅ Updated profile:', {
      company_name: updatedProfile.company_name,
      contact_person: updatedProfile.contact_person,
      phone: updatedProfile.phone,
      address: updatedProfile.address,
      description: updatedProfile.description
    });
    
    console.log('\n🎉 Company profile update test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testCompanyProfileUpdate();
}

module.exports = { testCompanyProfileUpdate };
