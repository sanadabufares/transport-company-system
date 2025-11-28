const fs = require('fs');
const path = require('path');
const officegen = require('officegen');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// Create a new Word document
const docx = officegen('docx');

// Function to extract functions from a file
function extractFunctionsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(__dirname, filePath);
    
    // Skip test files
    if (relativePath.includes('__tests__') || relativePath.includes('.test.')) {
      return;
    }
    
    console.log(`Processing: ${relativePath}`);
    
    // Try to parse the file
    let ast;
    try {
      ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });
    } catch (parseError) {
      console.error(`Error parsing ${relativePath}: ${parseError.message}`);
      return;
    }
    
    // Add file path as a heading
    const fileHeading = docx.createP();
    fileHeading.addText(`קובץ: ${relativePath}`, { bold: true, font_size: 14 });
    fileHeading.addLineBreak();
    fileHeading.addLineBreak();
    
    // Extract functions
    const functions = [];
    
    traverse(ast, {
      FunctionDeclaration(path) {
        const name = path.node.id ? path.node.id.name : 'anonymous';
        const start = path.node.loc.start.line;
        const end = path.node.loc.end.line;
        const code = content.split('\\n').slice(start - 1, end).join('\\n');
        
        functions.push({
          name,
          type: 'Function Declaration',
          code: content.substring(
            content.indexOf('function', path.node.start), 
            path.node.end
          )
        });
      },
      
      ArrowFunctionExpression(path) {
        if (path.parent.type === 'VariableDeclarator') {
          const name = path.parent.id.name;
          functions.push({
            name,
            type: 'Arrow Function',
            code: content.substring(
              content.lastIndexOf('const', path.parent.start), 
              path.parent.end + 1
            )
          });
        }
      },
      
      ClassMethod(path) {
        const name = path.node.key.name;
        let className = '';
        
        if (path.findParent(p => p.isClassDeclaration())) {
          className = path.findParent(p => p.isClassDeclaration()).node.id.name;
        }
        
        functions.push({
          name: `${className}.${name}`,
          type: 'Class Method',
          code: content.substring(path.node.start, path.node.end)
        });
      },
      
      ObjectMethod(path) {
        const name = path.node.key.name;
        functions.push({
          name,
          type: 'Object Method',
          code: content.substring(path.node.start, path.node.end)
        });
      }
    });
    
    // Add functions to the document
    functions.forEach(func => {
      // Add function name and type
      const funcHeading = docx.createP();
      funcHeading.addText(`פונקציה: ${func.name} (${func.type})`, { bold: true, font_size: 12 });
      funcHeading.addLineBreak();
      
      // Add explanation in Hebrew
      const explanation = getExplanationForFunction(func.name, relativePath);
      const explanationPara = docx.createP();
      explanationPara.addText(`הסבר: ${explanation}`, { italic: true });
      explanationPara.addLineBreak();
      explanationPara.addLineBreak();
      
      // Add function code
      const codePara = docx.createP();
      codePara.addText(func.code);
      codePara.addLineBreak();
      codePara.addLineBreak();
      
      // Add separator
      const separator = docx.createP();
      separator.addText('-----------------------------------------------------------');
      separator.addLineBreak();
      separator.addLineBreak();
    });
    
  } catch (error) {
    console.error(`Error processing file ${filePath}: ${error.message}`);
  }
}

