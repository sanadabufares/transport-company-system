import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, createMockUser, createMockProfile, mockLocalStorage, wait } from '../vitestUtils';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { BrowserRouter } from 'react-router-dom';

describe('Utility Functions', () => {
  describe('renderWithProviders', () => {
    it('renders a component with default auth context', () => {
      const TestComponent = () => <div>Test Component</div>;
      
      renderWithProviders(<TestComponent />);
      
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
    
    it('renders a component with custom auth context', () => {
      const mockUser = { id: 1, username: 'testuser', role: 'driver' };
      const mockLogin = vi.fn();
      
      const TestComponent = () => {
        const { currentUser, login } = React.useContext(AuthContext);
        return (
          <div>
            <div>User: {currentUser?.username}</div>
            <button onClick={() => login('user', 'pass')}>Login</button>
          </div>
        );
      };
      
      renderWithProviders(<TestComponent />, {
        initialAuthState: {
          currentUser: mockUser,
          login: mockLogin
        }
      });
      
      expect(screen.getByText(`User: ${mockUser.username}`)).toBeInTheDocument();
      
      // Test that the login function is passed correctly
      screen.getByText('Login').click();
      expect(mockLogin).toHaveBeenCalledWith('user', 'pass');
    });
  });
  
  describe('createMockUser', () => {
    it('creates a driver user by default', () => {
      const user = createMockUser();
      
      expect(user).toEqual({
        id: 1,
        username: 'testdriver',
        email: 'testdriver@example.com',
        role: 'driver'
      });
    });
    
    it('creates a company user when specified', () => {
      const user = createMockUser('company');
      
      expect(user).toEqual({
        id: 1,
        username: 'testcompany',
        email: 'testcompany@example.com',
        role: 'company'
      });
    });
    
    it('creates an admin user when specified', () => {
      const user = createMockUser('admin');
      
      expect(user).toEqual({
        id: 1,
        username: 'testadmin',
        email: 'testadmin@example.com',
        role: 'admin'
      });
    });
  });
  
  describe('createMockProfile', () => {
    it('creates a driver profile by default', () => {
      const profile = createMockProfile();
      
      expect(profile).toHaveProperty('first_name', 'Test');
      expect(profile).toHaveProperty('last_name', 'Driver');
      expect(profile).toHaveProperty('license_number', 'DL12345');
      expect(profile).toHaveProperty('vehicle_type', 8);
    });
    
    it('creates a company profile when specified', () => {
      const profile = createMockProfile('company');
      
      expect(profile).toHaveProperty('company_name', 'Test Company');
      expect(profile).toHaveProperty('contact_person', 'John Smith');
      expect(profile).toHaveProperty('rating', 4.5);
    });
    
    it('creates an admin profile when specified', () => {
      const profile = createMockProfile('admin');
      
      expect(profile).toHaveProperty('username', 'admin');
      expect(profile).toHaveProperty('email', 'admin@example.com');
    });
  });
  
  describe('mockLocalStorage', () => {
    it('mocks localStorage functionality', () => {
      const localStorage = mockLocalStorage();
      
      // Test setItem and getItem
      localStorage.setItem('token', 'test-token');
      expect(localStorage.getItem).toHaveBeenCalledWith('token');
      expect(localStorage.getItem('token')).toBe('test-token');
      
      // Test removeItem
      localStorage.removeItem('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.getItem('token')).toBeNull();
      
      // Test clear
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      localStorage.clear();
      expect(localStorage.clear).toHaveBeenCalled();
      expect(localStorage.getItem('key1')).toBeNull();
      expect(localStorage.getItem('key2')).toBeNull();
    });
  });
  
  describe('wait', () => {
    it('waits for the specified time', async () => {
      const start = Date.now();
      await wait(100);
      const elapsed = Date.now() - start;
      
      // Allow some flexibility in timing (at least 90ms)
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });
});
