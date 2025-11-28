import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom render function that wraps components with necessary providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @returns {Object} Rendered component with utilities
 */
export function renderWithProviders(ui, options = {}) {
  const {
    initialAuthState = {
      currentUser: null,
      userProfile: null,
      loading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      registerCompany: jest.fn(),
      registerDriver: jest.fn(),
      setError: jest.fn(),
      refreshDashboard: false,
      triggerDashboardRefresh: jest.fn()
    },
    ...renderOptions
  } = options;

  function Wrapper({ children }) {
    return (
      <AuthContext.Provider value={initialAuthState}>
        <BrowserRouter>{children}</BrowserRouter>
      </AuthContext.Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Create a mock authenticated user
 * @param {String} role - User role (admin, company, driver)
 * @returns {Object} Mock user object
 */
export function createMockUser(role = 'driver') {
  return {
    id: 1,
    username: `test${role}`,
    email: `test${role}@example.com`,
    role
  };
}

/**
 * Create a mock profile based on user role
 * @param {String} role - User role (admin, company, driver)
 * @returns {Object} Mock profile object
 */
export function createMockProfile(role = 'driver') {
  if (role === 'company') {
    return {
      id: 1,
      company_name: 'Test Company',
      contact_person: 'John Smith',
      phone: '123-456-7890',
      address: '123 Main St, Test City',
      rating: 4.5
    };
  } else if (role === 'driver') {
    return {
      id: 1,
      first_name: 'Test',
      last_name: 'Driver',
      phone: '987-654-3210',
      address: '456 Oak St, Test City',
      license_number: 'DL12345',
      license_expiry: '2025-12-31',
      vehicle_type: 8,
      vehicle_plate: 'ABC123',
      current_location: 'Test City',
      available_from: '2025-01-01 08:00:00',
      available_to: '2025-12-31 18:00:00',
      rating: 4.8
    };
  } else {
    return {
      id: 1,
      username: 'admin',
      email: 'admin@example.com'
    };
  }
}

/**
 * Mock localStorage for testing
 * @returns {Object} Mock localStorage object
 */
export function mockLocalStorage() {
  const store = {};
  
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => {
        delete store[key];
      });
    })
  };
}

/**
 * Wait for a specified time
 * @param {Number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the specified time
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
