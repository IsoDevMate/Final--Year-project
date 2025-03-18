// src/controllers/linkedin.controller.ts
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



static async handleCallback(req: Request, res: Response, next: NextFunction) {
  const { code, state } = req.query;
  try {
    console.log('LinkedIn callback received:', req.query);
    console.log('LinkedIn callback code:', code);
    console.log('LinkedIn callback state:', state);

    if (!code) {
      return ResponseUtil.error(res, 400, 'Authorization code is required');
    }

    const { user, tokens } = await LinkedInService.authenticate(code.toString());

    return ResponseUtil.success(res, 200, { user, tokens }, 'LinkedIn authentication successful');
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    next(error);
  }
}
}

export default new LinkedInController();
