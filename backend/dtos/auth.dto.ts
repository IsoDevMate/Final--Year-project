// src/interfaces/auth.interface.ts
import { UserRole } from '../models/user.model';

export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface PasswordResetDTO {
  email: string;
}

export interface PasswordResetConfirmDTO {
  token: string;
  password: string;
}

export interface QRCodePayload {
  userId: string;
  eventId: string;
  timestamp: number;
}
