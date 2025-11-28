const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Conversion rules for Jest to Vitest
const conversionRules = [
  // Import statements
  { 
    from: /import (.*?) from ['"]@testing-library\/react['"];/g, 
    to: 'import { describe, it, expect, beforeEach, afterEach, vi } from \'vitest\';\nimport $1 from \'@testing-library/react\';' 
  },
  { 
    from: /import (.*?) from ['"]@testing-library\/react-hooks['"];/g, 
    to: 'import { describe, it, expect, beforeEach, afterEach, vi } from \'vitest\';\nimport $1 from \'@testing-library/react-hooks\';' 
  },
  
  // Mock functions
  { from: /jest\.fn\(\)/g, to: 'vi.fn()' },
  { from: /jest\.fn\((.*?)\)/g, to: 'vi.fn($1)' },
  { from: /jest\.spyOn\((.*?), ['"](.+?)['"]\)/g, to: 'vi.spyOn($1, "$2")' },
  { from: /jest\.mock\((.*?)\)/g, to: 'vi.mock($1)' },
  
  // Assertions
  { from: /\.toBeInTheDocument\(\)/g, to: '.toBeDefined()' },
  { from: /\.toHaveClass\((.*?)\)/g, to: '.className.includes($1)' },
  
  // Clear mocks
  { from: /jest\.clearAllMocks\(\)/g, to: 'vi.clearAllMocks()' },
  { from: /jest\.resetAllMocks\(\)/g, to: 'vi.resetAllMocks()' },
  { from: /jest\.restoreAllMocks\(\)/g, to: 'vi.restoreAllMocks()' },
  
  // Mock implementations
  { from: /mockResolvedValueOnce\((.*?)\)/g, to: 'mockResolvedValueOnce($1)' },
  { from: /mockRejectedValueOnce\((.*?)\)/g, to: 'mockRejectedValueOnce($1)' },
  { from: /mockReturnValueOnce\((.*?)\)/g, to: 'mockReturnValueOnce($1)' },
  { from: /mockReturnValue\((.*?)\)/g, to: 'mockReturnValue($1)' },
  { from: /mockImplementation\((.*?)\)/g, to: 'mockImplementation($1)' },
];

// Function to convert a file
async function convertFile(filePath) {
  try {
    console.log(`Converting ${filePath}...`);
    let content = await readFile(filePath, 'utf8');
    
    // Apply all conversion rules
    for (const rule of conversionRules) {
      content = content.replace(rule.from, rule.to);
    }
    
    // Create a new file with .vitest.test.jsx extension
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, '.test.js');
    const newFilePath = path.join(dir, `${baseName}.vitest.test.jsx`);
    
    await writeFile(newFilePath, content, 'utf8');
    console.log(`Created ${newFilePath}`);
    
    return newFilePath;
  } catch (error) {
    console.error(`Error converting ${filePath}:`, error);
    return null;
  }
}

// Function to recursively find all test files
async function findTestFiles(dir) {
  const files = await readdir(dir);
  const testFiles = [];
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);
    
    if (stats.isDirectory()) {
      const nestedFiles = await findTestFiles(filePath);
      testFiles.push(...nestedFiles);
    } else if (file.endsWith('.test.js') && !file.includes('.mocha.') && !file.includes('.vitest.')) {
      testFiles.push(filePath);
    }
  }
  
  return testFiles;
}

// Main function to convert all tests
async function convertAllTests() {
  try {
    const testDir = path.join(__dirname, 'src', '__tests__');
    const testFiles = await findTestFiles(testDir);
    
    console.log(`Found ${testFiles.length} test files to convert.`);
    
    for (const file of testFiles) {
      await convertFile(file);
    }
    
    console.log('Conversion complete!');
  } catch (error) {
    console.error('Error converting tests:', error);
  }
}

// Run the conversion
convertAllTests();
