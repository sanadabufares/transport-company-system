const fs = require('fs');
const path = require('path');
const officegen = require('officegen');

// Create a new Word document
const docx = officegen('docx');

// Function to read file content
function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
    return '';
  }
}

// Function to add a function to the document
function addFunctionToDoc(title, description, code) {
  // Add function title
  const titlePara = docx.createP();
  titlePara.addText(title, { bold: true, font_size: 14 });
  titlePara.addLineBreak();
  
  // Add function description
  const descPara = docx.createP();
  descPara.addText(`הסבר: ${description}`, { italic: true });
  descPara.addLineBreak();
  descPara.addLineBreak();
  
  // Add function code
  const codePara = docx.createP();
  codePara.addText(code);
  codePara.addLineBreak();
  codePara.addLineBreak();
  
  // Add separator
  const separator = docx.createP();
  separator.addText('-----------------------------------------------------------');
  separator.addLineBreak();
  separator.addLineBreak();
}

// Main function to create the document
async function createDocument() {
  // Add document title
  const docTitle = docx.createP();
  docTitle.addText('פונקציות נבחרות מפרויקט Transport Company', { bold: true, font_size: 18 });
  docTitle.addLineBreak();
  docTitle.addLineBreak();
  
  // 1. User Creation and Authentication
  const authSection = docx.createP();
  authSection.addText('יצירת משתמש והתחברות', { bold: true, underline: true, font_size: 16 });
  authSection.addLineBreak();
  authSection.addLineBreak();
  
  // User Model - create function
  const userModelPath = path.join(__dirname, 'server', 'models', 'user.js');
  if (fs.existsSync(userModelPath)) {
    const userModelContent = readFileContent(userModelPath);
    
    // Extract create function
    const createFunctionMatch = userModelContent.match(/static async create\([^{]*{[^}]*}/s);
    if (createFunctionMatch) {
      addFunctionToDoc(
        'User.create (server/models/user.js)',
        'פונקציה ליצירת משתמש חדש במערכת. מקבלת את פרטי המשתמש, מצפינה את הסיסמה ושומרת את המשתמש בבסיס הנתונים.',
        createFunctionMatch[0]
      );
    }
  }
  
  // Auth Controller - register function
  const authControllerPath = path.join(__dirname, 'server', 'controllers', 'auth.js');
  if (fs.existsSync(authControllerPath)) {
    const authControllerContent = readFileContent(authControllerPath);
    
    // Extract register function
    const registerFunctionMatch = authControllerContent.match(/exports\.register[^{]*{[^}]*}/s);
    if (registerFunctionMatch) {
      addFunctionToDoc(
        'register (server/controllers/auth.js)',
        'פונקציית בקר לרישום משתמש חדש. מקבלת את פרטי המשתמש מה-request, מוודאת שהמשתמש לא קיים כבר, ויוצרת משתמש חדש.',
        registerFunctionMatch[0]
      );
    }
    
    // Extract login function
    const loginFunctionMatch = authControllerContent.match(/exports\.login[^{]*{[^}]*}/s);
    if (loginFunctionMatch) {
      addFunctionToDoc(
        'login (server/controllers/auth.js)',
        'פונקציית בקר להתחברות משתמש. מקבלת שם משתמש וסיסמה, מאמתת אותם מול בסיס הנתונים, ומחזירה טוקן JWT אם האימות הצליח.',
        loginFunctionMatch[0]
      );
    }
  }
  
  // AuthContext - login function (client)
  const authContextPath = path.join(__dirname, 'client', 'src', 'context', 'AuthContext.jsx');
  if (fs.existsSync(authContextPath)) {
    const authContextContent = readFileContent(authContextPath);
    
    // Extract login function
    const loginFunctionMatch = authContextContent.match(/const login[^{]*{[^}]*}/s);
    if (loginFunctionMatch) {
      addFunctionToDoc(
        'login (client/src/context/AuthContext.jsx)',
        'פונקציה בצד הלקוח להתחברות משתמש. שולחת בקשת התחברות לשרת, שומרת את הטוקן ב-localStorage ומעדכנת את מצב האימות.',
        loginFunctionMatch[0]
      );
    }
  }
  
  // 2. Dashboard Functions
  const dashboardSection = docx.createP();
  dashboardSection.addText('פונקציות Dashboard', { bold: true, underline: true, font_size: 16 });
  dashboardSection.addLineBreak();
  dashboardSection.addLineBreak();
  
  // Company Dashboard
  const companyDashboardPath = path.join(__dirname, 'client', 'src', 'components', 'company', 'Dashboard.jsx');
  if (fs.existsSync(companyDashboardPath)) {
    const dashboardContent = readFileContent(companyDashboardPath);
    
    // Extract Dashboard component
    const dashboardComponentMatch = dashboardContent.match(/const Dashboard[^{]*{[^]*?return \([^]*?\);\\n}/s);
    if (dashboardComponentMatch) {
      addFunctionToDoc(
        'Dashboard (client/src/components/company/Dashboard.jsx)',
        'רכיב לוח בקרה לחברה. מציג סטטיסטיקות על נסיעות, בקשות נהגים, והתראות. כולל גם נסיעות אחרונות וסיכום עסקי.',
        dashboardComponentMatch[0]
      );
    }
    
    // Extract fetchDashboardData function
    const fetchDataMatch = dashboardContent.match(/const fetchDashboardData[^{]*{[^}]*}/s);
    if (fetchDataMatch) {
      addFunctionToDoc(
        'fetchDashboardData (client/src/components/company/Dashboard.jsx)',
        'פונקציה לטעינת נתוני לוח הבקרה של החברה מהשרת. מביאה סטטיסטיקות, נסיעות אחרונות, ונתונים נוספים.',
        fetchDataMatch[0]
      );
    }
  }
  
  // Driver Dashboard
  const driverDashboardPath = path.join(__dirname, 'client', 'src', 'components', 'driver', 'Dashboard.jsx');
  if (fs.existsSync(driverDashboardPath)) {
    const dashboardContent = readFileContent(driverDashboardPath);
    
    // Extract Dashboard component
    const dashboardComponentMatch = dashboardContent.match(/const Dashboard[^{]*{[^]*?return \([^]*?\);\\n}/s);
    if (dashboardComponentMatch) {
      addFunctionToDoc(
        'Dashboard (client/src/components/driver/Dashboard.jsx)',
        'רכיב לוח בקרה לנהג. מציג סטטיסטיקות על נסיעות, זמינות, והתראות. כולל גם נסיעות קרובות ומידע על הכנסות.',
        dashboardComponentMatch[0]
      );
    }
    
    // Extract fetchDashboardData function
    const fetchDataMatch = dashboardContent.match(/const fetchDashboardData[^{]*{[^}]*}/s);
    if (fetchDataMatch) {
      addFunctionToDoc(
        'fetchDashboardData (client/src/components/driver/Dashboard.jsx)',
        'פונקציה לטעינת נתוני לוח הבקרה של הנהג מהשרת. מביאה סטטיסטיקות, נסיעות קרובות, ונתונים נוספים.',
        fetchDataMatch[0]
      );
    }
  }
  
  // 3. Profile Update Functions
  const profileSection = docx.createP();
  profileSection.addText('פונקציות עדכון פרופיל', { bold: true, underline: true, font_size: 16 });
  profileSection.addLineBreak();
  profileSection.addLineBreak();
  
  // Company Profile Update
  const companyControllerPath = path.join(__dirname, 'server', 'controllers', 'company.js');
  if (fs.existsSync(companyControllerPath)) {
    const companyControllerContent = readFileContent(companyControllerPath);
    
    // Extract updateProfile function
    const updateProfileMatch = companyControllerContent.match(/exports\.updateProfile[^{]*{[^}]*}/s);
    if (updateProfileMatch) {
      addFunctionToDoc(
        'updateProfile (server/controllers/company.js)',
        'פונקציית בקר לעדכון פרופיל חברה. מקבלת את פרטי הפרופיל החדשים ומעדכנת אותם בבסיס הנתונים.',
        updateProfileMatch[0]
      );
    }
  }
  
  // Driver Profile Update
  const driverControllerPath = path.join(__dirname, 'server', 'controllers', 'driver.js');
  if (fs.existsSync(driverControllerPath)) {
    const driverControllerContent = readFileContent(driverControllerPath);
    
    // Extract updateProfile function
    const updateProfileMatch = driverControllerContent.match(/exports\.updateProfile[^{]*{[^}]*}/s);
    if (updateProfileMatch) {
      addFunctionToDoc(
        'updateProfile (server/controllers/driver.js)',
        'פונקציית בקר לעדכון פרופיל נהג. מקבלת את פרטי הפרופיל החדשים ומעדכנת אותם בבסיס הנתונים.',
        updateProfileMatch[0]
      );
    }
  }
  
  // 4. Driver Availability Functions
  const availabilitySection = docx.createP();
  availabilitySection.addText('פונקציות עדכון זמינות נהג', { bold: true, underline: true, font_size: 16 });
  availabilitySection.addLineBreak();
  availabilitySection.addLineBreak();
  
  // Driver Availability Update
  if (fs.existsSync(driverControllerPath)) {
    const driverControllerContent = readFileContent(driverControllerPath);
    
    // Extract updateAvailability function
    const updateAvailabilityMatch = driverControllerContent.match(/exports\.updateAvailability[^{]*{[^}]*}/s);
    if (updateAvailabilityMatch) {
      addFunctionToDoc(
        'updateAvailability (server/controllers/driver.js)',
        'פונקציית בקר לעדכון זמינות נהג. מקבלת את פרטי הזמינות החדשים (זמין/לא זמין, מיקום, טווח תאריכים) ומעדכנת אותם בבסיס הנתונים.',
        updateAvailabilityMatch[0]
      );
    }
  }
  
  const driverModelPath = path.join(__dirname, 'server', 'models', 'driver.js');
  if (fs.existsSync(driverModelPath)) {
    const driverModelContent = readFileContent(driverModelPath);
    
    // Extract updateAvailability function
    const updateAvailabilityMatch = driverModelContent.match(/static async updateAvailability\([^{]*{[^}]*}/s);
    if (updateAvailabilityMatch) {
      addFunctionToDoc(
        'Driver.updateAvailability (server/models/driver.js)',
        'פונקציית מודל לעדכון זמינות נהג בבסיס הנתונים. מעדכנת את הזמינות, המיקום הנוכחי וטווח התאריכים.',
        updateAvailabilityMatch[0]
      );
    }
  }
  
  // 5. Company Trip Functions
  const companyTripSection = docx.createP();
  companyTripSection.addText('פונקציות נסיעות של חברה', { bold: true, underline: true, font_size: 16 });
  companyTripSection.addLineBreak();
  companyTripSection.addLineBreak();
  
  // Trip Creation
  const tripControllerPath = path.join(__dirname, 'server', 'controllers', 'trip.js');
  if (fs.existsSync(tripControllerPath)) {
    const tripControllerContent = readFileContent(tripControllerPath);
    
    // Extract createTrip function
    const createTripMatch = tripControllerContent.match(/exports\.createTrip[^{]*{[^}]*}/s);
    if (createTripMatch) {
      addFunctionToDoc(
        'createTrip (server/controllers/trip.js)',
        'פונקציית בקר ליצירת נסיעה חדשה. מקבלת את פרטי הנסיעה ויוצרת אותה בבסיס הנתונים.',
        createTripMatch[0]
      );
    }
    
    // Extract updateTrip function
    const updateTripMatch = tripControllerContent.match(/exports\.updateTrip[^{]*{[^}]*}/s);
    if (updateTripMatch) {
      addFunctionToDoc(
        'updateTrip (server/controllers/trip.js)',
        'פונקציית בקר לעדכון פרטי נסיעה קיימת. מקבלת את פרטי הנסיעה החדשים ומעדכנת אותם בבסיס הנתונים.',
        updateTripMatch[0]
      );
    }
    
    // Extract deleteTrip function
    const deleteTripMatch = tripControllerContent.match(/exports\.deleteTrip[^{]*{[^}]*}/s);
    if (deleteTripMatch) {
      addFunctionToDoc(
        'deleteTrip (server/controllers/trip.js)',
        'פונקציית בקר למחיקת נסיעה. מוחקת את הנסיעה מבסיס הנתונים לפי המזהה שלה.',
        deleteTripMatch[0]
      );
    }
    
    // Extract getCompanyTrips function
    const getCompanyTripsMatch = tripControllerContent.match(/exports\.getCompanyTrips[^{]*{[^}]*}/s);
    if (getCompanyTripsMatch) {
      addFunctionToDoc(
        'getCompanyTrips (server/controllers/trip.js)',
        'פונקציית בקר להבאת כל הנסיעות של חברה מסוימת. מחזירה את הנסיעות לפי מזהה החברה.',
        getCompanyTripsMatch[0]
      );
    }
  }
  
  // Trip Model functions
  const tripModelPath = path.join(__dirname, 'server', 'models', 'trip.js');
  if (fs.existsSync(tripModelPath)) {
    const tripModelContent = readFileContent(tripModelPath);
    
    // Extract create function
    const createMatch = tripModelContent.match(/static async create\([^{]*{[^}]*}/s);
    if (createMatch) {
      addFunctionToDoc(
        'Trip.create (server/models/trip.js)',
        'פונקציית מודל ליצירת נסיעה חדשה בבסיס הנתונים. מקבלת את פרטי הנסיעה ומחזירה את המזהה של הנסיעה החדשה.',
        createMatch[0]
      );
    }
    
    // Extract assignDriver function
    const assignDriverMatch = tripModelContent.match(/static async assignDriver\([^{]*{[^}]*}/s);
    if (assignDriverMatch) {
      addFunctionToDoc(
        'Trip.assignDriver (server/models/trip.js)',
        'פונקציית מודל לשיוך נהג לנסיעה. מקבלת את מזהה הנסיעה ומזהה הנהג, ומעדכנת את הנסיעה בבסיס הנתונים.',
        assignDriverMatch[0]
      );
    }
  }
  
  // 6. Driver Trip Functions
  const driverTripSection = docx.createP();
  driverTripSection.addText('פונקציות נסיעות של נהג', { bold: true, underline: true, font_size: 16 });
  driverTripSection.addLineBreak();
  driverTripSection.addLineBreak();
  
  // Driver Trip functions
  if (fs.existsSync(tripControllerPath)) {
    const tripControllerContent = readFileContent(tripControllerPath);
    
    // Extract getDriverTrips function
    const getDriverTripsMatch = tripControllerContent.match(/exports\.getDriverTrips[^{]*{[^}]*}/s);
    if (getDriverTripsMatch) {
      addFunctionToDoc(
        'getDriverTrips (server/controllers/trip.js)',
        'פונקציית בקר להבאת כל הנסיעות של נהג מסוים. מחזירה את הנסיעות לפי מזהה הנהג.',
        getDriverTripsMatch[0]
      );
    }
    
    // Extract startTrip function
    const startTripMatch = tripControllerContent.match(/exports\.startTrip[^{]*{[^}]*}/s);
    if (startTripMatch) {
      addFunctionToDoc(
        'startTrip (server/controllers/trip.js)',
        'פונקציית בקר להתחלת נסיעה. מעדכנת את סטטוס הנסיעה ל"פעילה" ומתעדת את זמן ההתחלה.',
        startTripMatch[0]
      );
    }
    
    // Extract completeTrip function
    const completeTripMatch = tripControllerContent.match(/exports\.completeTrip[^{]*{[^}]*}/s);
    if (completeTripMatch) {
      addFunctionToDoc(
        'completeTrip (server/controllers/trip.js)',
        'פונקציית בקר לסיום נסיעה. מעדכנת את סטטוס הנסיעה ל"הושלמה" ומתעדת את זמן הסיום.',
        completeTripMatch[0]
      );
    }
  }
  
  // Trip Request functions
  const tripRequestModelPath = path.join(__dirname, 'server', 'models', 'tripRequest.js');
  if (fs.existsSync(tripRequestModelPath)) {
    const tripRequestModelContent = readFileContent(tripRequestModelPath);
    
    // Extract create function
    const createMatch = tripRequestModelContent.match(/static async create\([^{]*{[^}]*}/s);
    if (createMatch) {
      addFunctionToDoc(
        'TripRequest.create (server/models/tripRequest.js)',
        'פונקציית מודל ליצירת בקשת נסיעה חדשה. מקבלת את מזהה הנסיעה ומזהה הנהג, ויוצרת בקשה חדשה בבסיס הנתונים.',
        createMatch[0]
      );
    }
    
    // Extract updateStatus function
    const updateStatusMatch = tripRequestModelContent.match(/static async updateStatus\([^{]*{[^}]*}/s);
    if (updateStatusMatch) {
      addFunctionToDoc(
        'TripRequest.updateStatus (server/models/tripRequest.js)',
        'פונקציית מודל לעדכון סטטוס בקשת נסיעה. מקבלת את מזהה הבקשה והסטטוס החדש, ומעדכנת את הבקשה בבסיס הנתונים.',
        updateStatusMatch[0]
      );
    }
  }
  
  // 7. Report Functions
  const reportSection = docx.createP();
  reportSection.addText('פונקציות דוחות', { bold: true, underline: true, font_size: 16 });
  reportSection.addLineBreak();
  reportSection.addLineBreak();
  
  // Report Controller functions
  const reportControllerPath = path.join(__dirname, 'server', 'controllers', 'report.js');
  if (fs.existsSync(reportControllerPath)) {
    const reportControllerContent = readFileContent(reportControllerPath);
    
    // Extract getCompanyTripsByDate function
    const getCompanyTripsByDateMatch = reportControllerContent.match(/exports\.getCompanyTripsByDate[^{]*{[^}]*}/s);
    if (getCompanyTripsByDateMatch) {
      addFunctionToDoc(
        'getCompanyTripsByDate (server/controllers/report.js)',
        'פונקציית בקר להפקת דוח נסיעות של חברה לפי תאריך. מקבלת טווח תאריכים ומחזירה את הנסיעות בטווח זה.',
        getCompanyTripsByDateMatch[0]
      );
    }
    
    // Extract getDriverTripsByDate function
    const getDriverTripsByDateMatch = reportControllerContent.match(/exports\.getDriverTripsByDate[^{]*{[^}]*}/s);
    if (getDriverTripsByDateMatch) {
      addFunctionToDoc(
        'getDriverTripsByDate (server/controllers/report.js)',
        'פונקציית בקר להפקת דוח נסיעות של נהג לפי תאריך. מקבלת טווח תאריכים ומחזירה את הנסיעות בטווח זה.',
        getDriverTripsByDateMatch[0]
      );
    }
    
    // Extract getTripsByVisaNumber function
    const getTripsByVisaNumberMatch = reportControllerContent.match(/exports\.getTripsByVisaNumber[^{]*{[^}]*}/s);
    if (getTripsByVisaNumberMatch) {
      addFunctionToDoc(
        'getTripsByVisaNumber (server/controllers/report.js)',
        'פונקציית בקר להפקת דוח נסיעות לפי מספר ויזה. מחזירה את כל הנסיעות המשויכות למספר הויזה שהתקבל.',
        getTripsByVisaNumberMatch[0]
      );
    }
  }
  
  // 8. Notification Functions
  const notificationSection = docx.createP();
  notificationSection.addText('פונקציות התראות', { bold: true, underline: true, font_size: 16 });
  notificationSection.addLineBreak();
  notificationSection.addLineBreak();
  
  // Notification Model functions
  const notificationModelPath = path.join(__dirname, 'server', 'models', 'notification.js');
  if (fs.existsSync(notificationModelPath)) {
    const notificationModelContent = readFileContent(notificationModelPath);
    
    // Extract create function
    const createMatch = notificationModelContent.match(/static async create\([^{]*{[^}]*}/s);
    if (createMatch) {
      addFunctionToDoc(
        'Notification.create (server/models/notification.js)',
        'פונקציית מודל ליצירת התראה חדשה. מקבלת את פרטי ההתראה ויוצרת אותה בבסיס הנתונים.',
        createMatch[0]
      );
    }
    
    // Extract findByUserId function
    const findByUserIdMatch = notificationModelContent.match(/static async findByUserId\([^{]*{[^}]*}/s);
    if (findByUserIdMatch) {
      addFunctionToDoc(
        'Notification.findByUserId (server/models/notification.js)',
        'פונקציית מודל להבאת כל ההתראות של משתמש מסוים. מחזירה את ההתראות לפי מזהה המשתמש.',
        findByUserIdMatch[0]
      );
    }
    
    // Extract markAsRead function
    const markAsReadMatch = notificationModelContent.match(/static async markAsRead\([^{]*{[^}]*}/s);
    if (markAsReadMatch) {
      addFunctionToDoc(
        'Notification.markAsRead (server/models/notification.js)',
        'פונקציית מודל לסימון התראה כנקראה. מעדכנת את סטטוס ההתראה בבסיס הנתונים.',
        markAsReadMatch[0]
      );
    }
    
    // Extract markAllAsRead function
    const markAllAsReadMatch = notificationModelContent.match(/static async markAllAsRead\([^{]*{[^}]*}/s);
    if (markAllAsReadMatch) {
      addFunctionToDoc(
        'Notification.markAllAsRead (server/models/notification.js)',
        'פונקציית מודל לסימון כל ההתראות של משתמש כנקראות. מעדכנת את סטטוס כל ההתראות של המשתמש בבסיס הנתונים.',
        markAllAsReadMatch[0]
      );
    }
  }
  
  // Create a write stream to save the document
  const out = fs.createWriteStream(path.join(__dirname, 'specific-functions.docx'));
  
  // Save the document
  docx.generate(out);
  
  console.log('Word document with specific functions created successfully: specific-functions.docx');
}

// Run the main function
createDocument();
