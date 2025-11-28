require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createTestUsers() {
  console.log('🧪 Creating test users for Transport Company...');
  
  try {
    // Database connection
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'transport_company',
      port: 3306
    });
    
    console.log('✅ Connected to XAMPP MySQL database');
    
    // Test users data
    const testUsers = [
      // Company Users
      {
        username: 'swift_logistics',
        email: 'info@swiftlogistics.com',
        password: 'company123',
        role: 'company',
        is_approved: true,
        profile: {
          company_name: 'Swift Logistics Ltd',
          contact_person: 'John Manager',
          phone: '+972-50-1234567',
          address: '123 Business Street, Tel Aviv, Israel',
          description: 'Leading logistics company specializing in fast delivery services',
          logo_url: null,
          rating: 4.5,
          rating_count: 28
        }
      },
      {
        username: 'fast_transport',
        email: 'contact@fasttransport.co.il',
        password: 'company123',
        role: 'company',
        is_approved: true,
        profile: {
          company_name: 'Fast Transport Solutions',
          contact_person: 'Sarah Cohen',
          phone: '+972-52-7654321',
          address: '456 Industrial Zone, Haifa, Israel',
          description: 'Reliable freight transportation across Israel',
          logo_url: null,
          rating: 4.2,
          rating_count: 15
        }
      },
      {
        username: 'express_cargo',
        email: 'admin@expresscargo.com',
        password: 'company123',
        role: 'company',
        is_approved: false, // Pending approval
        profile: {
          company_name: 'Express Cargo Services',
          contact_person: 'David Levy',
          phone: '+972-54-9876543',
          address: '789 Commerce Blvd, Jerusalem, Israel',
          description: 'New express cargo delivery service',
          logo_url: null,
          rating: 0,
          rating_count: 0
        }
      },
      {
        username: 'mega_freight',
        email: 'office@megafreight.co.il',
        password: 'company123',
        role: 'company',
        is_approved: false, // Pending approval
        profile: {
          company_name: 'Mega Freight International',
          contact_person: 'Rachel Green',
          phone: '+972-58-1357924',
          address: '321 Port Road, Ashdod, Israel',
          description: 'International freight and shipping solutions',
          logo_url: null,
          rating: 0,
          rating_count: 0
        }
      },
      
      // Driver Users
      {
        username: 'driver_yoni',
        email: 'yoni.driver@gmail.com',
        password: 'driver123',
        role: 'driver',
        is_approved: true,
        profile: {
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
        username: 'driver_avi',
        email: 'avi.transport@yahoo.com',
        password: 'driver123',
        role: 'driver',
        is_approved: true,
        profile: {
          first_name: 'Avi',
          last_name: 'Rosenfeld',
          phone: '+972-52-2222222',
          license_number: 'DRV987654321',
          license_expiry: '2025-08-15',
          vehicle_type: 'Truck',
          vehicle_plate: '987-65-432',
          current_location: 'Haifa',
          available_from: '06:00:00',
          available_to: '20:00:00',
          rating: 4.6,
          rating_count: 35
        }
      },
      {
        username: 'driver_maya',
        email: 'maya.drives@hotmail.com',
        password: 'driver123',
        role: 'driver',
        is_approved: true,
        profile: {
          first_name: 'Maya',
          last_name: 'Mizrahi',
          phone: '+972-54-3333333',
          license_number: 'DRV456789123',
          license_expiry: '2027-03-20',
          vehicle_type: 'Van',
          vehicle_plate: '456-78-912',
          current_location: 'Jerusalem',
          available_from: '09:00:00',
          available_to: '17:00:00',
          rating: 4.9,
          rating_count: 18
        }
      },
      {
        username: 'driver_noam',
        email: 'noam.newdriver@gmail.com',
        password: 'driver123',
        role: 'driver',
        is_approved: false, // Pending approval
        profile: {
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
      },
      {
        username: 'driver_tal',
        email: 'tal.rookie@outlook.com',
        password: 'driver123',
        role: 'driver',
        is_approved: false, // Pending approval
        profile: {
          first_name: 'Tal',
          last_name: 'Katz',
          phone: '+972-50-5555555',
          license_number: 'DRV321654987',
          license_expiry: '2025-11-30',
          vehicle_type: 'Motorcycle',
          vehicle_plate: '321-65-498',
          current_location: 'Netanya',
          available_from: '10:00:00',
          available_to: '16:00:00',
          rating: 0,
          rating_count: 0
        }
      }
    ];
    
    console.log('👥 Creating test users...');
    
    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const [existingUsers] = await db.execute('SELECT id FROM users WHERE username = ? OR email = ?', [userData.username, userData.email]);
        
        if (existingUsers.length > 0) {
          console.log(`⚠️  User ${userData.username} already exists, skipping...`);
          continue;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Insert user
        const [userResult] = await db.execute(
          'INSERT INTO users (username, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
          [userData.username, userData.email, hashedPassword, userData.role, userData.is_approved]
        );
        
        const userId = userResult.insertId;
        
        // Insert profile based on role
        if (userData.role === 'company') {
          await db.execute(
            'INSERT INTO companies (user_id, company_name, contact_person, phone, address, description, logo_url, rating, rating_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              userId,
              userData.profile.company_name,
              userData.profile.contact_person,
              userData.profile.phone,
              userData.profile.address,
              userData.profile.description,
              userData.profile.logo_url,
              userData.profile.rating,
              userData.profile.rating_count
            ]
          );
        } else if (userData.role === 'driver') {
          await db.execute(
            'INSERT INTO drivers (user_id, first_name, last_name, phone, license_number, license_expiry, vehicle_type, vehicle_plate, current_location, available_from, available_to, rating, rating_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              userId,
              userData.profile.first_name,
              userData.profile.last_name,
              userData.profile.phone,
              userData.profile.license_number,
              userData.profile.license_expiry,
              userData.profile.vehicle_type,
              userData.profile.vehicle_plate,
              userData.profile.current_location,
              userData.profile.available_from,
              userData.profile.available_to,
              userData.profile.rating,
              userData.profile.rating_count
            ]
          );
        }
        
        const approvalStatus = userData.is_approved ? '✅ APPROVED' : '⏳ PENDING';
        console.log(`✅ Created ${userData.role}: ${userData.username} (${approvalStatus})`);
        
      } catch (error) {
        console.error(`❌ Error creating user ${userData.username}:`, error.message);
      }
    }
    
    // Display summary
    console.log('\n📊 Test Users Summary:');
    
    const [companyStats] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) as pending
      FROM users WHERE role = 'company'
    `);
    
    const [driverStats] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) as pending
      FROM users WHERE role = 'driver'
    `);
    
    console.log(`🏢 Companies: ${companyStats[0].total} total (${companyStats[0].approved} approved, ${companyStats[0].pending} pending)`);
    console.log(`🚛 Drivers: ${driverStats[0].total} total (${driverStats[0].approved} approved, ${driverStats[0].pending} pending)`);
    
    console.log('\n🔑 Test Login Credentials:');
    console.log('📧 Admin: username=admin, password=admin123');
    console.log('🏢 Company (Approved): username=swift_logistics, password=company123');
    console.log('🏢 Company (Pending): username=express_cargo, password=company123');
    console.log('🚛 Driver (Approved): username=driver_yoni, password=driver123');
    console.log('🚛 Driver (Pending): username=driver_noam, password=driver123');
    
    await db.end();
    console.log('\n🎉 Test users created successfully!');
    
  } catch (error) {
    console.error('❌ Failed to create test users:', error.message);
  }
}

createTestUsers();
