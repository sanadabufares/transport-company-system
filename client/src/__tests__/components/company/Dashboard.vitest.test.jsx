import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext.jsx';
import Dashboard from '../../../components/company/Dashboard.jsx';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock the context
const mockAuthContext = {
  currentUser: { id: 1, username: 'company1', role: 'company' },
  userProfile: { id: 1, company_name: 'Test Company', contact_person: 'John Doe' },
  refreshDashboard: false
};

// Helper function to render with router and context
const renderWithRouter = (ui, { contextValue = mockAuthContext } = {}) => {
  return render(
    <AuthContext.Provider value={contextValue}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('Company Dashboard Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    // Mock API responses
    axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves to keep loading state

    // Render the component
    renderWithRouter(<Dashboard />);

    // Check for loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('renders dashboard with company stats after loading', async () => {
    // Mock API responses
    const mockResponses = {
      stats: {
        activeTrips: 3,
        pendingTrips: 2,
        completedTrips: 10,
        tripRequests: 5,
        totalRevenue: 1500,
        unreadNotifications: 3,
        averageRating: 4.5
      },
      trips: [
        {
          id: 1,
          pickup_location: 'Location A',
          destination: 'Location B',
          trip_date: '2025-01-01',
          departure_time: '10:00:00',
          status: 'in_progress',
          driver_name: 'John Driver'
        },
        {
          id: 2,
          pickup_location: 'Location C',
          destination: 'Location D',
          trip_date: '2025-01-02',
          departure_time: '11:00:00',
          status: 'pending',
          driver_name: null
        }
      ],
      drivers: [
        { id: 1, first_name: 'John', last_name: 'Driver' },
        { id: 2, first_name: 'Jane', last_name: 'Driver' }
      ]
    };

    axios.get.mockImplementation((url) => {
      if (url.includes('/dashboard-stats')) {
        return Promise.resolve({ data: mockResponses.stats });
      } else if (url.includes('/trips')) {
        return Promise.resolve({ data: mockResponses.trips });
      } else if (url.includes('/drivers')) {
        return Promise.resolve({ data: mockResponses.drivers });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithRouter(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Check for dashboard elements
    expect(screen.getByText('Company Dashboard')).toBeInTheDocument();
    
    // Check for stats
    expect(screen.getAllByText('3').length).toBeGreaterThan(0); // Active Trips or Notifications
    expect(screen.getByText('Active Trips')).toBeInTheDocument();
    
    expect(screen.getAllByText('2').length).toBeGreaterThan(0); // Pending Trips
    expect(screen.getByText('Pending Trips')).toBeInTheDocument();
    
    expect(screen.getAllByText('5').length).toBeGreaterThan(0); // Trip Requests
    expect(screen.getByText('Driver Requests')).toBeInTheDocument();
    
    expect(screen.getAllByText('10').length).toBeGreaterThan(0); // Completed Trips
    expect(screen.getByText('Completed Trips')).toBeInTheDocument();
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    
    // Check for recent trips
    expect(screen.getByText('Recent Trips')).toBeInTheDocument();
    expect(screen.getByText('Location A')).toBeInTheDocument();
    expect(screen.getByText('Location B')).toBeInTheDocument();
    
    // Check for business summary
    expect(screen.getByText('₪1,500')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // Total Trips (active + pending + completed)
    expect(screen.getByText('Total Trips')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
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
    expect(screen.getByText('Failed to fetch dashboard data. Please try again later.')).toBeInTheDocument();
  });

  it('renders with empty data when API returns empty results', async () => {
    // Mock empty API responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/dashboard-stats')) {
        return Promise.resolve({ data: {} });
      } else if (url.includes('/trips')) {
        return Promise.resolve({ data: [] });
      } else if (url.includes('/drivers')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithRouter(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Check that dashboard is rendered
    expect(screen.getByText('Company Dashboard')).toBeInTheDocument();
    
    // Check that some default elements are displayed
    expect(screen.getByText('Active Trips')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });
});
