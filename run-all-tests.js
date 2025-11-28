const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define test frameworks
const SERVER_TEST_FRAMEWORK = 'Mocha';
const CLIENT_TEST_FRAMEWORK = 'Vitest';

// Define test file patterns
const SERVER_TEST_PATTERN = '__tests__/simple.mocha.test.js __tests__/models/company.mocha.test.js __tests__/controllers/driver.mocha.test.js __tests__/routes/admin.mocha.test.js __tests__/routes/auth.mocha.test.js __tests__/routes/driver.mocha.test.js';
const CLIENT_TEST_PATTERN = 'src/__tests__/simple.test.js src/__tests__/simple.vitest.test.jsx src/__tests__/components/Header.vitest.test.jsx src/__tests__/components/auth/Login.vitest.test.jsx src/__tests__/components/driver/Dashboard.vitest.test.jsx src/__tests__/components/company/Dashboard.vitest.test.jsx src/__tests__/components/common/PrivateRoute.vitest.test.jsx src/__tests__/context/AuthContext.vitest.test.jsx src/__tests__/utils/vitestUtils.vitest.test.jsx';

// Ensure the reports directory exists
const reportsDir = path.join(__dirname, 'test-reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Function to run a command in a specific directory
function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`Running "${command} ${args.join(' ')}" in ${cwd}`);
    
    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

// Main function to run all tests
async function runAllTests() {
  try {
    console.log('=== RUNNING ALL TESTS ===');
    console.log(`Server tests using ${SERVER_TEST_FRAMEWORK}, Client tests using ${CLIENT_TEST_FRAMEWORK}`);
    
    // Step 1: Set up test database
    console.log('\n=== SETTING UP TEST DATABASE ===');
    await runCommand('npm', ['run', 'setup-test-db'], path.join(__dirname, 'server'));
    
    // Step 2: Run server tests with coverage
    console.log(`\n=== RUNNING SERVER TESTS WITH ${SERVER_TEST_FRAMEWORK} ===`);
    await runCommand('npm', ['run', 'test:coverage'], path.join(__dirname, 'server'));
    
    // Step 3: Run client tests with coverage
    console.log(`\n=== RUNNING CLIENT TESTS WITH ${CLIENT_TEST_FRAMEWORK} ===`);
    await runCommand('npm', ['run', 'test:coverage'], path.join(__dirname, 'client'));
    
    // Step 4: Copy coverage reports to the reports directory
    console.log('\n=== COPYING COVERAGE REPORTS ===');
    
    // Create directories if they don't exist
    if (!fs.existsSync(path.join(reportsDir, 'server'))) {
      fs.mkdirSync(path.join(reportsDir, 'server'), { recursive: true });
    }
    
    if (!fs.existsSync(path.join(reportsDir, 'client'))) {
      fs.mkdirSync(path.join(reportsDir, 'client'), { recursive: true });
    }
    
    // Copy server coverage report
    if (fs.existsSync(path.join(__dirname, 'server', 'coverage'))) {
      await runCommand('xcopy', [
        path.join(__dirname, 'server', 'coverage').replace(/\//g, '\\') + '\\*',
        path.join(reportsDir, 'server').replace(/\//g, '\\'),
        '/E', '/I', '/Y'
      ], __dirname);
    }
    
    // Copy client coverage report
    if (fs.existsSync(path.join(__dirname, 'client', 'coverage'))) {
      await runCommand('xcopy', [
        path.join(__dirname, 'client', 'coverage').replace(/\//g, '\\') + '\\*',
        path.join(reportsDir, 'client').replace(/\//g, '\\'),
        '/E', '/I', '/Y'
      ], __dirname);
    }
    
    console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
    console.log(`Coverage reports are available in the ${reportsDir} directory.`);
    console.log(`Server tests ran with ${SERVER_TEST_FRAMEWORK}, Client tests ran with ${CLIENT_TEST_FRAMEWORK}.`);
    
  } catch (error) {
    console.error('\n=== TEST EXECUTION FAILED ===');
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
runAllTests();
