import { z } from 'zod';
import { UserRole } from '../models/user.model';

// Register validation schema
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.nativeEnum(UserRole).optional()
});

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Refresh token validation schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Password reset request validation schema
export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address')
});

// Password reset confirmation validation schema
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const verifyQRCodeSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  code: z.string().min(1, 'Code is required')
});
