import { UserRole } from '../models/user.model';

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      role: UserRole;
    }
  }
}

export {};
