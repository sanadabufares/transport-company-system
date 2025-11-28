import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Header from '../../components/common/Header';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock the context
const mockAuthContext = {
  currentUser: null,
  logout: jest.fn(),
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
    jest.clearAllMocks();
  });

  it('renders login and register links when user is not logged in', () => {
    renderWithRouter(<Header />);
    
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
  });

  it('renders company navigation when user is a company', async () => {
    const companyUser = {
      id: 1,
      role: 'company',
    };
    
    axios.get.mockResolvedValueOnce({ data: { count: 0 } });
    
    renderWithRouter(<Header />, { 
      contextValue: { ...mockAuthContext, currentUser: companyUser } 
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/Profile/i)).toBeInTheDocument();
      expect(screen.getByText(/Trips/i)).toBeInTheDocument();
      expect(screen.getByText(/Trip Requests/i)).toBeInTheDocument();
      expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    });
  });

  it('renders driver navigation when user is a driver', async () => {
    const driverUser = {
      id: 1,
      role: 'driver',
    };
    
    axios.get.mockResolvedValueOnce({ data: { count: 0 } });
    
    renderWithRouter(<Header />, { 
      contextValue: { ...mockAuthContext, currentUser: driverUser } 
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/Profile/i)).toBeInTheDocument();
      expect(screen.getByText(/Update Availability/i)).toBeInTheDocument();
      expect(screen.getByText(/Trip Requests/i)).toBeInTheDocument();
      expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    });
  });

  it('shows notification badge when there are unread notifications', async () => {
    const driverUser = {
      id: 1,
      role: 'driver',
    };
    
    // Mock the API response for unread notifications count
    axios.get.mockResolvedValueOnce({ data: { count: 5 } });
    
    renderWithRouter(<Header />, { 
      contextValue: { ...mockAuthContext, currentUser: driverUser } 
    });
    
    await waitFor(() => {
      const badge = screen.getByText('5');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge');
    });
  });

  it('calls logout function when logout link is clicked', async () => {
    const driverUser = {
      id: 1,
      role: 'driver',
    };
    
    axios.get.mockResolvedValueOnce({ data: { count: 0 } });
    
    renderWithRouter(<Header />, { 
      contextValue: { 
        ...mockAuthContext, 
        currentUser: driverUser,
        logout: jest.fn()
      } 
    });
    
    await waitFor(() => {
      const logoutLink = screen.getByText(/Logout/i);
      logoutLink.click();
      expect(mockAuthContext.logout).toHaveBeenCalled();
    });
  });
});
