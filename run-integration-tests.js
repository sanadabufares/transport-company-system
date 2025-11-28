const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define test pattern
const INTEGRATION_TEST_PATTERN = '__tests__/integration/*.test.js';

// Ensure the reports directory exists
const reportsDir = path.join(__dirname, 'test-reports', 'integration');
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

// Main function to run integration tests
async function runIntegrationTests() {
  try {
    console.log('=== RUNNING INTEGRATION TESTS ===');
    
    // Step 1: Set up test database
    console.log('\n=== SETTING UP TEST DATABASE ===');
    await runCommand('npm', ['run', 'setup-test-db'], path.join(__dirname, 'server'));
    
    // Step 2: Run integration tests with Mocha
    console.log('\n=== RUNNING INTEGRATION TESTS WITH MOCHA ===');
    await runCommand('npx', ['mocha', INTEGRATION_TEST_PATTERN, '--timeout', '10000'], __dirname);
    
    // Step 3: Copy test reports
    console.log('\n=== COPYING TEST REPORTS ===');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    console.log('\n=== INTEGRATION TESTS COMPLETED SUCCESSFULLY ===');
    console.log(`Reports are available in the ${reportsDir} directory.`);
    
  } catch (error) {
    console.error('\n=== TEST EXECUTION FAILED ===');
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
runIntegrationTests();
