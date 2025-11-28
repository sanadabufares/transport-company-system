import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Authentication and context
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';

// Common components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import NotFound from './components/common/NotFound';
import Notifications from './components/common/Notifications';
import Profile from './components/common/Profile';

// Auth pages
import Login from './components/auth/Login';
import RegisterCompany from './components/auth/RegisterCompany';
import RegisterDriver from './components/auth/RegisterDriver';

// Admin pages
import AdminDashboard from './components/admin/Dashboard';
import PendingApprovals from './components/admin/PendingApprovals';
import CompanyList from './components/admin/CompanyList';
import DriverList from './components/admin/DriverList';

// Company pages
import CompanyDashboard from './components/company/Dashboard';
import CompanyTrips from './components/company/Trips';
import CreateTrip from './components/company/CreateTrip';
import EditTrip from './components/company/EditTrip';
import TripRequests from './components/company/TripRequests';
import AvailableDrivers from './components/company/AvailableDrivers';
import AllDrivers from './components/company/AllDrivers'; // Import the new component
import RateDriver from './components/company/RateDriver';
import CompanyReports from './components/company/Reports';

// Driver pages
import DriverDashboard from './components/driver/Dashboard';
import DriverAvailability from './components/driver/Availability';
import DriverTrips from './components/driver/Trips';
import DriverAvailableTrips from './components/driver/AvailableTrips';
import DriverTripRequests from './components/driver/TripRequests';
import DriverReports from './components/driver/Reports';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App d-flex flex-column min-vh-100">
          <Header />
          <main className="flex-grow-1 container py-4">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register/company" element={<RegisterCompany />} />
              <Route path="/register/driver" element={<RegisterDriver />} />
              
              {/* Redirect root to login */}
              <Route path="/" element={<Navigate to="/login" />} />
              
              {/* Admin routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <PrivateRoute role="admin">
                    <AdminDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/profile" 
                element={
                  <PrivateRoute role="admin">
                    <Profile />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/notifications" 
                element={
                  <PrivateRoute role="admin">
                    <Notifications />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/pending-approvals" 
                element={
                  <PrivateRoute role="admin">
                    <PendingApprovals />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/companies" 
                element={
                  <PrivateRoute role="admin">
                    <CompanyList />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/drivers" 
                element={
                  <PrivateRoute role="admin">
                    <DriverList />
                  </PrivateRoute>
                } 
              />
              
              {/* Company routes */}
              <Route 
                path="/company/dashboard" 
                element={
                  <PrivateRoute role="company">
                    <CompanyDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/company/profile" 
                element={
                  <PrivateRoute role="company">
                    <Profile />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/company/trips" 
                element={
                  <PrivateRoute role="company">
                    <CompanyTrips />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/company/trips/create" 
                element={
                  <PrivateRoute role="company">
                    <CreateTrip />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/company/trips/edit/:tripId" 
                element={
                  <PrivateRoute role="company">
                    <EditTrip />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/company/trip-requests" 
                element={
                  <PrivateRoute role="company">
                    <TripRequests />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/company/available-drivers/:tripId" 
                element={
                  <PrivateRoute role="company">
                    <AvailableDrivers />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/company/all-drivers/:tripId" 
                element={
                  <PrivateRoute role="company">
                    <AllDrivers />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/company/reports" 
                element={
                  <PrivateRoute role="company">
                    <CompanyReports />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/company/notifications" 
                element={
                  <PrivateRoute role="company">
                    <Notifications />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/company/rate-driver/:tripId" 
                element={
                  <PrivateRoute role="company">
                    <RateDriver />
                  </PrivateRoute>
                } 
              />
              
              {/* Driver routes */}
              <Route 
                path="/driver/dashboard" 
                element={
                  <PrivateRoute role="driver">
                    <DriverDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/driver/profile" 
                element={
                  <PrivateRoute role="driver">
                    <Profile />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/driver/availability" 
                element={
                  <PrivateRoute role="driver">
                    <DriverAvailability />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/driver/trips" 
                element={
                  <PrivateRoute role="driver">
                    <DriverTrips />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/driver/available-trips" 
                element={
                  <PrivateRoute role="driver">
                    <DriverAvailableTrips />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/driver/trip-requests" 
                element={
                  <PrivateRoute role="driver">
                    <DriverTripRequests />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/driver/reports" 
                element={
                  <PrivateRoute role="driver">
                    <DriverReports />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/driver/notifications" 
                element={
                  <PrivateRoute role="driver">
                    <Notifications />
                  </PrivateRoute>
                } 
              />
              
              {/* Not found route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