// Function to provide Hebrew explanations for functions
function getExplanationForFunction(funcName, filePath) {
  // Server-side functions
  if (filePath.includes('server/models/user')) {
    if (funcName === 'findById') return 'מחפשת משתמש לפי מזהה ומחזירה את פרטיו';
    if (funcName === 'findByUsername') return 'מחפשת משתמש לפי שם משתמש ומחזירה את פרטיו';
    if (funcName === 'create') return 'יוצרת משתמש חדש במערכת עם הפרטים שהתקבלו';
    if (funcName === 'update') return 'מעדכנת פרטי משתמש קיים במערכת';
    if (funcName === 'updatePassword') return 'מעדכנת את סיסמת המשתמש לאחר אימות הסיסמה הנוכחית';
    if (funcName === 'delete') return 'מוחקת משתמש מהמערכת לפי מזהה';
  }
  
  if (filePath.includes('server/models/driver')) {
    if (funcName === 'findByUserId') return 'מחפשת פרופיל נהג לפי מזהה משתמש';
    if (funcName === 'findById') return 'מחפשת פרופיל נהג לפי מזהה הפרופיל';
    if (funcName === 'create') return 'יוצרת פרופיל נהג חדש במערכת';
    if (funcName === 'update') return 'מעדכנת פרטי פרופיל נהג קיים';
    if (funcName === 'updateAvailability') return 'מעדכנת את זמינות הנהג ומיקומו הנוכחי';
    if (funcName === 'hasTripConflict') return 'בודקת אם יש התנגשות בין נסיעה חדשה לנסיעות קיימות של הנהג';
  }
  
  if (filePath.includes('server/models/company')) {
    if (funcName === 'findByUserId') return 'מחפשת פרופיל חברה לפי מזהה משתמש';
    if (funcName === 'findById') return 'מחפשת פרופיל חברה לפי מזהה הפרופיל';
    if (funcName === 'create') return 'יוצרת פרופיל חברה חדש במערכת';
    if (funcName === 'update') return 'מעדכנת פרטי פרופיל חברה קיים';
  }
  
  if (filePath.includes('server/models/trip')) {
    if (funcName === 'create') return 'יוצרת נסיעה חדשה במערכת';
    if (funcName === 'findById') return 'מחפשת נסיעה לפי מזהה';
    if (funcName === 'findByCompanyId') return 'מחפשת נסיעות השייכות לחברה מסוימת';
    if (funcName === 'findByDriverId') return 'מחפשת נסיעות השייכות לנהג מסוים';
    if (funcName === 'update') return 'מעדכנת פרטי נסיעה קיימת';
    if (funcName === 'delete') return 'מוחקת נסיעה מהמערכת';
    if (funcName === 'assignDriver') return 'משייכת נהג לנסיעה ומעדכנת את סטטוס הנסיעה';
    if (funcName === 'unassignDriver') return 'מבטלת שיוך נהג לנסיעה ומעדכנת את סטטוס הנסיעה';
    if (funcName === 'updateStatus') return 'מעדכנת את סטטוס הנסיעה (ממתינה, משויכת, פעילה, הושלמה)';
    if (funcName === 'getAvailableDriversForTrip') return 'מחזירה רשימת נהגים זמינים לנסיעה מסוימת';
    if (funcName === 'getAvailableTripsForDriver') return 'מחזירה רשימת נסיעות זמינות לנהג מסוים';
  }
  
  if (filePath.includes('server/controllers/auth')) {
    if (funcName === 'register') return 'מטפלת ברישום משתמש חדש למערכת';
    if (funcName === 'login') return 'מטפלת בהתחברות משתמש למערכת ויצירת טוקן JWT';
    if (funcName === 'getMe') return 'מחזירה את פרטי המשתמש המחובר לפי הטוקן';
    if (funcName === 'updatePassword') return 'מטפלת בעדכון סיסמת משתמש';
  }
  
  if (filePath.includes('server/controllers/driver')) {
    if (funcName === 'getProfile') return 'מחזירה את פרופיל הנהג המחובר';
    if (funcName === 'updateProfile') return 'מעדכנת את פרטי פרופיל הנהג';
    if (funcName === 'updateAvailability') return 'מעדכנת את זמינות הנהג ומיקומו';
    if (funcName === 'getDriverTrips') return 'מחזירה את הנסיעות של הנהג המחובר';
    if (funcName === 'getAvailableTrips') return 'מחזירה נסיעות זמינות לנהג המחובר';
    if (funcName === 'sendTripRequest') return 'שולחת בקשה לנסיעה מנהג לחברה';
  }
  
  if (filePath.includes('server/controllers/company')) {
    if (funcName === 'getProfile') return 'מחזירה את פרופיל החברה המחוברת';
    if (funcName === 'updateProfile') return 'מעדכנת את פרטי פרופיל החברה';
    if (funcName === 'createTrip') return 'יוצרת נסיעה חדשה עבור החברה';
    if (funcName === 'getTrips') return 'מחזירה את הנסיעות של החברה המחוברת';
    if (funcName === 'getTripById') return 'מחזירה נסיעה ספציפית לפי מזהה';
    if (funcName === 'updateTrip') return 'מעדכנת פרטי נסיעה קיימת';
    if (funcName === 'deleteTrip') return 'מוחקת נסיעה מהמערכת';
    if (funcName === 'getAvailableDrivers') return 'מחזירה נהגים זמינים לנסיעה מסוימת';
  }
  
  if (filePath.includes('server/controllers/trip')) {
    if (funcName === 'getTripById') return 'מחזירה נסיעה לפי מזהה';
    if (funcName === 'createTrip') return 'יוצרת נסיעה חדשה במערכת';
    if (funcName === 'updateTrip') return 'מעדכנת פרטי נסיעה קיימת';
    if (funcName === 'deleteTrip') return 'מוחקת נסיעה מהמערכת';
    if (funcName === 'getCompanyTrips') return 'מחזירה נסיעות של חברה מסוימת';
    if (funcName === 'getDriverTrips') return 'מחזירה נסיעות של נהג מסוים';
    if (funcName === 'startTrip') return 'מעדכנת סטטוס נסיעה להתחלת נסיעה';
    if (funcName === 'completeTrip') return 'מעדכנת סטטוס נסיעה לסיום נסיעה';
  }
  
  // Client-side functions
  if (filePath.includes('client/src/components/auth/Login')) {
    if (funcName === 'Login') return 'רכיב טופס התחברות למערכת';
    if (funcName === 'handleSubmit') return 'מטפלת בשליחת טופס התחברות';
  }
  
  if (filePath.includes('client/src/components/company/Dashboard')) {
    if (funcName === 'Dashboard') return 'רכיב לוח בקרה לחברה המציג סטטיסטיקות ונתונים';
    if (funcName === 'fetchDashboardData') return 'מביאה נתונים עבור לוח הבקרה של החברה';
    if (funcName === 'formatDate') return 'מפרמטת תאריך לתצוגה נוחה';
  }
  
  if (filePath.includes('client/src/components/driver/Dashboard')) {
    if (funcName === 'Dashboard') return 'רכיב לוח בקרה לנהג המציג סטטיסטיקות ונתונים';
    if (funcName === 'fetchDashboardData') return 'מביאה נתונים עבור לוח הבקרה של הנהג';
    if (funcName === 'startPolling') return 'מתחילה בדיקה תקופתית של התראות חדשות';
  }
  
  if (filePath.includes('client/src/context/AuthContext')) {
    if (funcName === 'AuthProvider') return 'ספק הקשר לניהול מצב אימות משתמש במערכת';
    if (funcName === 'login') return 'מטפלת בהתחברות משתמש ושמירת הטוקן';
    if (funcName === 'logout') return 'מטפלת בהתנתקות משתמש וניקוי הטוקן';
    if (funcName === 'registerCompany') return 'מטפלת ברישום חברה חדשה למערכת';
    if (funcName === 'registerDriver') return 'מטפלת ברישום נהג חדש למערכת';
  }
  
  // Default explanation if no specific one is found
  return 'פונקציה זו מטפלת בלוגיקה הקשורה ל' + funcName;
}

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

