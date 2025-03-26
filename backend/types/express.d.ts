import { UserRole } from '../models/user.model';

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      role: UserRole;
      id?: string;
        [key: string]: any;
    }

    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
        id?: string;
        [key: string]: any;
      };
    }
  }
}

export {};
