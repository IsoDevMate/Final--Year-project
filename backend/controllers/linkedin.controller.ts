import { Request, Response, NextFunction } from 'express';
import {LinkedInService } from '../services/linkedin.auth.service';
import { ResponseUtil } from '../utils/response.utils';
import config from '../config/config';
import crypto from 'crypto';
import { User } from '../models/user.model';


export class LinkedInController {

   constructor(
     private linkedInService: LinkedInService = new LinkedInService()
    ) {}
  /**
   * Initiate LinkedIn authentication
   */


static getAuthUrl(req: Request, res: Response) {
  const state = crypto.randomBytes(16).toString('hex');
  const scope = ['openid', 'profile', 'email', 'w_member_social'];
  const responseType = 'code';
  const redirectUri = 'https://final-year-project-56d5.onrender.com/api/v1/auth/linkedin/callback';
  const clientId = config.linkedin.clientId;

  console.log('LinkedIn auth URL generation:', {
    responseType,
    clientId,
    redirectUri,
    state,
    scope
  });

  return ResponseUtil.success(res, 200, {
    url: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=https://final-year-project-56d5.onrender.com/api/v1/auth/linkedin/callback&state=HARDCODED_STATE&scope=openid%20profile%20email%20w_member_social`
  }, 'LinkedIn authentication URL generated successfully');
}

  /**
   * Handle LinkedIn callback
   */

// In linkedin.controller.ts
static async handleCallback(req: Request, res: Response, next: NextFunction) {
  const { code, state } = req.query;
  try {
    console.log('LinkedIn callback received:', req.query);

    if (!code) {
      return ResponseUtil.error(res, 400, 'Authorization code not provided');
    }

    const result = await LinkedInService.authenticate(code.toString());

    // Build the redirect URL with properly encoded parameters
    const redirectUrl = new URL(`${config.frontendUrl}/auth/linkedin/callback`);
    redirectUrl.searchParams.append('accessToken', result.tokens.accessToken);
    redirectUrl.searchParams.append('refreshToken', result.tokens.refreshToken);
    redirectUrl.searchParams.append('linkedinConnected', 'true');

    // Add user data to the redirect URL
    redirectUrl.searchParams.append('user', JSON.stringify(result.user));

    console.log('Redirect URL:', redirectUrl.toString());
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('LinkedIn callback error:', error);

    // Redirect to login page with error message
    const loginUrl = new URL(`${config.frontendUrl}/auth/login`);
    loginUrl.searchParams.append('error', 'LinkedIn authentication failed');
    res.redirect(loginUrl.toString());
  }
  }

 /**
   * Disconnect LinkedIn account
   */

  static async disconnectLinkedIn(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?.userId;

      if (!userId) {
        return ResponseUtil.error(res, 401, 'User not authenticated');
      }

      // Find the user and remove LinkedIn-related information
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $unset: {
            'socialLinks.linkedin': 1,
            'socialLinks.linkedinAccessToken': 1,
            'socialLinks.linkedinRefreshToken': 1,
            'socialLinks.linkedinTokenExpiry': 1
          }
        },
        { new: true }
      );

      if (!user) {
        return ResponseUtil.error(res, 404, 'User not found');
      }

      return ResponseUtil.success(res, 200, {
        hasLinkedInConnection: false
      }, 'LinkedIn account disconnected successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new LinkedInController();