// Main function to process all files
async function processAllFiles() {
  // Add a title
  const titleParagraph = docx.createP();
  titleParagraph.addText('פונקציות בפרויקט Transport Company עם הסברים', { bold: true, font_size: 18 });
  titleParagraph.addLineBreak();
  titleParagraph.addLineBreak();
  
  // Process server files
  const serverSection = docx.createP();
  serverSection.addText('פונקציות בצד השרת (Server)', { bold: true, underline: true, font_size: 16 });
  serverSection.addLineBreak();
  serverSection.addLineBreak();
  
  // Get all server files
  const serverPath = path.join(__dirname, 'server');
  if (fs.existsSync(serverPath)) {
    // Process models first
    const modelFiles = getAllFiles(serverPath).filter(file => file.includes('models') && !file.includes('__tests__'));
    modelFiles.forEach(file => extractFunctionsFromFile(file));
    
    // Process controllers
    const controllerFiles = getAllFiles(serverPath).filter(file => file.includes('controllers') && !file.includes('__tests__'));
    controllerFiles.forEach(file => extractFunctionsFromFile(file));
    
    // Process routes
    const routeFiles = getAllFiles(serverPath).filter(file => file.includes('routes') && !file.includes('__tests__'));
    routeFiles.forEach(file => extractFunctionsFromFile(file));
    
    // Process middleware
    const middlewareFiles = getAllFiles(serverPath).filter(file => file.includes('middleware') && !file.includes('__tests__'));
    middlewareFiles.forEach(file => extractFunctionsFromFile(file));
  }
  
  // Process client files
  const clientSection = docx.createP();
  clientSection.addText('פונקציות בצד הלקוח (Client)', { bold: true, underline: true, font_size: 16 });
  clientSection.addLineBreak();
  clientSection.addLineBreak();
  
  // Get all client files
  const clientPath = path.join(__dirname, 'client', 'src');
  if (fs.existsSync(clientPath)) {
    // Process components
    const componentFiles = getAllFiles(clientPath).filter(file => file.includes('components') && !file.includes('__tests__'));
    componentFiles.forEach(file => extractFunctionsFromFile(file));
    
    // Process context
    const contextFiles = getAllFiles(clientPath).filter(file => file.includes('context') && !file.includes('__tests__'));
    contextFiles.forEach(file => extractFunctionsFromFile(file));
    
    // Process utils
    const utilFiles = getAllFiles(clientPath).filter(file => file.includes('utils') && !file.includes('__tests__'));
    utilFiles.forEach(file => extractFunctionsFromFile(file));
  }
  
  // Create a write stream to save the document
  const out = fs.createWriteStream(path.join(__dirname, 'functions-with-explanations.docx'));
  
  // Save the document
  docx.generate(out);
  
  console.log('Word document with functions and explanations created successfully: functions-with-explanations.docx');
}

// Run the main function
processAllFiles();
