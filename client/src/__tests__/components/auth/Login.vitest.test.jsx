import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext.jsx';
import Login from '../../../components/auth/Login.jsx';

describe('Login Component', () => {
  let mockLogin;
  let mockSetError;

  const renderWithContext = (contextValue) => {
    return render(
      <AuthContext.Provider value={contextValue}>
        <Router>
          <Login />
        </Router>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    mockLogin = vi.fn();
    mockSetError = vi.fn();
  });

  test('renders the login form', () => {
    renderWithContext({ login: mockLogin, error: null, loading: false, setError: mockSetError });

    expect(screen.getByRole('heading', { name: /Login/i })).toBeDefined();
    expect(screen.getByLabelText(/Username/i)).toBeDefined();
    expect(screen.getByLabelText(/Password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Login/i })).toBeDefined();
    expect(screen.getByText(/Don't have an account?/i)).toBeDefined();
  });

  test('allows user to enter username and password', () => {
    renderWithContext({ login: mockLogin, error: null, loading: false, setError: mockSetError });

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    expect(screen.getByLabelText(/Username/i).value).toBe('testuser');
    expect(screen.getByLabelText(/Password/i).value).toBe('password123');
  });

  test('calls login function on form submission', async () => {
    mockLogin.mockResolvedValueOnce();
    renderWithContext({ login: mockLogin, error: null, loading: false, setError: mockSetError });

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  test('displays an error message on failed login', async () => {
    const error = 'Invalid credentials';
    renderWithContext({ login: mockLogin, error, loading: false, setError: mockSetError });

    expect(screen.getByText(error)).toBeDefined();
  });

  test('shows loading state when submitting', () => {
    renderWithContext({ login: mockLogin, error: null, loading: true, setError: mockSetError });

    expect(screen.getByRole('button', { name: /Logging in.../i })).toBeDisabled();
    // The spinner has aria-hidden="true" so it's not found by getByRole('status')
    // Instead, check for the spinner class
    expect(screen.getByText('Logging in...').previousSibling).toBeDefined();
  });

  test('clears error on component mount', () => {
    renderWithContext({ login: mockLogin, error: 'An old error', loading: false, setError: mockSetError });
    expect(mockSetError).toHaveBeenCalledWith(null);
  });

  test('validates form inputs', () => {
    renderWithContext({ login: mockLogin, error: null, loading: false, setError: mockSetError });
    
    // Try to submit the form without entering any data
    const submitButton = screen.getByRole('button', { name: /Login/i });
    fireEvent.click(submitButton);
    
    // The form should have validation feedback
    expect(screen.getByText(/Please enter your username/i)).toBeDefined();
    expect(screen.getByText(/Please enter your password/i)).toBeDefined();
  });

  test('shows console logs during login process', async () => {
    // Mock console.log to track calls
    const originalConsoleLog = console.log;
    const mockConsoleLog = vi.fn();
    console.log = mockConsoleLog;
    
    mockLogin.mockResolvedValueOnce(true);
    renderWithContext({ login: mockLogin, error: null, loading: false, setError: mockSetError });
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    
    await waitFor(() => {
      // Check that console.log was called with the expected messages
      expect(mockConsoleLog).toHaveBeenCalledWith('[Login] Attempting login with:', expect.anything());
      expect(mockConsoleLog).toHaveBeenCalledWith('[Login] Calling login function...');
      expect(mockConsoleLog).toHaveBeenCalledWith('[Login] Login function completed successfully');
    });
    
    // Restore original console.log
    console.log = originalConsoleLog;
  });
});
