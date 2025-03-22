import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';


interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider?: 'email' | 'linkedin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithLinkedIn: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

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

// Then update your checkAuthStatus function
const checkAuthStatus = async () => {
  try {
    if (isTokenValid()) {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } else {
      setUser(null);
    }
  } catch (error) {
    console.error('Auth status check failed:', error);
    // Clear invalid tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  } finally {
    setIsLoading(false);
  }
};

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/login`, {
        email,
        password
      });

      const { accessToken, refreshToken, user } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const loginWithLinkedIn = async () => {
    try {
      // Redirect to backend LinkedIn auth endpoint
      window.location.href = `${import.meta.env.VITE_API_URL}/api/v1/auth/linkedin`;
    } catch (error) {
      console.error('LinkedIn login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/logout`);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/register`, {
        email,
        password,
        name
      });

      const { accessToken, refreshToken, user } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
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
