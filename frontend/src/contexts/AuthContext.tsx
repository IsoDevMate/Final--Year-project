
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  role: string;
  userId: string;
  email: string;
  name: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  bio?: string;
  socialLinks?: {
    linkedinId?: string;
    linkedinAccessToken?: string;
    linkedinRefreshToken?: string;
    linkedinTokenExpiry?: Date;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithLinkedIn: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  checkAuthStatus: () => Promise<void>; // Added this function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isTokenValid = () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      return false;
    }

    // Optional: Add JWT expiration check if your tokens include expiry
    try {
      // Simple check - in production you might want to decode and check exp claim
      return !!token && token.length > 20; // Basic validation
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  const checkAuthStatus = async () => {
  setIsLoading(true);
  try {
    if (isTokenValid()) {
      const token = localStorage.getItem('accessToken');

      // Use /auth/profile to get fresh data from DB (not stale JWT payload)
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const userData = response.data.data || response.data.user || response.data;

      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } else {
        throw new Error('Invalid user data format');
      }
    } else {
      setUser(null);
      localStorage.removeItem('user');
    }
  } catch (error) {
    console.error('Auth status check failed:', error);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  } finally {
    setIsLoading(false);
  }
};

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

 const login = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/login`, {
      email,
      password
    });

    // Extract data based on the actual response structure
    const { tokens, user } = response.data.data;

      console.log('Full user object from server:', user);


    // Store tokens and user
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    // Update state
    setUser(user);
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

  const loginWithLinkedIn = async () => {
    try {
      // Redirect to backend LinkedIn auth endpoint
      window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/linkedin`;
    } catch (error) {
      console.error('LinkedIn login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/logout`);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if the API call fails, clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/register`, {
        email,
        password,
        name
      });

      const { accessToken, refreshToken, user } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithLinkedIn,
    logout,
    register,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
