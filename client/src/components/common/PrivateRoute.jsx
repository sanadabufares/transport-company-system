import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';

const PrivateRoute = ({ children, role }) => {
  const { currentUser, loading } = useContext(AuthContext);

  // If still loading, show a loading indicator
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If role is specified and user doesn't have that role, redirect to their dashboard
  if (role && currentUser.role !== role) {
    switch (currentUser.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" />;
      case 'company':
        return <Navigate to="/company/dashboard" />;
      case 'driver':
        return <Navigate to="/driver/dashboard" />;
      default:
        return <Navigate to="/login" />;
    }
  }

  // Otherwise, render the children
  return children;
};

export default PrivateRoute;
