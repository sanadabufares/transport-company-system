const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Conversion rules for Jest to Mocha
const conversionRules = [
  // Mock functions
  { from: /jest\.fn\(\)/g, to: 'sinon.stub()' },
  { from: /jest\.fn\((.*?)\)/g, to: 'sinon.stub().callsFake($1)' },
  { from: /jest\.spyOn\((.*?), ['"](.+?)['"]\)/g, to: 'sinon.spy($1, "$2")' },
  { from: /jest\.mock\((.*?)\)/g, to: '// Converted from jest.mock - use sinon.stub instead\n// $1' },
  
  // Assertions
  { from: /expect\((.*?)\)\.toBe\((.*?)\)/g, to: 'expect($1).to.equal($2)' },
  { from: /expect\((.*?)\)\.toEqual\((.*?)\)/g, to: 'expect($1).to.deep.equal($2)' },
  { from: /expect\((.*?)\)\.toBeNull\(\)/g, to: 'expect($1).to.be.null' },
  { from: /expect\((.*?)\)\.toBeDefined\(\)/g, to: 'expect($1).to.not.be.undefined' },
  { from: /expect\((.*?)\)\.toBeUndefined\(\)/g, to: 'expect($1).to.be.undefined' },
  { from: /expect\((.*?)\)\.toBeTruthy\(\)/g, to: 'expect($1).to.be.ok' },
  { from: /expect\((.*?)\)\.toBeFalsy\(\)/g, to: 'expect($1).to.not.be.ok' },
  { from: /expect\((.*?)\)\.toContain\((.*?)\)/g, to: 'expect($1).to.include($2)' },
  { from: /expect\((.*?)\)\.toHaveLength\((.*?)\)/g, to: 'expect($1).to.have.lengthOf($2)' },
  { from: /expect\((.*?)\)\.toHaveBeenCalled\(\)/g, to: 'expect($1.called).to.be.true' },
  { from: /expect\((.*?)\)\.toHaveBeenCalledWith\((.*?)\)/g, to: 'expect($1.calledWith($2)).to.be.true' },
  { from: /expect\((.*?)\)\.toThrow\((.*?)\)/g, to: 'expect($1).to.throw($2)' },
  { from: /expect\((.*?)\)\.not\.toBe\((.*?)\)/g, to: 'expect($1).to.not.equal($2)' },
  { from: /expect\((.*?)\)\.not\.toEqual\((.*?)\)/g, to: 'expect($1).to.not.deep.equal($2)' },
  
  // Mock implementations
  { from: /mockResolvedValueOnce\((.*?)\)/g, to: 'resolves($1)' },
  { from: /mockRejectedValueOnce\((.*?)\)/g, to: 'rejects($1)' },
  { from: /mockReturnValueOnce\((.*?)\)/g, to: 'onFirstCall().returns($1)' },
  { from: /mockReturnValue\((.*?)\)/g, to: 'returns($1)' },
  { from: /mockImplementation\((.*?)\)/g, to: 'callsFake($1)' },
  
  // Lifecycle hooks
  { from: /beforeAll\(/g, to: 'before(' },
  { from: /afterAll\(/g, to: 'after(' },
  
  // Clear mocks
  { from: /jest\.clearAllMocks\(\)/g, to: 'sinon.restore()' },
  { from: /jest\.resetAllMocks\(\)/g, to: 'sinon.reset()' },
  { from: /jest\.restoreAllMocks\(\)/g, to: 'sinon.restore()' },
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
    
    // Create a new file with .mocha.test.js extension
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, '.test.js');
    const newFilePath = path.join(dir, `${baseName}.mocha.test.js`);
    
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
    const testDir = path.join(__dirname, '__tests__');
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
