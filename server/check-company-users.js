const db = require('./config/db');

async function checkCompanyUsers() {
  try {
    console.log('🔍 Checking existing company users...\n');
    
    const [users] = await db.execute(
      'SELECT u.id, u.email, u.role, c.company_name, c.contact_person FROM users u LEFT JOIN companies c ON u.id = c.user_id WHERE u.role = "company"'
    );
    
    if (users.length === 0) {
      console.log('❌ No company users found in database');
      console.log('Creating a test company user...\n');
      
      // Create test company user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Insert user
      const [userResult] = await db.execute(
        'INSERT INTO users (email, password, role, created_at) VALUES (?, ?, ?, NOW())',
        ['company@test.com', hashedPassword, 'company']
      );
      
      // Insert company profile
      await db.execute(
        'INSERT INTO companies (user_id, company_name, contact_person, phone, address, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [userResult.insertId, 'Test Company', 'John Doe', '+1234567890', '123 Test Street']
      );
      
      console.log('✅ Test company user created successfully');
      console.log('📧 Email: company@test.com');
      console.log('🔑 Password: password123');
    } else {
      console.log('✅ Found company users:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Company: ${user.company_name || 'N/A'}`);
        console.log(`   Contact: ${user.contact_person || 'N/A'}\n`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkCompanyUsers();
