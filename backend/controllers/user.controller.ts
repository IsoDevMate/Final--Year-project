// // controllers/linkedin-auth.controller.ts
// import { Request, Response, NextFunction } from 'express';
// import { linkedInAuthService } from '../services/linkedin-auth.service';
// import { ResponseUtil } from '../utils/response.util';

// export class LinkedInAuthController {
//    static async handleLinkedInCallback(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { user, tokens } = await linkedInAuthService.handleLinkedInCallback(req);

//       // For API-based flows, return tokens
//       if (req.query.format === 'json') {
//         return ResponseUtil.success(res, 200, { user, tokens }, 'LinkedIn authentication successful');
//       }

//       // For web flows, redirect with tokens
//       const redirectUrl = `${process.env.FRONTEND_URL}/auth/social-callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
//       return res.redirect(redirectUrl);
//     } catch (error) {
//       next(error);
//     }
//   }
// }

// export const linkedInAuthController = new LinkedInAuthController();
