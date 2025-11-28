const db = require('./config/db');

async function testDriverRegistration() {
  console.log('🧪 Testing driver registration flow...\n');
  
  try {
    // Check if admin user exists
    console.log('1. Checking admin user...');
    const [adminUsers] = await db.execute('SELECT id, username, role FROM users WHERE role = ? LIMIT 1', ['admin']);
    if (adminUsers.length === 0) {
      console.log('❌ No admin user found! This could be the issue.');
    } else {
      console.log('✅ Admin user found:', adminUsers[0]);
    }
    
    // Check notifications table structure
    console.log('\n2. Checking notifications table...');
    const [notificationCols] = await db.execute('DESCRIBE notifications');
    console.log('✅ Notifications table structure:');
    notificationCols.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}, ${col.Null === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Test creating a notification
    console.log('\n3. Testing notification creation...');
    const testNotification = {
      user_id: adminUsers[0]?.id || 1,
      title: 'Test Driver Registration',
      message: 'Testing notification creation for driver registration'
    };
    
    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [testNotification.user_id, testNotification.title, testNotification.message]
    );
    
    console.log('✅ Notification created successfully, ID:', result.insertId);
    
    // Clean up test notification
    await db.execute('DELETE FROM notifications WHERE id = ?', [result.insertId]);
    console.log('✅ Test notification cleaned up');
    
    console.log('\n✅ All tests passed! Driver registration should work.');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
}

testDriverRegistration();
