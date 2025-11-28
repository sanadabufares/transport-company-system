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

// Function to add a class to the document
function addClassToDoc(title, description, code) {
  // Add class title
  const titlePara = docx.createP();
  titlePara.addText(title, { bold: true, font_size: 16 });
  titlePara.addLineBreak();
  
  // Add class description
  const descPara = docx.createP();
  descPara.addText(`הסבר: ${description}`, { italic: true });
  descPara.addLineBreak();
  descPara.addLineBreak();
  
  // Add class code
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
  docTitle.addText('מחלקות בפרויקט Transport Company', { bold: true, font_size: 18 });
  docTitle.addLineBreak();
  docTitle.addLineBreak();
  
  // 1. Server-side Models
  const serverModelsSection = docx.createP();
  serverModelsSection.addText('מחלקות מודל בצד השרת (Server Models)', { bold: true, underline: true, font_size: 16 });
  serverModelsSection.addLineBreak();
  serverModelsSection.addLineBreak();
  
  // User Model
  const userModelPath = path.join(__dirname, 'server', 'models', 'user.js');
  if (fs.existsSync(userModelPath)) {
    const userModelContent = readFileContent(userModelPath);
    addClassToDoc(
      'User Model (server/models/user.js)',
      'מחלקה לניהול משתמשים במערכת. מטפלת ביצירה, עדכון, מחיקה וחיפוש משתמשים בבסיס הנתונים. כוללת גם פונקציות לאימות סיסמאות ועדכון פרטי משתמש.',
      userModelContent
    );
  }
  
  // Driver Model
  const driverModelPath = path.join(__dirname, 'server', 'models', 'driver.js');
  if (fs.existsSync(driverModelPath)) {
    const driverModelContent = readFileContent(driverModelPath);
    addClassToDoc(
      'Driver Model (server/models/driver.js)',
      'מחלקה לניהול פרופילי נהגים. מטפלת ביצירה, עדכון וחיפוש פרופילי נהגים בבסיס הנתונים. כוללת גם פונקציות לעדכון זמינות נהג ובדיקת התנגשויות בלוח הזמנים.',
      driverModelContent
    );
  }
  
  // Company Model
  const companyModelPath = path.join(__dirname, 'server', 'models', 'company.js');
  if (fs.existsSync(companyModelPath)) {
    const companyModelContent = readFileContent(companyModelPath);
    addClassToDoc(
      'Company Model (server/models/company.js)',
      'מחלקה לניהול פרופילי חברות. מטפלת ביצירה, עדכון וחיפוש פרופילי חברות בבסיס הנתונים. מכילה מידע על חברות ההסעות במערכת.',
      companyModelContent
    );
  }
  
  // Trip Model
  const tripModelPath = path.join(__dirname, 'server', 'models', 'trip.js');
  if (fs.existsSync(tripModelPath)) {
    const tripModelContent = readFileContent(tripModelPath);
    addClassToDoc(
      'Trip Model (server/models/trip.js)',
      'מחלקה לניהול נסיעות. מטפלת ביצירה, עדכון, מחיקה וחיפוש נסיעות בבסיס הנתונים. כוללת גם פונקציות לשיוך נהגים לנסיעות, עדכון סטטוס נסיעה, ומציאת נהגים זמינים לנסיעה.',
      tripModelContent
    );
  }
  
  // TripRequest Model
  const tripRequestModelPath = path.join(__dirname, 'server', 'models', 'tripRequest.js');
  if (fs.existsSync(tripRequestModelPath)) {
    const tripRequestModelContent = readFileContent(tripRequestModelPath);
    addClassToDoc(
      'TripRequest Model (server/models/tripRequest.js)',
      'מחלקה לניהול בקשות נסיעה. מטפלת ביצירה, עדכון וחיפוש בקשות נסיעה בבסיס הנתונים. מאפשרת לנהגים לבקש להשתתף בנסיעות ולחברות לאשר או לדחות בקשות אלו.',
      tripRequestModelContent
    );
  }
  
  // Notification Model
  const notificationModelPath = path.join(__dirname, 'server', 'models', 'notification.js');
  if (fs.existsSync(notificationModelPath)) {
    const notificationModelContent = readFileContent(notificationModelPath);
    addClassToDoc(
      'Notification Model (server/models/notification.js)',
      'מחלקה לניהול התראות. מטפלת ביצירה, עדכון וחיפוש התראות בבסיס הנתונים. מאפשרת שליחת התראות למשתמשים וסימון התראות כנקראות.',
      notificationModelContent
    );
  }
  
  // Rating Model
  const ratingModelPath = path.join(__dirname, 'server', 'models', 'rating.js');
  if (fs.existsSync(ratingModelPath)) {
    const ratingModelContent = readFileContent(ratingModelPath);
    addClassToDoc(
      'Rating Model (server/models/rating.js)',
      'מחלקה לניהול דירוגים. מטפלת ביצירה, עדכון וחיפוש דירוגים בבסיס הנתונים. מאפשרת לחברות לדרג נהגים ולנהגים לדרג חברות.',
      ratingModelContent
    );
  }
  
  // 2. Server-side Controllers
  const serverControllersSection = docx.createP();
  serverControllersSection.addText('מחלקות בקר בצד השרת (Server Controllers)', { bold: true, underline: true, font_size: 16 });
  serverControllersSection.addLineBreak();
  serverControllersSection.addLineBreak();
  
  // Auth Controller
  const authControllerPath = path.join(__dirname, 'server', 'controllers', 'auth.js');
  if (fs.existsSync(authControllerPath)) {
    const authControllerContent = readFileContent(authControllerPath);
    addClassToDoc(
      'Auth Controller (server/controllers/auth.js)',
      'בקר לניהול אימות משתמשים. מטפל ברישום משתמשים חדשים, התחברות למערכת, קבלת פרטי משתמש מחובר ועדכון סיסמה.',
      authControllerContent
    );
  }
  
  // Driver Controller
  const driverControllerPath = path.join(__dirname, 'server', 'controllers', 'driver.js');
  if (fs.existsSync(driverControllerPath)) {
    const driverControllerContent = readFileContent(driverControllerPath);
    addClassToDoc(
      'Driver Controller (server/controllers/driver.js)',
      'בקר לניהול פעולות נהגים. מטפל בקבלת ועדכון פרופיל נהג, עדכון זמינות, קבלת נסיעות זמינות, שליחת בקשות לנסיעות וקבלת סטטיסטיקות.',
      driverControllerContent
    );
  }
  
  // Company Controller
  const companyControllerPath = path.join(__dirname, 'server', 'controllers', 'company.js');
  if (fs.existsSync(companyControllerPath)) {
    const companyControllerContent = readFileContent(companyControllerPath);
    addClassToDoc(
      'Company Controller (server/controllers/company.js)',
      'בקר לניהול פעולות חברות. מטפל בקבלת ועדכון פרופיל חברה, יצירת נסיעות, קבלת נהגים זמינים, שליחת בקשות לנהגים וקבלת סטטיסטיקות.',
      companyControllerContent
    );
  }
  
  // Trip Controller
  const tripControllerPath = path.join(__dirname, 'server', 'controllers', 'trip.js');
  if (fs.existsSync(tripControllerPath)) {
    const tripControllerContent = readFileContent(tripControllerPath);
    addClassToDoc(
      'Trip Controller (server/controllers/trip.js)',
      'בקר לניהול נסיעות. מטפל ביצירה, עדכון ומחיקה של נסיעות, קבלת נסיעות לפי חברה או נהג, התחלה וסיום נסיעות.',
      tripControllerContent
    );
  }
  
  // Admin Controller
  const adminControllerPath = path.join(__dirname, 'server', 'controllers', 'admin.js');
  if (fs.existsSync(adminControllerPath)) {
    const adminControllerContent = readFileContent(adminControllerPath);
    addClassToDoc(
      'Admin Controller (server/controllers/admin.js)',
      'בקר לניהול פעולות מנהל מערכת. מטפל באישור משתמשים חדשים, קבלת רשימות חברות ונהגים, וקבלת סטטיסטיקות כלליות על המערכת.',
      adminControllerContent
    );
  }
  
  // Report Controller
  const reportControllerPath = path.join(__dirname, 'server', 'controllers', 'report.js');
  if (fs.existsSync(reportControllerPath)) {
    const reportControllerContent = readFileContent(reportControllerPath);
    addClassToDoc(
      'Report Controller (server/controllers/report.js)',
      'בקר לניהול דוחות. מטפל בהפקת דוחות שונים כמו דוחות נסיעות לפי תאריך, חברה או נהג.',
      reportControllerContent
    );
  }
  
  // 3. Client-side Context
  const clientContextSection = docx.createP();
  clientContextSection.addText('מחלקות קונטקסט בצד הלקוח (Client Context)', { bold: true, underline: true, font_size: 16 });
  clientContextSection.addLineBreak();
  clientContextSection.addLineBreak();
  
  // Auth Context
  const authContextPath = path.join(__dirname, 'client', 'src', 'context', 'AuthContext.jsx');
  if (fs.existsSync(authContextPath)) {
    const authContextContent = readFileContent(authContextPath);
    addClassToDoc(
      'Auth Context (client/src/context/AuthContext.jsx)',
      'מחלקת קונטקסט לניהול מצב אימות משתמש בצד הלקוח. מטפלת בהתחברות, התנתקות, רישום משתמשים חדשים וטעינת פרופיל משתמש.',
      authContextContent
    );
  }
  
  // 4. Client-side Components
  const clientComponentsSection = docx.createP();
  clientComponentsSection.addText('מחלקות רכיבים בצד הלקוח (Client Components)', { bold: true, underline: true, font_size: 16 });
  clientComponentsSection.addLineBreak();
  clientComponentsSection.addLineBreak();
  
  // Auth Components
  const loginPath = path.join(__dirname, 'client', 'src', 'components', 'auth', 'Login.jsx');
  if (fs.existsSync(loginPath)) {
    const loginContent = readFileContent(loginPath);
    addClassToDoc(
      'Login Component (client/src/components/auth/Login.jsx)',
      'רכיב טופס התחברות למערכת. מאפשר למשתמשים להזין שם משתמש וסיסמה ולהתחבר למערכת.',
      loginContent
    );
  }
  
  const registerCompanyPath = path.join(__dirname, 'client', 'src', 'components', 'auth', 'RegisterCompany.js');
  if (fs.existsSync(registerCompanyPath)) {
    const registerCompanyContent = readFileContent(registerCompanyPath);
    addClassToDoc(
      'RegisterCompany Component (client/src/components/auth/RegisterCompany.js)',
      'רכיב טופס רישום חברה חדשה. מאפשר לחברות להירשם למערכת על ידי הזנת פרטי החברה.',
      registerCompanyContent
    );
  }
  
  // Driver Components
  const driverDashboardPath = path.join(__dirname, 'client', 'src', 'components', 'driver', 'Dashboard.jsx');
  if (fs.existsSync(driverDashboardPath)) {
    const driverDashboardContent = readFileContent(driverDashboardPath);
    addClassToDoc(
      'Driver Dashboard Component (client/src/components/driver/Dashboard.jsx)',
      'רכיב לוח בקרה לנהג. מציג סטטיסטיקות על נסיעות, זמינות, והתראות. כולל גם נסיעות קרובות ומידע על הכנסות.',
      driverDashboardContent
    );
  }
  
  const availabilityPath = path.join(__dirname, 'client', 'src', 'components', 'driver', 'Availability.js');
  if (fs.existsSync(availabilityPath)) {
    const availabilityContent = readFileContent(availabilityPath);
    addClassToDoc(
      'Availability Component (client/src/components/driver/Availability.js)',
      'רכיב לניהול זמינות נהג. מאפשר לנהג לעדכן את זמינותו, מיקומו הנוכחי וטווח התאריכים בהם הוא זמין.',
      availabilityContent
    );
  }
  
  // Company Components
  const companyDashboardPath = path.join(__dirname, 'client', 'src', 'components', 'company', 'Dashboard.jsx');
  if (fs.existsSync(companyDashboardPath)) {
    const companyDashboardContent = readFileContent(companyDashboardPath);
    addClassToDoc(
      'Company Dashboard Component (client/src/components/company/Dashboard.jsx)',
      'רכיב לוח בקרה לחברה. מציג סטטיסטיקות על נסיעות, בקשות נהגים, והתראות. כולל גם נסיעות אחרונות וסיכום עסקי.',
      companyDashboardContent
    );
  }
  
  const createTripPath = path.join(__dirname, 'client', 'src', 'components', 'company', 'CreateTrip.js');
  if (fs.existsSync(createTripPath)) {
    const createTripContent = readFileContent(createTripPath);
    addClassToDoc(
      'CreateTrip Component (client/src/components/company/CreateTrip.js)',
      'רכיב ליצירת נסיעה חדשה. מאפשר לחברה להזין את פרטי הנסיעה כמו מקור, יעד, תאריך, שעה ומחיר.',
      createTripContent
    );
  }
  
  // Common Components
  const headerPath = path.join(__dirname, 'client', 'src', 'components', 'common', 'Header.jsx');
  if (fs.existsSync(headerPath)) {
    const headerContent = readFileContent(headerPath);
    addClassToDoc(
      'Header Component (client/src/components/common/Header.jsx)',
      'רכיב כותרת המוצג בכל הדפים. כולל תפריט ניווט, לוגו, והתראות. התפריט משתנה בהתאם לסוג המשתמש המחובר.',
      headerContent
    );
  }
  
  const privateRoutePath = path.join(__dirname, 'client', 'src', 'components', 'common', 'PrivateRoute.jsx');
  if (fs.existsSync(privateRoutePath)) {
    const privateRouteContent = readFileContent(privateRoutePath);
    addClassToDoc(
      'PrivateRoute Component (client/src/components/common/PrivateRoute.jsx)',
      'רכיב לניהול נתיבים מוגנים. מוודא שרק משתמשים מחוברים עם הרשאות מתאימות יכולים לגשת לדפים מסוימים.',
      privateRouteContent
    );
  }
  
  // Create a write stream to save the document
  const out = fs.createWriteStream(path.join(__dirname, 'classes-documentation.docx'));
  
  // Save the document
  docx.generate(out);
  
  console.log('Word document with classes documentation created successfully: classes-documentation.docx');
}

// Run the main function
createDocument();
