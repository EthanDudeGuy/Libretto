import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        // Create a demo user for testing if no users exist
        await createDemoUser();
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDemoUser = async () => {
    try {
      const users = await AsyncStorage.getItem('users');
      if (!users) {
        const demoUser = {
          id: 'demo-user-1',
          name: 'Demo User',
          email: 'demo@libretto.com',
          password: 'demo123',
          createdAt: new Date().toISOString()
        };
        await AsyncStorage.setItem('users', JSON.stringify([demoUser]));
      }
    } catch (error) {
      console.error('Error creating demo user:', error);
    }
  };

  const login = async (email, password) => {
    try {
      // For demo purposes, we'll use simple validation
      // In a real app, this would make an API call to your backend
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Simple demo validation - in production, this would be handled by your backend
      const users = await AsyncStorage.getItem('users');
      const userList = users ? JSON.parse(users) : [];
      
      const foundUser = userList.find(u => u.email === email && u.password === password);
      
      if (!foundUser) {
        throw new Error('Invalid email or password');
      }

      // Store user data (excluding password)
      const userData = {
        id: foundUser.id,
        email: foundUser.email,
        createdAt: foundUser.createdAt
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password, confirmPassword) => {
    try {
      // Validation
      if (!email || !password || !confirmPassword) {
        throw new Error('Email and password are required');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Check if user already exists
      const users = await AsyncStorage.getItem('users');
      const userList = users ? JSON.parse(users) : [];
      
      const existingUser = userList.find(u => u.email === email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email,
        password, // In production, this should be hashed
        createdAt: new Date().toISOString()
      };

      userList.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(userList));

      // Auto-login after registration
      const userData = {
        id: newUser.id,
        email: newUser.email,
        createdAt: newUser.createdAt
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      console.log('Logout: Starting logout process...');
      console.log('Logout: Current user state:', user);
      
      // Clear user data from AsyncStorage
      await AsyncStorage.removeItem('user');
      console.log('Logout: Removed user from AsyncStorage');
      
      // Clear user state
      setUser(null);
      console.log('Logout: Set user to null');
      
      // Force a state update by setting loading briefly
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 50));
      setIsLoading(false);
      
      console.log('Logout: Logout process completed');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, try to clear the state
      setUser(null);
    }
  };

  const forceLogout = async () => {
    try {
      console.log('Force Logout: Clearing all authentication data...');
      await AsyncStorage.multiRemove(['user', 'users']);
      setUser(null);
      setIsLoading(false);
      console.log('Force Logout: All data cleared');
    } catch (error) {
      console.error('Error during force logout:', error);
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    forceLogout,
    isAuthenticated: !!user
  };

  // Debug logging for auth state changes
  console.log('AuthContext render - user:', user, 'isAuthenticated:', !!user);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
