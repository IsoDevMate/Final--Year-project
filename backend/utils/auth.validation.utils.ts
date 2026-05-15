import { z } from 'zod';
import { UserRole } from '../models/user.model';

const nameField = (label: string) =>
  z.string()
    .min(2, `${label} must be at least 2 characters`)
    .max(50, `${label} cannot exceed 50 characters`)
    .regex(/^[A-Za-z\s'\-]+$/, `${label} must contain letters only`);

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  role: z.nativeEnum(UserRole).optional()
});


export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});


export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});


export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address')
});


export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
});

export const verifyQRCodeSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  code: z.string().min(1, 'Code is required')
});
