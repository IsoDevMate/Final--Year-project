import { Request, Response, NextFunction } from 'express';
import { LinkedInService } from '../services/linkedin.auth.service';
import { ResponseUtil } from '../utils/response.utils';
import config from '../config/config';
import crypto from 'crypto';
import { User } from '../models/user.model';
import { AppError } from '../utils/errors.utils';

const REDIRECT_URI = 'https://final-year-project-jy2j.onrender.com/api/v1/auth/linkedin/callback';

export class LinkedInController {
  constructor(private linkedInService: LinkedInService = new LinkedInService()) {}

  static getAuthUrl(req: Request, res: Response) {
    const state = crypto.randomBytes(16).toString('hex');
    return ResponseUtil.success(res, 200, {
      url: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${config.linkedin.clientId}&redirect_uri=${REDIRECT_URI}&state=${state}&scope=openid%20profile%20email%20w_member_social`
    }, 'LinkedIn authentication URL generated successfully');
  }

  static async handleCallback(req: Request, res: Response, next: NextFunction) {
    const { code } = req.query;
    try {
      if (!code) return ResponseUtil.error(res, 400, 'Authorization code not provided');

      const result = await LinkedInService.authenticate(code.toString());

      const redirectUrl = new URL(`${config.frontendUrl}/auth/linkedin/callback`);
      redirectUrl.searchParams.append('accessToken', result.tokens.accessToken);
      redirectUrl.searchParams.append('refreshToken', result.tokens.refreshToken);
      redirectUrl.searchParams.append('linkedinConnected', 'true');
      redirectUrl.searchParams.append('user', JSON.stringify(result.user));
      return res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('LinkedIn callback error:', error);
      const loginUrl = new URL(`${config.frontendUrl}/auth/login`);
      loginUrl.searchParams.append('error', 'LinkedIn authentication failed');
      return res.redirect(loginUrl.toString());
    }
  }

  static async disconnectLinkedIn(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?.userId;
      if (!userId) return ResponseUtil.error(res, 401, 'User not authenticated');

      const user = await User.findById(userId);
      if (!user) return ResponseUtil.error(res, 404, 'User not found');

      if (user.socialLinks) {
        user.socialLinks.linkedinId = undefined;
        user.socialLinks.linkedinAccessToken = undefined;
        user.socialLinks.linkedinRefreshToken = undefined;
        user.socialLinks.linkedinTokenExpiry = undefined;
      }
      await user.save();

      return ResponseUtil.success(res, 200, { hasLinkedInConnection: false }, 'LinkedIn account disconnected successfully');
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Failed to disconnect LinkedIn account', 500));
    }
  }
}

export default new LinkedInController();
