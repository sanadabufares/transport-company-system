import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import Login from '../../../components/auth/Login';

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
    mockLogin = jest.fn();
    mockSetError = jest.fn();
  });

  test('renders the login form', () => {
    renderWithContext({ login: mockLogin, error: null, loading: false, setError: mockSetError });

    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account?/i)).toBeInTheDocument();
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

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  test('shows loading state when submitting', () => {
    renderWithContext({ login: mockLogin, error: null, loading: true, setError: mockSetError });

    expect(screen.getByRole('button', { name: /Logging in.../i })).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('clears error on component mount', () => {
    renderWithContext({ login: mockLogin, error: 'An old error', loading: false, setError: mockSetError });
    expect(mockSetError).toHaveBeenCalledWith(null);
  });
});
