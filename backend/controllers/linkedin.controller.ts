// src/controllers/linkedin.controller.ts
import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import {LinkedInService } from '../services/linkedin.uth.service';
import { ResponseUtil } from '../utils/response.utils';
import config from '../config/config';
declare module 'express-session' {
  interface SessionData {
    linkedInState: string;
  }
}

export class LinkedInController {

   constructor(
     private linkedInService: LinkedInService = new LinkedInService()
    ) {}
  /**
   * Initiate LinkedIn authentication
   */
  static getAuthUrl(req: Request, res: Response) {
    const state = Math.random().toString(36).substring(2, 15);

    // Store state in session or cookie for validation
    req.session.linkedInState = state;

    const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${
      config.linkedin.clientId
    }&redirect_uri=${encodeURIComponent(
      config.linkedin.callbackUrl
    )}&state=${state}&scope=r_liteprofile%20r_emailaddress`;

    return ResponseUtil.success(res, 200, { url: linkedInAuthUrl }, 'LinkedIn authentication URL');
  }

  /**
   * Handle LinkedIn callback
   */
 static  async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state } = req.query;

      // Validate state to prevent CSRF attacks
      if (!state || state !== req.session.linkedInState) {
        return ResponseUtil.error(res, 400, 'Invalid state parameter');
      }

      // Clear state from session
      delete req.session.linkedInState;

      if (!code) {
        return ResponseUtil.error(res, 400, 'Authorization code is required');
      }

      const { user, tokens } = await LinkedInService.authenticate(code.toString());

      return ResponseUtil.success(res, 200, { user, tokens }, 'LinkedIn authentication successful');
    } catch (error) {
      next(error);
    }
  }
}

export default new LinkedInController();
