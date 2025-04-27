import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ResponseUtil } from '../utils/response.utils';
import config from '../config/config';
import { User, UserRole } from '../models/user.model';

export class AuthMiddleware {
static async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return ResponseUtil.error(res, 401, 'Access token is required');
      }

      const token = authHeader.split(' ')[1];

      try {
        if (!config.jwt.accessTokenSecret) {
          return ResponseUtil.error(res, 500, 'JWT secret is not defined');
        }

        const decoded = jwt.verify(token, config.jwt.accessTokenSecret as string) as {
          userId: string;
          email: string;
          role: UserRole;
          firstName: string;
          lastName: string;
          socialLinks?: {
            linkedinId?: string;
            linkedinAccessToken?: string;
            linkedinRefreshToken?: string;
            linkedinTokenExpiry?: Date;
          };
        };

        // Check if user still exists
        const user = await User.findById(decoded.userId);

        if (!user) {
          return ResponseUtil.error(res, 401, 'User no longer exists');
        }

        // Attach user info to request
        req.user = {
          id: decoded.userId,
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          // socialLinks is not part of the User type
          socialLinks: decoded.socialLinks || null,
          profileImage: user.profileImage,
          bio: user.bio,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt,
        };

        next();
      } catch (error) {
        return ResponseUtil.error(res, 401, 'Invalid or expired token');
      }
    } catch (error) {
      next(error);
    }
  }


 // Check if user has required role
static hasRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      // Type assertion to ensure req.user has the role property
      const user = req.user as { role: string };

      if (!roles.includes(user.role)) {
        return ResponseUtil.error(res, 403, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
}

export default new AuthMiddleware();
