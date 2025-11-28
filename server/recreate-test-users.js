const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function recreateTestUsers() {
  console.log('🔄 Recreating test users...');
  
  const db = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'transport_company'
  });
  
  try {
    // Clear existing test data
    await db.execute('DELETE FROM companies');
    await db.execute('DELETE FROM drivers');
    await db.execute('DELETE FROM users WHERE role != "admin"');
    console.log('✅ Cleared existing test data');
    
    // Create company users
    const companyUsers = [
      {
        username: 'swift_logistics',
        email: 'info@swiftlogistics.com',
        password: await bcrypt.hash('company123', 10),
        role: 'company',
        is_approved: 1,
        company: {
          company_name: 'Swift Logistics Ltd',
          contact_person: 'John Manager',
          phone: '+972-50-1234567',
          address: '123 Business Street, Tel Aviv',
          description: 'Fast delivery services',
          rating: 4.5,
          rating_count: 28
        }
      },
      {
        username: 'express_cargo',
        email: 'admin@expresscargo.com',
        password: await bcrypt.hash('company123', 10),
        role: 'company',
        is_approved: 0,
        company: {
          company_name: 'Express Cargo Services',
          contact_person: 'David Levy',
          phone: '+972-54-9876543',
          address: '789 Commerce Blvd, Jerusalem',
          description: 'Express cargo delivery',
          rating: 0,
          rating_count: 0
        }
      }
    ];
    
    // Create driver users
    const driverUsers = [
      {
        username: 'driver_yoni',
        email: 'yoni.driver@gmail.com',
        password: await bcrypt.hash('driver123', 10),
        role: 'driver',
        is_approved: 1,
        driver: {
          first_name: 'Yoni',
          last_name: 'Goldberg',
          phone: '+972-50-1111111',
          license_number: 'DRV123456789',
          license_expiry: '2026-12-31',
          vehicle_type: 'Van',
          vehicle_plate: '123-45-678',
          current_location: 'Tel Aviv',
          available_from: '08:00:00',
          available_to: '18:00:00',
          rating: 4.8,
          rating_count: 42
        }
      },
      {
        username: 'driver_noam',
        email: 'noam.newdriver@gmail.com',
        password: await bcrypt.hash('driver123', 10),
        role: 'driver',
        is_approved: 0,
        driver: {
          first_name: 'Noam',
          last_name: 'Ben-David',
          phone: '+972-58-4444444',
          license_number: 'DRV789123456',
          license_expiry: '2026-01-10',
          vehicle_type: 'Van',
          vehicle_plate: '789-12-345',
          current_location: 'Beer Sheva',
          available_from: '07:00:00',
          available_to: '19:00:00',
          rating: 0,
          rating_count: 0
        }
      }
    ];
    
    // Insert company users
    for (const user of companyUsers) {
      const [result] = await db.execute(
        'INSERT INTO users (username, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
        [user.username, user.email, user.password, user.role, user.is_approved]
      );
      
      await db.execute(
        'INSERT INTO companies (user_id, company_name, contact_person, phone, address, description, rating, rating_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [result.insertId, user.company.company_name, user.company.contact_person, user.company.phone, user.company.address, user.company.description, user.company.rating, user.company.rating_count]
      );
      
      const status = user.is_approved ? 'APPROVED' : 'PENDING';
      console.log(`✅ Created company: ${user.username} (${status})`);
    }
    
    // Insert driver users
    for (const user of driverUsers) {
      const [result] = await db.execute(
        'INSERT INTO users (username, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
        [user.username, user.email, user.password, user.role, user.is_approved]
      );
      
      await db.execute(
        'INSERT INTO drivers (user_id, first_name, last_name, phone, license_number, license_expiry, vehicle_type, vehicle_plate, current_location, available_from, available_to, rating, rating_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [result.insertId, user.driver.first_name, user.driver.last_name, user.driver.phone, user.driver.license_number, user.driver.license_expiry, user.driver.vehicle_type, user.driver.vehicle_plate, user.driver.current_location, user.driver.available_from, user.driver.available_to, user.driver.rating, user.driver.rating_count]
      );
      
      const status = user.is_approved ? 'APPROVED' : 'PENDING';
      console.log(`✅ Created driver: ${user.username} (${status})`);
    }
    
    console.log('\n🎉 Test users created successfully!');
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('👤 Admin: admin / admin123');
    console.log('🏢 Company (Approved): swift_logistics / company123');
    console.log('🏢 Company (Pending): express_cargo / company123');
    console.log('🚛 Driver (Approved): driver_yoni / driver123');
    console.log('🚛 Driver (Pending): driver_noam / driver123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

recreateTestUsers();
