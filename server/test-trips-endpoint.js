const axios = require('axios');

(async () => {
  try {
    const base = 'http://127.0.0.1:5000/api';
    console.log('Testing trips endpoint...');
    
    // Login as admin
    const loginRes = await axios.post(`${base}/auth/login`, { username: 'admin', password: 'admin123' });
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test trips endpoint for company 3
    console.log('\nTesting /api/admin/companies/3/trips...');
    try {
      const tripsRes = await axios.get(`${base}/admin/companies/3/trips`, { headers });
      console.log('SUCCESS - Response:', JSON.stringify(tripsRes.data, null, 2));
    } catch (e) {
      console.log('ERROR:', e.response?.status, e.response?.data || e.message);
    }
    
    // Test with filter
    console.log('\nTesting with filter=active...');
    try {
      const filteredRes = await axios.get(`${base}/admin/companies/3/trips?filter=active`, { headers });
      console.log('FILTERED SUCCESS:', JSON.stringify(filteredRes.data, null, 2));
    } catch (e) {
      console.log('FILTERED ERROR:', e.response?.status, e.response?.data || e.message);
    }
    
  } catch (err) {
    console.error('Test failed:', err.response?.status, err.response?.data || err.message);
  }
})();
