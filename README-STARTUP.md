# Transport Company - Startup Guide

## ✅ Prerequisites
1. **XAMPP Control Panel** running
2. **MySQL service** started in XAMPP (green checkmark)
3. **Node.js** installed

## 🚀 Quick Start

### Method 1: Standard Commands (Now Working!)

**Terminal 1 - Backend Server:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend Client:**
```bash
cd client
npm start
```

### Method 2: Double-Click Startup
1. Double-click: `start-both-servers.bat`

## 🔑 Login Credentials
- **Username:** `admin`
- **Password:** `admin123`

## 🔧 Troubleshooting Commands

### First Time Setup (if needed):
```bash
cd server
npm run setup-db
```

### Test Database Connection:
```bash
cd server
npm run test-db
```

### Check if Servers are Running:
```bash
node check-servers.js
```

## 📱 Access URLs
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Test Backend:** http://localhost:5000/api/test

## ✅ Success Indicators

**Backend Server Should Show:**
```
🚀 Transport Company Server running on port 5000
✅ XAMPP MySQL database connected successfully
✅ Admin user ready - Username: admin, Password: admin123
```

**Frontend Client Should Show:**
```
webpack compiled successfully
Local: http://localhost:3000
```

## 🐛 Common Issues

1. **ERR_CONNECTION_REFUSED:** Make sure both servers are running
2. **Database connection failed:** Start XAMPP MySQL service
3. **Admin user not found:** Run `npm run setup-db` in server folder

---
*Your login issue has been fixed with XAMPP MySQL integration!*
