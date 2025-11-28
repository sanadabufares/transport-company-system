const db = require('./config/db');

(async () => {
  try {
    console.log('=== DEBUGGING COMPANY 3 STATS ===');
    
    // Check if company exists
    const [companyRows] = await db.execute('SELECT * FROM companies WHERE id = ?', [3]);
    console.log('Company 3 exists:', companyRows.length > 0);
    if (companyRows.length > 0) {
      console.log('Company 3 details:', companyRows[0]);
    }
    
    // Check all trips for company 3
    const [allTrips] = await db.execute('SELECT * FROM trips WHERE company_id = ?', [3]);
    console.log('\nAll trips for company 3:', allTrips.length);
    console.log('Trip details:', allTrips);
    
    // Test the exact queries from getCompanyStats
    const [activeTripsRows] = await db.execute(
      `SELECT COUNT(*) AS count FROM trips WHERE company_id = ? AND status IN ('assigned','in_progress')`, 
      [3]
    );
    console.log('\nActive trips count:', activeTripsRows[0]?.count);
    
    const [completedTripsRows] = await db.execute(
      `SELECT COUNT(*) AS count FROM trips WHERE company_id = ? AND status = 'completed'`, 
      [3]
    );
    console.log('Completed trips count:', completedTripsRows[0]?.count);
    
    const [pendingRequestsRows] = await db.execute(
      `SELECT COUNT(*) AS count FROM trip_requests tr JOIN trips t ON tr.trip_id = t.id WHERE t.company_id = ? AND tr.status = 'pending'`, 
      [3]
    );
    console.log('Pending requests count:', pendingRequestsRows[0]?.count);
    
    // Check trip_requests table structure
    const [requestsRows] = await db.execute('SELECT * FROM trip_requests LIMIT 5');
    console.log('\nSample trip_requests:', requestsRows);
    
    process.exit(0);
  } catch (error) {
    console.error('Debug error:', error);
    process.exit(1);
  }
})();
