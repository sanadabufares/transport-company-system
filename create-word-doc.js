const fs = require('fs');
const path = require('path');
const officegen = require('officegen');

// Create a new Word document
const docx = officegen('docx');

// Add a title
const titleParagraph = docx.createP();
titleParagraph.addText('תיעוד קודים בפרויקט Transport Company', { bold: true, font_size: 16 });
titleParagraph.addLineBreak();
titleParagraph.addLineBreak();

// Server-side code descriptions
const serverSection = docx.createP();
serverSection.addText('קודים בצד השרת (Server)', { bold: true, underline: true, font_size: 14 });
serverSection.addLineBreak();
serverSection.addLineBreak();

// Models
const modelsSection = docx.createP();
modelsSection.addText('מודלים (Models):', { bold: true, font_size: 12 });
modelsSection.addLineBreak();

const models = [
  { name: 'User Model', path: 'server/models/user.js', description: 'מודל המטפל בנתוני משתמשים, כולל אימות, יצירה, עדכון ומחיקה של משתמשים במערכת.' },
  { name: 'Company Model', path: 'server/models/company.js', description: 'מודל המטפל בנתוני חברות הסעות, כולל פרופיל חברה, דירוג ופרטי קשר.' },
  { name: 'Driver Model', path: 'server/models/driver.js', description: 'מודל המטפל בנתוני נהגים, כולל פרטים אישיים, זמינות, רישיון נהיגה ודירוג.' },
  { name: 'Trip Model', path: 'server/models/trip.js', description: 'מודל המטפל בנתוני נסיעות, כולל יצירה, עדכון, מחיקה, הקצאת נהגים ועדכון סטטוס נסיעה.' },
  { name: 'TripRequest Model', path: 'server/models/tripRequest.js', description: 'מודל המטפל בבקשות לנסיעות בין נהגים וחברות.' },
  { name: 'Notification Model', path: 'server/models/notification.js', description: 'מודל המטפל בהתראות למשתמשים במערכת.' },
];

models.forEach(model => {
  const p = docx.createP();
  p.addText(`${model.name} (${model.path}): `, { bold: true });
  p.addText(model.description);
  p.addLineBreak();
});

// Controllers
const controllersSection = docx.createP();
controllersSection.addLineBreak();
controllersSection.addText('בקרים (Controllers):', { bold: true, font_size: 12 });
controllersSection.addLineBreak();

const controllers = [
  { name: 'Auth Controller', path: 'server/controllers/auth.js', description: 'בקר המטפל באימות משתמשים, כולל התחברות, הרשמה, אימות טוקן JWT ועדכון סיסמה.' },
  { name: 'Driver Controller', path: 'server/controllers/driver.js', description: 'בקר המטפל בפעולות נהגים, כולל עדכון פרופיל, זמינות, צפייה בנסיעות זמינות ושליחת בקשות לנסיעות.' },
  { name: 'Company Controller', path: 'server/controllers/company.js', description: 'בקר המטפל בפעולות חברות, כולל עדכון פרופיל, יצירת נסיעות, צפייה בנהגים זמינים ושליחת בקשות לנהגים.' },
  { name: 'Trip Controller', path: 'server/controllers/trip.js', description: 'בקר המטפל בניהול נסיעות, כולל יצירה, עדכון, מחיקה, הקצאת נהגים, התחלה וסיום נסיעות.' },
  { name: 'Admin Controller', path: 'server/controllers/admin.js', description: 'בקר המטפל בפעולות מנהל מערכת, כולל אישור משתמשים, צפייה בסטטיסטיקות וניהול כללי של המערכת.' },
  { name: 'Report Controller', path: 'server/controllers/report.js', description: 'בקר המטפל ביצירת דוחות שונים במערכת, כגון דוחות נסיעות לפי תאריך, חברה או נהג.' },
];

controllers.forEach(controller => {
  const p = docx.createP();
  p.addText(`${controller.name} (${controller.path}): `, { bold: true });
  p.addText(controller.description);
  p.addLineBreak();
});

// Routes
const routesSection = docx.createP();
routesSection.addLineBreak();
routesSection.addText('נתיבים (Routes):', { bold: true, font_size: 12 });
routesSection.addLineBreak();

const routes = [
  { name: 'Auth Routes', path: 'server/routes/auth.js', description: 'נתיבי API לאימות משתמשים, כולל התחברות, הרשמה וקבלת פרטי משתמש מחובר.' },
  { name: 'Driver Routes', path: 'server/routes/driver.js', description: 'נתיבי API לפעולות נהגים, כולל עדכון פרופיל, זמינות וניהול נסיעות.' },
  { name: 'Company Routes', path: 'server/routes/company.js', description: 'נתיבי API לפעולות חברות, כולל עדכון פרופיל וניהול נסיעות.' },
  { name: 'Trip Routes', path: 'server/routes/trip.js', description: 'נתיבי API לניהול נסיעות, כולל יצירה, עדכון, מחיקה והקצאת נהגים.' },
  { name: 'Admin Routes', path: 'server/routes/admin.js', description: 'נתיבי API לפעולות מנהל מערכת, כולל אישור משתמשים וניהול כללי.' },
  { name: 'Report Routes', path: 'server/routes/report.js', description: 'נתיבי API ליצירת דוחות שונים במערכת.' },
];

routes.forEach(route => {
  const p = docx.createP();
  p.addText(`${route.name} (${route.path}): `, { bold: true });
  p.addText(route.description);
  p.addLineBreak();
});

// Middleware
const middlewareSection = docx.createP();
middlewareSection.addLineBreak();
middlewareSection.addText('Middleware:', { bold: true, font_size: 12 });
middlewareSection.addLineBreak();

