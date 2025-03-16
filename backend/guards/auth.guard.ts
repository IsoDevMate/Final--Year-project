// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import { ITokenPayload } from '../interfaces/auth.interface';

// export class AuthGuard {
//   static verifyToken(req: Request, res: Response, next: NextFunction) {
//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//       return res.status(401).json({ message: 'No token provided' });
//     }

//     const token = authHeader.split(' ')[1];
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET!) as ITokenPayload;
//       req.user = decoded;
//       next();
//     } catch (error) {
//       return res.status(401).json({ message: 'Invalid token' });
//     }
//   }

//   static hasRole(roles: string[]) {
//     return (req: Request, res: Response, next: NextFunction) => {
//       if (!req.user) {
//         return res.status(401).json({ message: 'Unauthorized' });
//       }

//       const hasRequiredRole = req.user.roles.some(role => roles.includes(role));
//       if (!hasRequiredRole) {
//         return res.status(403).json({ message: 'Insufficient permissions' });
//       }
//       next();
//     };
//   }
// }

