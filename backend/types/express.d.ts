import { UserRole } from '../models/user.model';

declare global {
  namespace Express {
    interface User {
      id: string;
      userId?: string;
      email: string;
      role: UserRole;
      firstName?: string;
      lastName?: string;
      socialLinks?: {
        linkedinId?: string;
        linkedinAccessToken?: string;
      } | null;
      profileImage?: string;
      bio?: string;
      phoneNumber?: string;
      createdAt?: Date;
      updatedAt?: Date;
      isVerified?: boolean;
    }

    interface Request {
      user?: User | undefined;
    }
  }
}

export {};