const middleware = [
  { name: 'Auth Middleware', path: 'server/middleware/auth.js', description: 'מידלוור לאימות טוקן JWT ובדיקת הרשאות משתמש.' },
  { name: 'Error Middleware', path: 'server/middleware/error.js', description: 'מידלוור לטיפול בשגיאות ושליחת תגובות שגיאה מתאימות.' },
  { name: 'Role Middleware', path: 'server/middleware/checkRole.js', description: 'מידלוור לבדיקת תפקיד משתמש והרשאות גישה לנתיבים מוגנים.' },
];

middleware.forEach(mw => {
  const p = docx.createP();
  p.addText(`${mw.name} (${mw.path}): `, { bold: true });
  p.addText(mw.description);
  p.addLineBreak();
});

// Client-side code descriptions
const clientSection = docx.createP();
clientSection.addLineBreak();
clientSection.addLineBreak();
clientSection.addText('קודים בצד הלקוח (Client)', { bold: true, underline: true, font_size: 14 });
clientSection.addLineBreak();
clientSection.addLineBreak();

// Components
const componentsSection = docx.createP();
componentsSection.addText('רכיבים (Components):', { bold: true, font_size: 12 });
componentsSection.addLineBreak();

const components = [
  { name: 'Auth Components', path: 'client/src/components/auth/', description: 'רכיבי התחברות והרשמה למערכת, כולל טפסים לחברות ונהגים.' },
  { name: 'Driver Components', path: 'client/src/components/driver/', description: 'רכיבים לממשק נהג, כולל לוח בקרה, ניהול זמינות, צפייה בנסיעות זמינות ובקשות לנסיעות.' },
  { name: 'Company Components', path: 'client/src/components/company/', description: 'רכיבים לממשק חברה, כולל לוח בקרה, יצירה וניהול נסיעות, צפייה בנהגים זמינים ובקשות מנהגים.' },
  { name: 'Admin Components', path: 'client/src/components/admin/', description: 'רכיבים לממשק מנהל מערכת, כולל אישור משתמשים, צפייה בסטטיסטיקות וניהול כללי.' },
  { name: 'Common Components', path: 'client/src/components/common/', description: 'רכיבים משותפים כמו כותרת, תפריט, התראות ורכיבי ניווט.' },
];

components.forEach(component => {
  const p = docx.createP();
  p.addText(`${component.name} (${component.path}): `, { bold: true });
  p.addText(component.description);
  p.addLineBreak();
});

// Context
const contextSection = docx.createP();
contextSection.addLineBreak();
contextSection.addText('Context Providers:', { bold: true, font_size: 12 });
contextSection.addLineBreak();

const contexts = [
  { name: 'AuthContext', path: 'client/src/context/AuthContext.jsx', description: 'ספק הקשר לניהול מצב אימות משתמש, כולל התחברות, התנתקות, הרשמה וטיפול בטוקן JWT.' },
  { name: 'NotificationContext', path: 'client/src/context/NotificationContext.jsx', description: 'ספק הקשר לניהול התראות בזמן אמת למשתמש.' },
];

contexts.forEach(context => {
  const p = docx.createP();
  p.addText(`${context.name} (${context.path}): `, { bold: true });
  p.addText(context.description);
  p.addLineBreak();
});

// Utils
const utilsSection = docx.createP();
utilsSection.addLineBreak();
utilsSection.addText('פונקציות עזר (Utils):', { bold: true, font_size: 12 });
utilsSection.addLineBreak();

const utils = [
  { name: 'API Utils', path: 'client/src/__tests__/vitestUtils.jsx', description: 'פונקציות עזר לביצוע קריאות API וטיפול בתגובות.' },
  { name: 'Date Utils', path: 'client/src/utils/dateUtils.js', description: 'פונקציות עזר לעיבוד ותצוגת תאריכים.' },
  { name: 'Format Utils', path: 'client/src/utils/formatUtils.js', description: 'פונקציות עזר לפורמט נתונים שונים כמו מספרי טלפון, מחירים וכו\'.' },
];

utils.forEach(util => {
  const p = docx.createP();
  p.addText(`${util.name} (${util.path}): `, { bold: true });
  p.addText(util.description);
  p.addLineBreak();
});

// Testing
const testingSection = docx.createP();
testingSection.addLineBreak();
testingSection.addLineBreak();
testingSection.addText('קודי בדיקות (Tests)', { bold: true, underline: true, font_size: 14 });
testingSection.addLineBreak();
testingSection.addLineBreak();

const tests = [
  { name: 'Server Unit Tests', path: 'server/__tests__/', description: 'בדיקות יחידה לצד השרת, כולל בדיקות למודלים, בקרים ונתיבים.' },
  { name: 'Client Unit Tests', path: 'client/src/__tests__/', description: 'בדיקות יחידה לצד הלקוח, כולל בדיקות לרכיבים, ספקי הקשר ופונקציות עזר.' },
  { name: 'Integration Tests', path: '__tests__/integration/', description: 'בדיקות אינטגרציה למערכת, כולל בדיקות לתהליכים מקצה לקצה כמו אימות משתמשים וניהול נסיעות.' },
];

tests.forEach(test => {
  const p = docx.createP();
  p.addText(`${test.name} (${test.path}): `, { bold: true });
  p.addText(test.description);
  p.addLineBreak();
});

// Create a write stream to save the document
const out = fs.createWriteStream(path.join(__dirname, 'project-code-documentation.docx'));

// Save the document
docx.generate(out);

console.log('Word document created successfully: project-code-documentation.docx');
