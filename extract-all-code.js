const fs = require('fs');
const path = require('path');
const officegen = require('officegen');

// Create a new Word document
const docx = officegen('docx');

// Function to read all files recursively in a directory
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      // Skip node_modules and other unnecessary directories
      if (!['node_modules', '.git', 'coverage', 'test-reports'].includes(file)) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      }
    } else {
      // Only include JavaScript/JSX files
      if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

// Function to extract functions from a file
function extractFunctionsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(__dirname, filePath);
    
    // Add file path as a heading
    const fileHeading = docx.createP();
    fileHeading.addText(`קובץ: ${relativePath}`, { bold: true, font_size: 14 });
    fileHeading.addLineBreak();
    fileHeading.addLineBreak();
    
    // Add the entire file content
    const contentParagraph = docx.createP();
    contentParagraph.addText('תוכן הקובץ:', { bold: true, font_size: 12 });
    contentParagraph.addLineBreak();
    
    // Create a code block with the file content
    const codeParagraph = docx.createP();
    codeParagraph.addText(content);
    codeParagraph.addLineBreak();
    codeParagraph.addLineBreak();
    
    // Add a separator
    const separator = docx.createP();
    separator.addText('-----------------------------------------------------------');
    separator.addLineBreak();
    separator.addLineBreak();
    
  } catch (error) {
    console.error(`Error processing file ${filePath}: ${error.message}`);
  }
}

// Main function to process all files
async function processAllFiles() {
  // Add a title
  const titleParagraph = docx.createP();
  titleParagraph.addText('קודים מלאים של פרויקט Transport Company', { bold: true, font_size: 18 });
  titleParagraph.addLineBreak();
  titleParagraph.addLineBreak();
  
  // Process server files
  const serverSection = docx.createP();
  serverSection.addText('קודים בצד השרת (Server)', { bold: true, underline: true, font_size: 16 });
  serverSection.addLineBreak();
  serverSection.addLineBreak();
  
  // Get all server files
  const serverPath = path.join(__dirname, 'server');
  if (fs.existsSync(serverPath)) {
    const serverFiles = getAllFiles(serverPath);
    
    // Process models first
    const modelFiles = serverFiles.filter(file => file.includes('models'));
    modelFiles.forEach(file => extractFunctionsFromFile(file));
    
    // Process controllers
    const controllerFiles = serverFiles.filter(file => file.includes('controllers'));
    controllerFiles.forEach(file => extractFunctionsFromFile(file));
    
    // Process routes
    const routeFiles = serverFiles.filter(file => file.includes('routes'));
    routeFiles.forEach(file => extractFunctionsFromFile(file));
    
    // Process middleware
    const middlewareFiles = serverFiles.filter(file => file.includes('middleware'));
    middlewareFiles.forEach(file => extractFunctionsFromFile(file));
    
    // Process other server files
    const otherServerFiles = serverFiles.filter(file => 
      !file.includes('models') && 
      !file.includes('controllers') && 
      !file.includes('routes') && 
      !file.includes('middleware') &&
      !file.includes('__tests__')
    );
    otherServerFiles.forEach(file => extractFunctionsFromFile(file));
  }
  
  // Process client files
  const clientSection = docx.createP();
  clientSection.addText('קודים בצד הלקוח (Client)', { bold: true, underline: true, font_size: 16 });
  clientSection.addLineBreak();
  clientSection.addLineBreak();
  
  // Get all client files
  const clientPath = path.join(__dirname, 'client', 'src');
  if (fs.existsSync(clientPath)) {
    const clientFiles = getAllFiles(clientPath);
    
    // Process components
    const componentFiles = clientFiles.filter(file => file.includes('components'));
    componentFiles.forEach(file => extractFunctionsFromFile(file));
    
    // Process context
    const contextFiles = clientFiles.filter(file => file.includes('context'));
    contextFiles.forEach(file => extractFunctionsFromFile(file));
    
    // Process utils
    const utilFiles = clientFiles.filter(file => file.includes('utils'));
    utilFiles.forEach(file => extractFunctionsFromFile(file));
    
    // Process other client files
    const otherClientFiles = clientFiles.filter(file => 
      !file.includes('components') && 
      !file.includes('context') && 
      !file.includes('utils') &&
      !file.includes('__tests__')
    );
    otherClientFiles.forEach(file => extractFunctionsFromFile(file));
  }
  
  // Create a write stream to save the document
  const out = fs.createWriteStream(path.join(__dirname, 'full-project-code.docx'));
  
  // Save the document
  docx.generate(out);
  
  console.log('Word document with all code created successfully: full-project-code.docx');
}

// Run the main function
processAllFiles();
