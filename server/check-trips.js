const db = require('./config/db');

(async () => {
  try {
    console.log('=== CHECKING TRIPS TABLE ===');
    
    // Check all trips
    const [allTrips] = await db.execute('SELECT id, company_id, driver_id, status FROM trips');
    console.log('All trips in database:');
    console.table(allTrips);
    
    // Check specifically for company_id = 3
    const [company3Trips] = await db.execute('SELECT * FROM trips WHERE company_id = 3');
    console.log('\nTrips for company_id = 3:');
    console.table(company3Trips);
    
    // Check if company_id might be stored as string
    const [stringTrips] = await db.execute('SELECT * FROM trips WHERE company_id = "3"');
    console.log('\nTrips for company_id = "3" (string):');
    console.table(stringTrips);
    
    // Check companies table
    const [companies] = await db.execute('SELECT id, company_name FROM companies');
    console.log('\nCompanies:');
    console.table(companies);
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
})();
