import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import Dashboard from '../../../components/driver/Dashboard';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock the context
const mockAuthContext = {
  currentUser: { id: 1, username: 'driver1', role: 'driver' },
  userProfile: { id: 1, first_name: 'Test', last_name: 'Driver' },
  loading: false
};

const renderWithRouter = (ui, { contextValue = mockAuthContext } = {}) => {
  return render(
    <AuthContext.Provider value={contextValue}>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('Driver Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Mock API responses
    axios.get.mockImplementation((url) => {
      // Delay all responses to ensure loading state is shown
      return new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100));
    });

    renderWithRouter(<Dashboard />);
    
    // Check for loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('renders dashboard with driver stats after loading', async () => {
    // Mock API responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/stats')) {
        return Promise.resolve({
          data: {
            activeTrips: 2,
            completedTrips: 10,
            tripRequests: 3,
            totalEarnings: 1500,
            availableTrips: 5
          }
        });
      } else if (url.includes('/trips/recent')) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              company_name: 'Test Company',
              pickup_location: 'Location A',
              destination: 'Location B',
              status: 'completed'
            },
            {
              id: 2,
              company_name: 'Another Company',
              pickup_location: 'Location C',
              destination: 'Location D',
              status: 'in_progress'
            }
          ]
        });
      } else if (url.includes('/availability/current')) {
        return Promise.resolve({
          data: {
            isAvailable: true,
            location: 'Test City',
            availableFrom: '2025-01-01 08:00:00',
            availableTo: '2025-12-31 18:00:00'
          }
        });
      } else if (url.includes('/notifications/unread-count')) {
        return Promise.resolve({
          data: { count: 5 }
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithRouter(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Check for dashboard elements
    expect(screen.getByText('Current Availability')).toBeInTheDocument();
    expect(screen.getByText('Test City')).toBeInTheDocument();
    
    // Check for trip requests count
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Trip Requests')).toBeInTheDocument();
    
    // Check for available trips count
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Available Trips')).toBeInTheDocument();
    
    // Check for notifications count
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    
    // Check for recent trips
    expect(screen.getByText('Recent Trips')).toBeInTheDocument();
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('Another Company')).toBeInTheDocument();
    
    // Check for summary stats
    expect(screen.getByText('₪1,500')).toBeInTheDocument();
    expect(screen.getByText('Total Earnings')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Completed Trips')).toBeInTheDocument();
  });

  it('shows error message when API calls fail', async () => {
    // Mock API error
    axios.get.mockRejectedValue(new Error('API Error'));

    renderWithRouter(<Dashboard />);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Check that error state is handled gracefully
    expect(screen.getByText('Error fetching data')).toBeInTheDocument();
  });

  it('updates trip request count when polling', async () => {
    // Mock initial API responses
    const mockResponses = {
      stats: {
        activeTrips: 2,
        completedTrips: 10,
        tripRequests: 0,
        totalEarnings: 1500,
        availableTrips: 5
      },
      trips: [
        {
          id: 1,
          company_name: 'Test Company',
          pickup_location: 'Location A',
          destination: 'Location B',
          status: 'completed'
        }
      ],
      availability: {
        isAvailable: true,
        location: 'Test City',
        availableFrom: '2025-01-01 08:00:00',
        availableTo: '2025-12-31 18:00:00'
      },
      notifications: { count: 0 },
      tripRequestsCount: { count: 0 }
    };

    // Set up mock to return different values on subsequent calls
    axios.get.mockImplementation((url) => {
      if (url.includes('/stats')) {
        return Promise.resolve({ data: mockResponses.stats });
      } else if (url.includes('/trips/recent')) {
        return Promise.resolve({ data: mockResponses.trips });
      } else if (url.includes('/availability/current')) {
        return Promise.resolve({ data: mockResponses.availability });
      } else if (url.includes('/notifications/unread-count')) {
        return Promise.resolve({ data: mockResponses.notifications });
      } else if (url.includes('/trip-requests/count')) {
        // First call returns 0, subsequent calls return 3
        const response = { data: mockResponses.tripRequestsCount };
        mockResponses.tripRequestsCount = { count: 3 };
        return Promise.resolve(response);
      }
      return Promise.resolve({ data: {} });
    });

    renderWithRouter(<Dashboard />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Initially should show 0 trip requests
    expect(screen.getByText('0')).toBeInTheDocument();
    
    // Mock the timer for polling
    jest.useFakeTimers();
    
    // Fast-forward time to trigger the polling
    jest.advanceTimersByTime(3000);
    
    // Wait for updated data
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
    
    // Restore real timers
    jest.useRealTimers();
  });
});
