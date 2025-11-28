import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext.jsx';
import PrivateRoute from '../../../components/common/PrivateRoute.jsx';

// Mock the Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }) => <div data-testid="navigate" data-to={to}>Redirecting to {to}</div>
  };
});

describe('PrivateRoute Component', () => {
  it('shows loading spinner when loading is true', () => {
    // Mock auth context with loading state
    const mockAuthContext = {
      currentUser: null,
      loading: true
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <PrivateRoute>
            <div>Protected Content</div>
          </PrivateRoute>
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Check for loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Protected content should not be visible
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    // Mock auth context with no user
    const mockAuthContext = {
      currentUser: null,
      loading: false
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <PrivateRoute>
            <div>Protected Content</div>
          </PrivateRoute>
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Check for redirect to login
    const navigate = screen.getByTestId('navigate');
    expect(navigate).toBeInTheDocument();
    expect(navigate.getAttribute('data-to')).toBe('/login');
    
    // Protected content should not be visible
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to appropriate dashboard when user role does not match required role', () => {
    // Mock auth context with company user
    const mockAuthContext = {
      currentUser: { id: 1, role: 'company' },
      loading: false
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <PrivateRoute role="driver">
            <div>Driver Content</div>
          </PrivateRoute>
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Check for redirect to company dashboard
    const navigate = screen.getByTestId('navigate');
    expect(navigate).toBeInTheDocument();
    expect(navigate.getAttribute('data-to')).toBe('/company/dashboard');
    
    // Driver content should not be visible
    expect(screen.queryByText('Driver Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated and role matches', () => {
    // Mock auth context with driver user
    const mockAuthContext = {
      currentUser: { id: 1, role: 'driver' },
      loading: false
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <PrivateRoute role="driver">
            <div>Driver Content</div>
          </PrivateRoute>
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Protected content should be visible
    expect(screen.getByText('Driver Content')).toBeInTheDocument();
    
    // No redirect should occur
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated and no role is required', () => {
    // Mock auth context with any authenticated user
    const mockAuthContext = {
      currentUser: { id: 1, role: 'admin' },
      loading: false
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <PrivateRoute>
            <div>Protected Content</div>
          </PrivateRoute>
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Protected content should be visible
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    
    // No redirect should occur
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });
});
