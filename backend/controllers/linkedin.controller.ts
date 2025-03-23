import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import {LinkedInService } from '../services/linkedin.auth.service';
import { ResponseUtil } from '../utils/response.utils';
import config from '../config/config';
import crypto from 'crypto';


export class LinkedInController {

   constructor(
     private linkedInService: LinkedInService = new LinkedInService()
    ) {}
  /**
   * Initiate LinkedIn authentication
   */


  static getAuthUrl(req: Request, res: Response) {
  const state = crypto.randomBytes(16).toString('hex'); // More secure random state
  const scope = ['openid', 'profile', 'email', 'w_member_social'];
  const responseType = 'code';
  const redirectUri = config.linkedin.callbackUrl;
  const clientId = config.linkedin.clientId;



    const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope.join(' ')}`;
    return ResponseUtil.success(res, 200, { url: linkedInAuthUrl }, 'LinkedIn authentication URL');
  };


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
}

export default new LinkedInController();
