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
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
