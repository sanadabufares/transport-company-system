# Transport Company Management System
### Project Documentation

**Student Name:** [Your Name]  
**ID:** [Your ID]  
**Course:** [Course Name]  
**Instructor:** [Instructor Name]  
**Date:** October 25, 2025

## Table of Contents

1. [Introduction](#1-introduction)
2. [Project Overview](#2-project-overview)
3. [System Architecture](#3-system-architecture)
4. [Database Design](#4-database-design)
5. [API Documentation](#5-api-documentation)
6. [User Interface](#6-user-interface)
7. [Testing](#7-testing)
8. [Deployment](#8-deployment)
9. [Future Enhancements](#9-future-enhancements)
10. [Conclusion](#10-conclusion)
11. [References](#11-references)

## 1. Introduction

### 1.1 Purpose
This document provides comprehensive documentation for the Transport Company Management System, a web application designed to facilitate the management of transportation services between companies and drivers.

### 1.2 Scope
The system allows transportation companies to create trip requests, manage drivers, and track trip status. Drivers can view available trips, accept or reject trip requests, and update their availability. The system also includes an administrative interface for user management and system oversight.

### 1.3 Technologies Used
- **Frontend**: React.js, React Bootstrap, Context API
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JSON Web Tokens (JWT)
- **Other Tools**: Axios, Jest (testing)

## 2. Project Overview

### 2.1 Problem Statement
Transportation companies often struggle with efficiently managing their fleet of drivers and trip assignments. The traditional methods of phone calls and manual scheduling lead to inefficiencies, miscommunications, and suboptimal resource allocation.

### 2.2 Solution
The Transport Company Management System provides a centralized platform where:
- Companies can post trip requirements
- Drivers can view and accept trips that match their availability
- Both parties can communicate through the platform
- Trip status and history are tracked
- Ratings and feedback improve service quality

### 2.3 User Roles
1. **Admin**: System administrator with full access to manage users and system settings
2. **Company**: Transportation companies that create trip requests
3. **Driver**: Drivers who fulfill the transportation requests

### 2.4 Key Features
- User registration and authentication
- Profile management for companies and drivers
- Trip creation and management
- Driver availability management
- Trip request system
- Notification system
- Reporting and analytics
- Rating system

## 3. System Architecture

### 3.1 High-Level Architecture
The system follows a client-server architecture with a React.js frontend, Node.js/Express backend, and MySQL database.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  React.js   │◄───►│  Express.js │◄───►│   MySQL     │
│  Frontend   │     │  Backend    │     │  Database   │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 3.2 Component Diagram
```
┌─────────────────────────────────────────────────────┐
│                     Frontend                        │
├─────────────┬─────────────────────┬────────────────┤
│  Auth       │  Company Dashboard  │ Driver         │
│  Components │  & Trip Management  │ Components     │
├─────────────┼─────────────────────┼────────────────┤
│             │  Admin Dashboard    │ Common         │
│  Context    │  & User Management  │ Components     │
│             │                     │ (Header, etc.) │
└─────────────┴─────────────────────┴────────────────┘

┌─────────────────────────────────────────────────────┐
│                     Backend                         │
├─────────────┬─────────────────────┬────────────────┤
│  Auth       │  Company            │ Driver         │
│  Routes     │  Routes             │ Routes         │
├─────────────┼─────────────────────┼────────────────┤
│  Admin      │  Trip               │ Notification   │
│  Routes     │  Routes             │ Routes         │
├─────────────┴─────────────────────┴────────────────┤
│                 Models                              │
├─────────────────────────────────────────────────────┤
│                 Database Access                     │
└─────────────────────────────────────────────────────┘
```

### 3.3 Technology Stack Details
- **Frontend**:
  - React.js for UI components
  - React Router for navigation
  - Context API for state management
  - React Bootstrap for UI styling
  - Axios for API communication

- **Backend**:
  - Node.js runtime environment
  - Express.js web framework
  - JSON Web Tokens for authentication
  - MySQL for data storage
  - Jest for unit testing

## 4. Database Design

### 4.1 Entity-Relationship Diagram
The database consists of the following main entities:
- Users
- Companies
- Drivers
- Trips
- Trip Requests
- Ratings
- Notifications

### 4.2 Database Schema

#### Users Table
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

#### Companies Table
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

#### Drivers Table
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

#### Trips Table
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

#### Trip Requests Table
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

#### Ratings Table
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

#### Notifications Table
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

### 4.3 Relationships
- One User can be associated with one Company or one Driver
- A Company can create multiple Trips
- A Driver can be assigned to multiple Trips (but not simultaneously)
- A Trip can have multiple Trip Requests from different Drivers
- A Trip can have multiple Ratings (from both Company and Driver)
- Users can have multiple Notifications

## 5. API Documentation

### 5.1 Authentication Endpoints

#### Register User
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string",
    "role": "company|driver"
  }
  ```
- **Response**: User object with token

#### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: User object with token

### 5.2 Company Endpoints

#### Update Profile
- **URL**: `/api/company/profile`
- **Method**: `PUT`
- **Auth**: Required (Company)
- **Request Body**:
  ```json
  {
    "company_name": "string",
    "contact_person": "string",
    "phone": "string",
    "address": "string",
    "description": "string"
  }
  ```
- **Response**: Success message

#### Get Profile
- **URL**: `/api/company/profile`
- **Method**: `GET`
- **Auth**: Required (Company)
- **Response**: Company profile object

#### Create Trip
- **URL**: `/api/company/trips`
- **Method**: `POST`
- **Auth**: Required (Company)
- **Request Body**:
  ```json
  {
    "pickup_location": "string",
    "destination": "string",
    "trip_date": "YYYY-MM-DD",
    "departure_time": "HH:MM:SS",
    "passenger_count": "number",
    "vehicle_type": "8|14|19",
    "company_price": "number",
    "driver_price": "number",
    "visa_number": "string",
    "special_instructions": "string"
  }
  ```
- **Response**: Trip ID and success message

#### Get Trips
- **URL**: `/api/company/trips`
- **Method**: `GET`
- **Auth**: Required (Company)
- **Response**: Array of trip objects

### 5.3 Driver Endpoints

#### Update Profile
- **URL**: `/api/driver/profile`
- **Method**: `PUT`
- **Auth**: Required (Driver)
- **Request Body**:
  ```json
  {
    "first_name": "string",
    "last_name": "string",
    "phone": "string",
    "address": "string",
    "license_number": "string",
    "license_expiry": "YYYY-MM-DD",
    "vehicle_type": "8|14|19",
    "vehicle_plate": "string"
  }
  ```
- **Response**: Success message

#### Update Availability
- **URL**: `/api/driver/availability`
- **Method**: `PUT`
- **Auth**: Required (Driver)
- **Request Body**:
  ```json
  {
    "available_from": "YYYY-MM-DD HH:MM:SS",
    "available_to": "YYYY-MM-DD HH:MM:SS",
    "current_location": "string"
  }
  ```
- **Response**: Success message

#### Get Available Trips
- **URL**: `/api/driver/available-trips`
- **Method**: `GET`
- **Auth**: Required (Driver)
- **Response**: Array of available trip objects

### 5.4 Admin Endpoints

#### Get Pending Approvals
- **URL**: `/api/admin/pending-approvals`
- **Method**: `GET`
- **Auth**: Required (Admin)
- **Response**: Array of pending user objects

#### Approve User
- **URL**: `/api/admin/users/:id/approve`
- **Method**: `PUT`
- **Auth**: Required (Admin)
- **Response**: Success message

#### Reject User
- **URL**: `/api/admin/users/:id/reject`
- **Method**: `DELETE`
- **Auth**: Required (Admin)
- **Response**: Success message

### 5.5 Trip Request Endpoints

#### Send Driver Request
- **URL**: `/api/company/trips/:tripId/request/:driverId`
- **Method**: `POST`
- **Auth**: Required (Company)
- **Response**: Request ID and success message

#### Accept Trip Request
- **URL**: `/api/driver/trip-requests/:requestId/accept`
- **Method**: `PUT`
- **Auth**: Required (Driver)
- **Response**: Success message

#### Reject Trip Request
- **URL**: `/api/driver/trip-requests/:requestId/reject`
- **Method**: `PUT`
- **Auth**: Required (Driver)
- **Response**: Success message

## 6. User Interface

### 6.1 User Flow Diagrams

#### Company User Flow
```
Login/Register → Dashboard → Create Trip → View Trips → 
Send Driver Requests → Manage Trip Requests → View Trip Details →
Rate Driver → View Reports
```

#### Driver User Flow
```
Login/Register → Dashboard → Update Availability → 
View Available Trips → View Trip Requests → Accept/Reject Requests →
View Assigned Trips → Update Trip Status → Rate Company → View Reports
```

#### Admin User Flow
```
Login → Dashboard → View Pending Approvals → Approve/Reject Users →
Manage Companies → Manage Drivers → View System Reports
```

### 6.2 Key UI Components

#### Navigation
The application uses a responsive navigation bar with role-based menu items:
- **Guest**: Home, Login, Register
- **Company**: Dashboard, Profile, Trips, Trip Requests, Reports, Notifications
- **Driver**: Dashboard, Profile, Availability, Trips, Trip Requests, Reports, Notifications
- **Admin**: Dashboard, Pending Approvals, Companies, Drivers

#### Dashboard
Each user role has a custom dashboard showing relevant information:
- **Company**: Trip statistics, recent trips, pending requests
- **Driver**: Upcoming trips, available trips, earnings
- **Admin**: System statistics, recent registrations, pending approvals

#### Forms
The application includes various forms for data entry:
- Registration forms
- Profile update forms
- Trip creation form
- Availability update form
- Rating form

### 6.3 Responsive Design
The UI is built with React Bootstrap to ensure responsiveness across devices:
- Mobile-friendly layout
- Responsive tables
- Collapsible navigation
- Optimized forms for different screen sizes

### 6.4 UI Screenshots
[Include screenshots of key interfaces here]

## 7. Testing

### 7.1 Testing Strategy
The application follows a comprehensive testing strategy that includes:
- Unit testing for individual components and functions
- Integration testing for API endpoints
- End-to-end testing for critical user flows

### 7.2 Unit Tests
Unit tests are written using Jest and focus on testing:
- Controller functions
- Model methods
- Utility functions
- React component rendering

Example of a controller test:
```javascript
describe('Company Controller', () => {
  describe('updateProfile', () => {
    it('should update company profile successfully', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5, company_name: 'Test Company' };

      // Mock the model functions
      Company.findByUserId.mockResolvedValueOnce(mockCompany);
      Company.update.mockResolvedValueOnce(true);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        body: {
          company_name: 'Updated Company',
          contact_person: 'Updated Contact',
          phone: '111-222-3333',
          address: '456 Updated St'
        }
      });

      // Call the controller function
      await companyController.updateProfile(req, res);

      // Assertions
      expect(Company.findByUserId).toHaveBeenCalledWith(5);
      expect(Company.update).toHaveBeenCalledWith(1, {
        company_name: 'Updated Company',
        contact_person: 'Updated Contact',
        phone: '111-222-3333',
        address: '456 Updated St'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company profile updated successfully'
      });
    });
  });
});
```

### 7.3 API Testing
API endpoints are tested to ensure they:
- Return the correct status codes
- Validate input data properly
- Apply authentication and authorization correctly
- Return the expected response format

### 7.4 Test Coverage
The test suite aims to achieve high coverage of:
- Critical business logic
- Error handling paths
- Authentication and authorization
- Data validation

## 8. Deployment

### 8.1 Deployment Architecture
The application is deployed using a three-tier architecture:
- Frontend: Static hosting (e.g., Netlify, Vercel)
- Backend: Node.js server (e.g., Heroku, AWS EC2)
- Database: MySQL database (e.g., AWS RDS, DigitalOcean)

### 8.2 Deployment Process
1. Build the React frontend application
2. Deploy the frontend to a static hosting service
3. Set up the Node.js backend on a server
4. Configure the MySQL database
5. Set up environment variables for sensitive information
6. Configure CORS to allow frontend-backend communication
7. Set up monitoring and logging

### 8.3 Environment Configuration
The application uses environment variables for configuration:
- Database connection details
- JWT secret key
- API URLs
- Email service credentials
- Logging configuration

### 8.4 Scaling Considerations
The application is designed with scalability in mind:
- Stateless backend for horizontal scaling
- Database connection pooling
- Caching for frequently accessed data
- Optimized queries for performance

## 9. Future Enhancements

### 9.1 Short-term Enhancements
- Mobile application for drivers
- Real-time location tracking
- In-app messaging system
- Payment integration
- Document upload for driver verification

### 9.2 Long-term Vision
- AI-based trip matching algorithm
- Predictive analytics for demand forecasting
- Integration with mapping services
- Multi-language support
- Advanced reporting and business intelligence

## 10. Conclusion

The Transport Company Management System provides a comprehensive solution for managing transportation services between companies and drivers. The system streamlines the process of trip creation, driver assignment, and trip management, leading to improved efficiency and better user experience.

The application demonstrates the use of modern web development technologies and follows best practices in software architecture, security, and user interface design. The modular design allows for future enhancements and scaling as the user base grows.

## 11. References

- React.js Documentation: https://reactjs.org/docs/getting-started.html
- Node.js Documentation: https://nodejs.org/en/docs/
- Express.js Documentation: https://expressjs.com/
- MySQL Documentation: https://dev.mysql.com/doc/
- React Bootstrap Documentation: https://react-bootstrap.github.io/
- JWT Authentication: https://jwt.io/introduction/
- Jest Testing Framework: https://jestjs.io/docs/getting-started
