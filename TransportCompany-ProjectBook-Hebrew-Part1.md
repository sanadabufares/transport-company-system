# מערכת ניהול חברת תחבורה
### תיעוד פרויקט

**שם הסטודנט:** [השם שלך]  
**מספר זהות:** [מספר הזהות שלך]  
**קורס:** [שם הקורס]  
**מרצה:** [שם המרצה]  
**תאריך:** 25 באוקטובר, 2025

## תוכן עניינים

1. [מבוא](#1-מבוא)
2. [סקירת הפרויקט](#2-סקירת-הפרויקט)
3. [ארכיטקטורת המערכת](#3-ארכיטקטורת-המערכת)
4. [תכנון מסד הנתונים](#4-תכנון-מסד-הנתונים)
5. [תיעוד ה-API](#5-תיעוד-ה-api)
6. [ממשק משתמש](#6-ממשק-משתמש)
7. [בדיקות](#7-בדיקות)
8. [פריסה](#8-פריסה)
9. [שיפורים עתידיים](#9-שיפורים-עתידיים)
10. [סיכום](#10-סיכום)
11. [מקורות](#11-מקורות)

## 1. מבוא

### 1.1 מטרה
מסמך זה מספק תיעוד מקיף למערכת ניהול חברת התחבורה, אפליקציית אינטרנט שתוכננה לסייע בניהול שירותי תחבורה בין חברות ונהגים.

### 1.2 היקף
המערכת מאפשרת לחברות תחבורה ליצור בקשות נסיעה, לנהל נהגים ולעקוב אחר סטטוס הנסיעות. נהגים יכולים לצפות בנסיעות זמינות, לקבל או לדחות בקשות נסיעה ולעדכן את זמינותם. המערכת כוללת גם ממשק ניהול למנהל המערכת לניהול משתמשים ופיקוח על המערכת.

### 1.3 טכנולוגיות בשימוש
- **צד לקוח**: React.js, React Bootstrap, Context API
- **צד שרת**: Node.js, Express.js
- **מסד נתונים**: MySQL
- **אימות**: JSON Web Tokens (JWT)
- **כלים נוספים**: Axios, Jest (בדיקות)

## 2. סקירת הפרויקט

### 2.1 הצגת הבעיה
חברות תחבורה מתמודדות לעתים קרובות עם קשיים בניהול יעיל של צי הנהגים שלהן ושיבוץ נסיעות. השיטות המסורתיות של שיחות טלפון ותזמון ידני מובילות לחוסר יעילות, תקשורת לקויה והקצאת משאבים לא אופטימלית.

### 2.2 פתרון
מערכת ניהול חברת התחבורה מספקת פלטפורמה מרכזית שבה:
- חברות יכולות לפרסם דרישות נסיעה
- נהגים יכולים לצפות ולקבל נסיעות שמתאימות לזמינות שלהם
- שני הצדדים יכולים לתקשר דרך הפלטפורמה
- סטטוס הנסיעה והיסטוריה מתועדים
- דירוגים ומשוב משפרים את איכות השירות

### 2.3 תפקידי משתמשים
1. **מנהל מערכת**: מנהל מערכת עם גישה מלאה לניהול משתמשים והגדרות מערכת
2. **חברה**: חברות תחבורה שיוצרות בקשות נסיעה
3. **נהג**: נהגים שמבצעים את בקשות התחבורה

### 2.4 תכונות מרכזיות
- רישום ואימות משתמשים
- ניהול פרופיל לחברות ונהגים
- יצירת וניהול נסיעות
- ניהול זמינות נהגים
- מערכת בקשות נסיעה
- מערכת התראות
- דוחות וניתוח נתונים
- מערכת דירוג

## 3. ארכיטקטורת המערכת

### 3.1 ארכיטקטורה ברמה גבוהה
המערכת פועלת לפי ארכיטקטורת לקוח-שרת עם חזית React.js, שרת Node.js/Express וקצה אחורי של מסד נתונים MySQL.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  React.js   │◄───►│  Express.js │◄───►│   MySQL     │
│  חזית       │     │  שרת        │     │  מסד נתונים │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 3.2 תרשים רכיבים
```
┌─────────────────────────────────────────────────────┐
│                     צד לקוח                        │
├─────────────┬─────────────────────┬────────────────┤
│  רכיבי      │  לוח מחוונים חברה  │ רכיבי          │
│  אימות     │  וניהול נסיעות     │ נהג            │
├─────────────┼─────────────────────┼────────────────┤
│             │  לוח מחוונים מנהל  │ רכיבים         │
│  קונטקסט   │  וניהול משתמשים   │ משותפים        │
│             │                     │ (כותרת וכו')  │
└─────────────┴─────────────────────┴────────────────┘

┌─────────────────────────────────────────────────────┐
│                     צד שרת                         │
├─────────────┬─────────────────────┬────────────────┤
│  נתיבי     │  נתיבי             │ נתיבי          │
│  אימות     │  חברה              │ נהג            │
├─────────────┼─────────────────────┼────────────────┤
│  נתיבי     │  נתיבי             │ נתיבי          │
│  מנהל      │  נסיעה             │ התראות         │
├─────────────┴─────────────────────┴────────────────┤
│                 מודלים                             │
├─────────────────────────────────────────────────────┤
│                 גישה למסד נתונים                   │
└─────────────────────────────────────────────────────┘
```

### 3.3 פרטי מחסנית הטכנולוגיה
- **צד לקוח**:
  - React.js לרכיבי ממשק משתמש
  - React Router לניווט
  - Context API לניהול מצב
  - React Bootstrap לעיצוב ממשק משתמש
  - Axios לתקשורת API

- **צד שרת**:
  - סביבת ריצה Node.js
  - מסגרת אינטרנט Express.js
  - JSON Web Tokens לאימות
  - MySQL לאחסון נתונים
  - Jest לבדיקות יחידה

## 4. תכנון מסד הנתונים

### 4.1 תרשים יישויות-קשרים
מסד הנתונים מורכב מהישויות העיקריות הבאות:
- משתמשים
- חברות
- נהגים
- נסיעות
- בקשות נסיעה
- דירוגים
- התראות

### 4.2 סכמת מסד הנתונים

#### טבלת משתמשים
```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'company', 'driver') NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### טבלת חברות
```sql
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(255),
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### טבלת נהגים
```sql
CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  license_number VARCHAR(50) NOT NULL,
  license_expiry DATE NOT NULL,
  vehicle_type ENUM('8', '14', '19') NOT NULL,
  vehicle_plate VARCHAR(20) NOT NULL,
  current_location VARCHAR(255),
  available_from DATETIME DEFAULT NULL,
  available_to DATETIME DEFAULT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### טבלת נסיעות
```sql
CREATE TABLE IF NOT EXISTS trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  driver_id INT NULL,
  pickup_location VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  trip_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  passenger_count INT NOT NULL,
  vehicle_type ENUM('8', '14', '19') NOT NULL,
  company_price DECIMAL(10, 2) NOT NULL,
  driver_price DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  visa_number VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);
```

#### טבלת בקשות נסיעה
```sql
CREATE TABLE IF NOT EXISTS trip_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  driver_id INT NOT NULL,
  request_type ENUM('driver_to_company', 'company_to_driver', 'reassignment_approval') NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  UNIQUE KEY unique_trip_driver (trip_id, driver_id)
);
```

#### טבלת דירוגים
```sql
CREATE TABLE IF NOT EXISTS ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  rater_id INT NOT NULL,
  rater_type ENUM('company', 'driver') NOT NULL,
  rated_id INT NOT NULL,
  rated_type ENUM('company', 'driver') NOT NULL,
  rating DECIMAL(3,2) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  UNIQUE KEY unique_rating (trip_id, rater_id, rater_type, rated_id, rated_type)
);
```

#### טבלת התראות
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.3 קשרים
- משתמש אחד יכול להיות משויך לחברה אחת או לנהג אחד
- חברה יכולה ליצור מספר נסיעות
- נהג יכול להיות משויך למספר נסיעות (אך לא בו-זמנית)
- נסיעה יכולה לקבל מספר בקשות נסיעה מנהגים שונים
- נסיעה יכולה לקבל מספר דירוגים (הן מהחברה והן מהנהג)
- למשתמשים יכולות להיות מספר התראות
