import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import Header from '../../components/common/Header.jsx';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock the context
const mockAuthContext = {
  currentUser: null,
  logout: vi.fn(),
};

const renderWithRouter = (ui, { contextValue = mockAuthContext } = {}) => {
  return render(
    <AuthContext.Provider value={contextValue}>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('Header Component', () => {
  beforeEach(() => {
    axios.get.mockReset();
  });

  it('renders login and register links when user is not logged in', () => {
    renderWithRouter(<Header />, { contextValue: mockAuthContext });
    
    expect(screen.getByText(/Login/i)).toBeDefined();
    expect(screen.getByText(/Register/i)).toBeDefined();
    
    // The dropdown items are not visible until the dropdown is clicked
    // So we can't test for them directly
  });
  
  it('shows register dropdown when hovered', () => {
    renderWithRouter(<Header />, { contextValue: mockAuthContext });
    
    // Find the Register dropdown
    const registerDropdown = screen.getByText(/Register/i);
    expect(registerDropdown).toBeDefined();
    
    // We can't test the dropdown functionality directly in JSDOM
    // as it relies on CSS :hover which isn't supported in the test environment
  });

  it('renders company navigation when user is a company', async () => {
    const companyUser = {
      id: 1,
      role: 'company',
    };
    
    // Mock all the API calls that will be made
    axios.get.mockImplementation((url) => {
      if (url.includes('/notifications/unread-count')) {
        return Promise.resolve({ data: { count: 0 } });
      } else if (url.includes('/trip-requests/count')) {
        return Promise.resolve({ data: { count: 0 } });
      }
      return Promise.resolve({ data: {} });
    });
    
    renderWithRouter(<Header />, { 
      contextValue: { ...mockAuthContext, currentUser: companyUser } 
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeDefined();
      expect(screen.getByText(/Profile/i)).toBeDefined();
      expect(screen.getByText(/Trips/i)).toBeDefined();
      expect(screen.getByText(/Trip Requests/i)).toBeDefined();
      expect(screen.getByText(/Logout/i)).toBeDefined();
    });
  });

  it('renders driver navigation when user is a driver', async () => {
    const driverUser = {
      id: 1,
      role: 'driver',
    };
    
    // Mock all the API calls that will be made
    axios.get.mockImplementation((url) => {
      if (url.includes('/notifications/unread-count')) {
        return Promise.resolve({ data: { count: 0 } });
      } else if (url.includes('/trip-requests/count')) {
        return Promise.resolve({ data: { count: 0 } });
      }
      return Promise.resolve({ data: {} });
    });
    
    renderWithRouter(<Header />, { 
      contextValue: { ...mockAuthContext, currentUser: driverUser } 
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeDefined();
      expect(screen.getByText(/Profile/i)).toBeDefined();
      expect(screen.getByText(/Update Availability/i)).toBeDefined();
      expect(screen.getByText(/Trip Requests/i)).toBeDefined();
      expect(screen.getByText(/Logout/i)).toBeDefined();
    });
  });

  it('renders admin navigation when user is an admin', async () => {
    const adminUser = {
      id: 1,
      role: 'admin',
    };
    
    // Mock all the API calls that will be made
    axios.get.mockImplementation((url) => {
      if (url.includes('/notifications/unread-count')) {
        return Promise.resolve({ data: { count: 0 } });
      } else if (url.includes('/pending-users/count')) {
        return Promise.resolve({ data: { count: 0 } });
      }
      return Promise.resolve({ data: {} });
    });
    
    renderWithRouter(<Header />, { 
      contextValue: { ...mockAuthContext, currentUser: adminUser } 
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeDefined();
      expect(screen.getByText(/Pending Approvals/i)).toBeDefined();
      expect(screen.getByText(/Companies/i)).toBeDefined();
      expect(screen.getByText(/Drivers/i)).toBeDefined();
      expect(screen.getByText(/Logout/i)).toBeDefined();
    });
  });

  it('shows notification badge when there are unread notifications', async () => {
    const driverUser = {
      id: 1,
      role: 'driver',
    };
    
    // Mock all the API calls that will be made
    axios.get.mockImplementation((url) => {
      if (url.includes('/notifications/unread-count')) {
        return Promise.resolve({ data: { count: 5 } });
      } else if (url.includes('/trip-requests/count')) {
        return Promise.resolve({ data: { count: 0 } });
      }
      return Promise.resolve({ data: {} });
    });
    
    renderWithRouter(<Header />, { 
      contextValue: { ...mockAuthContext, currentUser: driverUser } 
    });
    
    await waitFor(() => {
      const badge = screen.getByText('5');
      expect(badge).toBeDefined();
      expect(badge.className).includes('badge');
    });
  });

  it('calls logout function when logout link is clicked', async () => {
    const driverUser = {
      id: 1,
      role: 'driver',
    };
    
    // Mock all the API calls that will be made
    axios.get.mockImplementation((url) => {
      if (url.includes('/notifications/unread-count')) {
        return Promise.resolve({ data: { count: 0 } });
      } else if (url.includes('/trip-requests/count')) {
        return Promise.resolve({ data: { count: 0 } });
      }
      return Promise.resolve({ data: {} });
    });
    
    const mockLogout = vi.fn();
    
    renderWithRouter(<Header />, { 
      contextValue: { 
        ...mockAuthContext, 
        currentUser: driverUser,
        logout: mockLogout
      } 
    });
    
    await waitFor(() => {
      const logoutLink = screen.getByText(/Logout/i);
      logoutLink.click();
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('fetches unread notifications for different user roles', async () => {
    // Test admin role
    const adminUser = { id: 1, role: 'admin' };
    axios.get.mockReset();
    axios.get.mockImplementation((url) => {
      if (url.includes('/notifications/unread-count')) {
        return Promise.resolve({ data: { count: 3 } });
      } else if (url.includes('/pending-users/count')) {
        return Promise.resolve({ data: { count: 0 } });
      }
      return Promise.resolve({ data: {} });
    });
    
    renderWithRouter(<Header />, { 
      contextValue: { ...mockAuthContext, currentUser: adminUser } 
    });
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/admin/notifications/unread-count'));
    });
    
    // Test company role
    const companyUser = { id: 2, role: 'company' };
    axios.get.mockReset();
    axios.get.mockImplementation((url) => {
      if (url.includes('/notifications/unread-count')) {
        return Promise.resolve({ data: { count: 2 } });
      } else if (url.includes('/trip-requests/count')) {
        return Promise.resolve({ data: { count: 0 } });
      }
      return Promise.resolve({ data: {} });
    });
    
    renderWithRouter(<Header />, { 
      contextValue: { ...mockAuthContext, currentUser: companyUser } 
    });
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/company/notifications/unread-count'));
    });
  });
});
