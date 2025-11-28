const http = require('http');

function checkServer(host, port, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: port,
      path: '/',
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      console.log(`✅ ${name} is running on ${host}:${port}`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`❌ ${name} is NOT running on ${host}:${port} - ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`⏰ ${name} timed out on ${host}:${port}`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function checkAllServers() {
  console.log('🔍 Checking server status...\n');
  
  const backendRunning = await checkServer('localhost', 5000, 'Backend Server');
  const frontendRunning = await checkServer('localhost', 3000, 'Frontend Client');
  
  console.log('\n📊 Status Summary:');
  console.log(`Backend (Port 5000): ${backendRunning ? '✅ RUNNING' : '❌ NOT RUNNING'}`);
  console.log(`Frontend (Port 3000): ${frontendRunning ? '✅ RUNNING' : '❌ NOT RUNNING'}`);
  
  if (backendRunning && frontendRunning) {
    console.log('\n🎉 Both servers are running! You can access:');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Backend API: http://localhost:5000/api');
  } else {
    console.log('\n⚠️  One or more servers are not running.');
    console.log('   Please start them manually or use start-both-servers.bat');
  }
}

checkAllServers();
