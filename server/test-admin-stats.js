const axios = require('axios');

(async () => {
  try {
    const base = 'http://127.0.0.1:5000/api';
    console.log('Logging in as admin...');
    const loginRes = await axios.post(`${base}/auth/login`, { username: 'admin', password: 'admin123' });
    const token = loginRes.data.token;
    console.log('Login OK');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\nListing registered admin routes...');
    try {
      const routesRes = await axios.get(`${base}/admin/__debug_routes`, { headers });
      console.log(routesRes.data);
    } catch (e) {
      console.log('Debug route error:', e.response?.status, e.response?.data || e.message);
    }

    console.log('\nFull router map via /api/__routes ...');
    try {
      const mapRes = await axios.get(`${base}/__routes`);
      console.log('Admin routes in map:', mapRes.data?.admin);
    } catch (e) {
      console.log('Routes map error:', e.response?.status, e.response?.data || e.message);
    }

    console.log('\nFetching companies list...');
    const companiesRes = await axios.get(`${base}/admin/companies`, { headers });
    console.log(`Companies count: ${companiesRes.data.length}`);
    const companyId = companiesRes.data[0]?.id || 1;
    console.log(`Testing company stats for id=${companyId} ...`);
    try {
      const companyStatsRes = await axios.get(`${base}/admin/companies/${companyId}/stats`, { headers });
      console.log('Company stats:', companyStatsRes.data);
    } catch (e) {
      console.log('Company stats error:', e.response?.status, e.response?.data || e.message);
    }

    console.log('\nFetching drivers list...');
    const driversRes = await axios.get(`${base}/admin/drivers`, { headers });
    console.log(`Drivers count: ${driversRes.data.length}`);
    const driverId = driversRes.data[0]?.id || 1;
    console.log(`Testing driver stats for id=${driverId} ...`);
    try {
      const driverStatsRes = await axios.get(`${base}/admin/drivers/${driverId}/stats`, { headers });
      console.log('Driver stats:', driverStatsRes.data);
    } catch (e) {
      console.log('Driver stats error:', e.response?.status, e.response?.data || e.message);
    }
  } catch (err) {
    console.error('Test failed:', err.response?.status, err.response?.data || err.message);
  }
})();
