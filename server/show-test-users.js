const mysql = require('mysql2/promise');
require('dotenv').config();

async function showTestUsers() {
  const db = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'transport_company'
  });
  
  console.log('🎭 TEST USERS OVERVIEW');
  console.log('='.repeat(50));
  
  // Show companies
  const [companies] = await db.execute(`
    SELECT u.username, u.email, u.is_approved, c.company_name, c.contact_person, c.rating 
    FROM users u 
    JOIN companies c ON u.id = c.user_id 
    WHERE u.role = 'company'
    ORDER BY u.is_approved DESC, u.username
  `);
  
  console.log('\n🏢 COMPANY ACCOUNTS:');
  companies.forEach(comp => {
    const status = comp.is_approved ? '✅ APPROVED' : '⏳ PENDING';
    console.log(`   ${comp.username} | ${comp.company_name} | ${status} | Rating: ${comp.rating}⭐`);
  });
  
  // Show drivers
  const [drivers] = await db.execute(`
    SELECT u.username, u.email, u.is_approved, d.first_name, d.last_name, d.vehicle_type, d.rating
    FROM users u 
    JOIN drivers d ON u.id = d.user_id 
    WHERE u.role = 'driver'
    ORDER BY u.is_approved DESC, u.username
  `);
  
  console.log('\n🚛 DRIVER ACCOUNTS:');
  drivers.forEach(driver => {
    const status = driver.is_approved ? '✅ APPROVED' : '⏳ PENDING';
    const fullName = `${driver.first_name} ${driver.last_name}`;
    console.log(`   ${driver.username} | ${fullName} | ${driver.vehicle_type} | ${status} | Rating: ${driver.rating}⭐`);
  });
  
  console.log('\n🔑 QUICK TEST LOGINS:');
  console.log('   👤 Admin: admin / admin123');
  console.log('   🏢 Company: swift_logistics / company123 (approved)');
  console.log('   🏢 Company: express_cargo / company123 (pending)');
  console.log('   🚛 Driver: driver_yoni / driver123 (approved)');
  console.log('   🚛 Driver: driver_noam / driver123 (pending)');
  
  await db.end();
}

showTestUsers();
