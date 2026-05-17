import { Request, Response, NextFunction } from 'express';
import {LinkedInService } from '../services/linkedin.auth.service';
import { ResponseUtil } from '../utils/response.utils';
import config from '../config/config';
import crypto from 'crypto';
import { User } from '../models/user.model';
import { AppError } from '../utils/errors.utils';

export class LinkedInController {

   constructor(
     private linkedInService: LinkedInService = new LinkedInService()
    ) {}
  /**
   * Initiate LinkedIn authentication
   */


static getAuthUrl(req: Request, res: Response) {
  // If user is already logged in (token in header), embed it in state so callback can link instead of create
  const existingToken = req.headers.authorization?.split(' ')[1] || '';
  const statePayload = existingToken
    ? Buffer.from(JSON.stringify({ token: existingToken, nonce: Math.random().toString(36) })).toString('base64url')
    : crypto.randomBytes(16).toString('hex');

  const scope = ['openid', 'profile', 'email', 'w_member_social'];
  const clientId = config.linkedin.clientId;
  const redirectUri = 'https://final-year-project-5d85.onrender.com/api/v1/auth/linkedin/callback';

  return ResponseUtil.success(res, 200, {
    url: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${statePayload}&scope=openid%20profile%20email%20w_member_social`
  }, 'LinkedIn authentication URL generated successfully');
}

  /**
   * Handle LinkedIn callback
   */

static async handleCallback(req: Request, res: Response, next: NextFunction) {
  const { code, state } = req.query;
  try {
    if (!code) {
      return ResponseUtil.error(res, 400, 'Authorization code not provided');
    }

    // Decode state to check if this is a "link" flow (logged-in user connecting LinkedIn)
    let existingUserToken: string | null = null;
    if (state && typeof state === 'string') {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
        if (decoded.token) existingUserToken = decoded.token;
      } catch { /* plain state string — login flow */ }
    }

    if (existingUserToken) {
      // LINK FLOW: attach LinkedIn to the already-logged-in user
      const jwt = await import('jsonwebtoken');
      const config2 = (await import('../config/config')).default;
      let payload: any;
      try {
        payload = jwt.default.verify(existingUserToken, config2.jwt.accessTokenSecret as string);
      } catch {
        const loginUrl = new URL(`${config.frontendUrl}/auth/login`);
        loginUrl.searchParams.append('error', 'Session expired. Please log in again.');
        return res.redirect(loginUrl.toString());
      }

      const tokenResponse = await LinkedInService.getAccessTokenInitial(code.toString());
      const profile = await LinkedInService.getUserProfile(tokenResponse.access_token);

      // Check if this LinkedIn account is already linked to a DIFFERENT user
      const existingLinkedUser = await User.findOne({ 'socialLinks.linkedinId': profile.sub });
      if (existingLinkedUser && (existingLinkedUser._id as any).toString() !== payload.userId) {
        const callbackUrl = new URL(`${config.frontendUrl}/auth/linkedin/callback`);
        callbackUrl.searchParams.append('error', 'This LinkedIn account is already linked to another user.');
        return res.redirect(callbackUrl.toString());
      }

      // Link LinkedIn to the existing user
      await User.findByIdAndUpdate(payload.userId, {
        'socialLinks.linkedinId': profile.sub,
        'socialLinks.linkedinAccessToken': tokenResponse.access_token,
        ...(tokenResponse.refresh_token && { 'socialLinks.linkedinRefreshToken': tokenResponse.refresh_token }),
        'socialLinks.linkedinTokenExpiry': new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      });

      // Redirect back with the SAME token (user stays logged in as themselves)
      const callbackUrl = new URL(`${config.frontendUrl}/auth/linkedin/callback`);
      callbackUrl.searchParams.append('accessToken', existingUserToken);
      callbackUrl.searchParams.append('refreshToken', req.body?.refreshToken || '');
      callbackUrl.searchParams.append('linkedinConnected', 'true');
      return res.redirect(callbackUrl.toString());
    }

    // LOGIN/REGISTER FLOW: normal find-or-create
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

 /**
   * Disconnect LinkedIn account
   */

  // static async disconnectLinkedIn(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const userId = (req.user as any)?.userId;

  //     if (!userId) {
  //       return ResponseUtil.error(res, 401, 'User not authenticated');
  //     }

  //     // Find the user and remove LinkedIn-related information
  //     const user = await User.findByIdAndUpdate(
  //       userId,
  //       {
  //         $unset: {
  //           'socialLinks.linkedin': 1,
  //           'socialLinks.linkedinAccessToken': 1,
  //           'socialLinks.linkedinRefreshToken': 1,
  //           'socialLinks.linkedinTokenExpiry': 1
  //         }
  //       },
  //       { new: true }
  //     );

  //     if (!user) {
  //       return ResponseUtil.error(res, 404, 'User not found');
  //     }

  //     return ResponseUtil.success(res, 200, {
  //       hasLinkedInConnection: false
  //     }, 'LinkedIn account disconnected successfully');
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  static async disconnectLinkedIn(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?.userId;

      if (!userId) {
        return ResponseUtil.error(res, 401, 'User not authenticated');
      }

      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return ResponseUtil.error(res, 404, 'User not found');
      }

      // Check if LinkedIn is connected
      if (!user.socialLinks?.linkedinId && !user.socialLinks?.linkedinAccessToken) {
        return ResponseUtil.error(res, 400, 'LinkedIn account not connected');
      }

      // Remove LinkedIn related information
      if (user.socialLinks) {
        user.socialLinks.linkedinId = undefined;
        user.socialLinks.linkedinAccessToken = undefined;
        user.socialLinks.linkedinRefreshToken = undefined;
        user.socialLinks.linkedinTokenExpiry = undefined;
      }

      // Save the updated user
      await user.save();

      // Return successful response with a clear status flag
      return ResponseUtil.success(res, 200, {
        hasLinkedInConnection: false
      }, 'LinkedIn account disconnected successfully');
    } catch (error) {
      console.error('LinkedIn disconnect error:', error);
      next(error instanceof AppError ? error : new AppError('Failed to disconnect LinkedIn account', 500));
    }
  }
}

export default new LinkedInController();
