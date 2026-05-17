import { Request, Response, NextFunction } from 'express';
import { LinkedInService } from '../services/linkedin.auth.service';
import { ResponseUtil } from '../utils/response.utils';
import config from '../config/config';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AppError } from '../utils/errors.utils';
import { authService } from '../services/auth.service';

// Server-side store: state nonce → userId (for link flow), TTL 10 min
const pendingLinkStates = new Map<string, { userId: string; expiresAt: number }>();

const REDIRECT_URI = 'https://final-year-project-jy2j.onrender.com/api/v1/auth/linkedin/callback';

export class LinkedInController {
  constructor(private linkedInService: LinkedInService = new LinkedInService()) {}

  static getAuthUrl(req: Request, res: Response) {
    const state = crypto.randomBytes(16).toString('hex');

    // If a logged-in user is connecting LinkedIn, store their userId server-side
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const payload: any = jwt.verify(token, config.jwt.accessTokenSecret as string);
        pendingLinkStates.set(state, { userId: payload.userId, expiresAt: Date.now() + 10 * 60 * 1000 });
      } catch { /* invalid token — treat as login flow */ }
    }

    return ResponseUtil.success(res, 200, {
      url: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${config.linkedin.clientId}&redirect_uri=${REDIRECT_URI}&state=${state}&scope=openid%20profile%20email%20w_member_social`
    }, 'LinkedIn authentication URL generated successfully');
  }

  static async handleCallback(req: Request, res: Response, next: NextFunction) {
    const { code, state } = req.query;
    try {
      if (!code) return ResponseUtil.error(res, 400, 'Authorization code not provided');

      // Purge expired states
      const now = Date.now();
      pendingLinkStates.forEach((v, k) => { if (v.expiresAt < now) pendingLinkStates.delete(k); });

      const linkData = state && typeof state === 'string' ? pendingLinkStates.get(state) : null;

      if (linkData) {
        // LINK FLOW — attach LinkedIn to existing logged-in user
        pendingLinkStates.delete(state as string);

        const tokenResponse = await LinkedInService.getAccessTokenInitial(code.toString());
        const profile = await LinkedInService.getUserProfile(tokenResponse.access_token);

        // Guard: LinkedIn account already linked to a different user
        const conflict = await User.findOne({ 'socialLinks.linkedinId': profile.sub });
        if (conflict && (conflict._id as any).toString() !== linkData.userId) {
          const url = new URL(`${config.frontendUrl}/auth/linkedin/callback`);
          url.searchParams.append('error', 'This LinkedIn account is already linked to another user.');
          return res.redirect(url.toString());
        }

        await User.findByIdAndUpdate(linkData.userId, {
          'socialLinks.linkedinId': profile.sub,
          'socialLinks.linkedinAccessToken': tokenResponse.access_token,
          ...(tokenResponse.refresh_token && { 'socialLinks.linkedinRefreshToken': tokenResponse.refresh_token }),
          'socialLinks.linkedinTokenExpiry': new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        });

        const user = await User.findById(linkData.userId);
        const tokens = await authService.generateTokens(user!);

        const url = new URL(`${config.frontendUrl}/auth/linkedin/callback`);
        url.searchParams.append('accessToken', tokens.accessToken);
        url.searchParams.append('refreshToken', tokens.refreshToken);
        url.searchParams.append('linkedinConnected', 'true');
        return res.redirect(url.toString());
      }

      // LOGIN/REGISTER FLOW — find or create user
      const result = await LinkedInService.authenticate(code.toString());
      const url = new URL(`${config.frontendUrl}/auth/linkedin/callback`);
      url.searchParams.append('accessToken', result.tokens.accessToken);
      url.searchParams.append('refreshToken', result.tokens.refreshToken);
      url.searchParams.append('linkedinConnected', 'true');
      url.searchParams.append('user', JSON.stringify(result.user));
      return res.redirect(url.toString());
    } catch (error) {
      console.error('LinkedIn callback error:', error);
      const url = new URL(`${config.frontendUrl}/auth/login`);
      url.searchParams.append('error', 'LinkedIn authentication failed');
      return res.redirect(url.toString());
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
