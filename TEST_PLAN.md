# Transport Company Application Test Plan

## Overview

This document outlines the comprehensive testing strategy for the Transport Company application. It includes unit tests, integration tests, and end-to-end tests for both the client and server components.

## Test Environment Setup

### Server
- **Test Database**: A separate test database (`transport_company_test`) is used for testing
- **Test Framework**: Jest
- **API Testing**: Supertest
- **Setup**: Run `npm run setup-test-db` to initialize the test database

### Client
- **Test Framework**: Jest
- **Component Testing**: React Testing Library
- **Mock Services**: Axios mocking for API calls

## Test Categories

### 1. Unit Tests

#### Server-side Unit Tests

##### Models
- [ ] User Model
  - [ ] `findById`
  - [ ] `findByUsername`
  - [ ] `findByEmail`
  - [ ] `create`
  - [ ] `update`
  - [ ] `updatePassword`
  - [ ] `delete`

- [ ] Driver Model
  - [x] `findByUserId`
  - [ ] `findById`
  - [ ] `create`
  - [ ] `update`
  - [ ] `updateAvailability`
  - [ ] `hasTripConflict`

- [ ] Company Model
  - [ ] `findByUserId`
  - [ ] `findById`
  - [ ] `create`
  - [ ] `update`

- [x] Trip Model
  - [x] `create`
  - [x] `findById`
  - [x] `findByCompanyId`
  - [x] `findByDriverId`
  - [x] `update`
  - [x] `delete`
  - [x] `assignDriver`
  - [x] `unassignDriver`
  - [x] `updateStatus`
  - [x] `getAvailableDriversForTrip`
  - [x] `getAvailableTripsForDriver`

- [ ] TripRequest Model
  - [ ] `create`
  - [ ] `findById`
  - [ ] `findByTripAndDriver`
  - [ ] `getByDriverId`
  - [ ] `getByCompanyId`
  - [ ] `updateStatus`
  - [ ] `delete`

- [ ] Notification Model
  - [ ] `create`
  - [ ] `findByUserId`
  - [ ] `markAsRead`
  - [ ] `markAllAsRead`
  - [ ] `countUnreadByUserId`

##### Controllers

- [ ] Auth Controller
  - [ ] `register`
  - [ ] `login`
  - [ ] `getMe`
  - [ ] `updatePassword`

- [ ] Driver Controller
  - [x] `getProfile`
  - [ ] `updateProfile`
  - [ ] `updateAvailability`
  - [ ] `getDriverTrips`
  - [ ] `getAvailableTrips`
  - [ ] `getTripRequests`
  - [ ] `sendTripRequest`
  - [ ] `acceptTripRequest`
  - [ ] `rejectTripRequest`
  - [ ] `getDriverStats`
  - [ ] `getRecentTrips`
  - [ ] `getUnreadNotificationsCount`
  - [ ] `getTripRequestsCount`

- [ ] Company Controller
  - [ ] `getProfile`
  - [ ] `updateProfile`
  - [ ] `createTrip`
  - [ ] `getTrips`
  - [ ] `getTripById`
  - [ ] `updateTrip`
  - [ ] `deleteTrip`
  - [ ] `getAvailableDrivers`
  - [ ] `getAllDriversForTrip`
  - [ ] `sendDriverRequest`
  - [ ] `getTripRequests`
  - [ ] `getUnreadNotificationsCount`
  - [ ] `getTripRequestsCount`

- [ ] Admin Controller
  - [ ] `getPendingApprovals`
  - [ ] `approveUser`
  - [ ] `rejectUser`
  - [ ] `getAllCompanies`
  - [ ] `getAllDrivers`
  - [ ] `getStats`

#### Client-side Unit Tests

##### Context
- [x] AuthContext
  - [x] Initialization with/without token
  - [x] Loading user profile
  - [x] Login functionality
  - [x] Logout functionality
  - [x] Registration functionality

##### Components

###### Common Components
- [x] Header
  - [x] Rendering different navigation based on user role
  - [x] Notification badge display
  - [x] Logout functionality
- [ ] Footer
- [x] PrivateRoute
- [ ] Notifications
- [ ] Profile

###### Auth Components
- [x] Login
- [ ] RegisterCompany
- [ ] RegisterDriver

###### Driver Components
- [x] Dashboard
- [ ] Availability
- [ ] Trips
- [ ] AvailableTrips
- [ ] TripRequests

###### Company Components
- [x] Dashboard
- [ ] Trips
- [ ] CreateTrip
- [ ] EditTrip
- [ ] TripRequests
- [ ] AvailableDrivers
- [ ] AllDrivers

###### Admin Components
- [ ] Dashboard
- [ ] PendingApprovals
- [ ] CompanyList
- [ ] DriverList

### 2. Integration Tests

#### Server-side Integration Tests

- [x] Authentication Flow
  - [x] Register -> Login -> Get Profile
  - [x] Login -> Update Profile -> Verify Changes

- [x] Trip Management Flow
  - [x] Create Trip -> Get Trips -> Update Trip -> Delete Trip
  - [x] Create Trip -> Get Available Drivers -> Send Driver Request

- [x] Driver-Company Interaction
  - [x] Driver sets availability -> Company creates trip -> Driver appears in available drivers
  - [x] Company sends request -> Driver accepts -> Trip status updates

#### Client-side Integration Tests

- [ ] Authentication Flow
  - [ ] Login form submission -> Redirect to dashboard
  - [ ] Registration form submission -> Redirect to login

- [ ] Trip Management Flow
  - [ ] Create trip form submission -> Trip appears in list
  - [ ] Edit trip -> Changes reflected in trip details

- [ ] Driver-Company Interaction
  - [ ] Company sends request -> Request appears in driver's list
  - [ ] Driver accepts request -> Trip appears in driver's active trips

### 3. End-to-End Tests

- [ ] User Registration and Approval
  - [ ] Company registration -> Admin approval -> Company login
  - [ ] Driver registration -> Admin approval -> Driver login

- [ ] Complete Trip Lifecycle
  - [ ] Company creates trip -> Driver accepts -> Trip completed -> Rating submitted

- [ ] Notification System
  - [ ] Actions trigger notifications -> Notifications appear in list -> Mark as read

## Running Tests

### Server Tests
```bash
# Run all server tests
cd server
npm test

# Run with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx jest __tests__/models/driver.test.js
```

### Client Tests
```bash
# Run all client tests
cd client
npm test

# Run with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx jest src/__tests__/components/Header.test.js
```

### Integration Tests
```bash
# Run all integration tests
npm run test:integration

# Run specific integration test file
npx mocha __tests__/integration/auth.test.js --timeout 10000
```

## Continuous Integration

For CI/CD pipeline integration, the following steps should be included:

1. Set up test database
2. Run server tests
3. Run client tests
4. Run integration tests
5. Generate and publish coverage reports
6. Fail the build if coverage thresholds are not met
