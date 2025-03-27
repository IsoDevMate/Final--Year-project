import { UserRole } from '../models/user.model';

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      role: UserRole;
      id?: string;
    }

    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
        id?: string;
      };
    }
  }
}

export {};
