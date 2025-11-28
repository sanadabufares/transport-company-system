import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../../context/AuthContext.jsx';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.location
delete window.location;
window.location = { href: '' };

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('initializes with null user and profile when no token exists', async () => {
    localStorageMock.getItem.mockReturnValueOnce(null);

    let contextValue;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {value => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(contextValue.currentUser).toBeNull();
      expect(contextValue.userProfile).toBeNull();
      expect(contextValue.loading).toBe(false);
    });
  });

  it('loads user profile when token exists', async () => {
    const mockUser = { id: 1, username: 'testuser', role: 'driver' };
    const mockProfile = { id: 1, first_name: 'Test', last_name: 'User' };
    
    localStorageMock.getItem.mockReturnValueOnce('fake-token');
    axios.get.mockResolvedValueOnce({ 
      data: { 
        user: mockUser, 
        profile: mockProfile 
      } 
    });

    let contextValue;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {value => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(contextValue.currentUser).toEqual(mockUser);
      expect(contextValue.userProfile).toEqual(mockProfile);
      expect(contextValue.loading).toBe(false);
    });
  });

  it('handles login successfully', async () => {
    const mockUser = { id: 1, username: 'testuser', role: 'driver' };
    const mockProfile = { id: 1, first_name: 'Test', last_name: 'User' };
    const mockToken = 'fake-token';
    
    axios.post.mockResolvedValueOnce({ 
      data: { 
        token: mockToken,
        user: mockUser, 
        profile: mockProfile 
      } 
    });

    let contextValue;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {value => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(contextValue.loading).toBe(false);
    });

    await act(async () => {
      const result = await contextValue.login('testuser', 'password');
      expect(result).toBe(true);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
    expect(contextValue.currentUser).toEqual(mockUser);
    expect(contextValue.userProfile).toEqual(mockProfile);
  });

  it('handles login failure', async () => {
    const errorMessage = 'Invalid credentials';
    axios.post.mockRejectedValueOnce({ 
      response: { 
        data: { 
          message: errorMessage 
        } 
      } 
    });

    let contextValue;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {value => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(contextValue.loading).toBe(false);
    });

    await act(async () => {
      const result = await contextValue.login('testuser', 'wrongpassword');
      expect(result).toBe(false);
    });

    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(contextValue.currentUser).toBeNull();
    expect(contextValue.error).toBe(errorMessage);
  });

  it('handles logout correctly', async () => {
    let contextValue;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {value => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(contextValue.loading).toBe(false);
    });

    act(() => {
      contextValue.logout();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(window.location.href).toBe('/login');
  });
});
