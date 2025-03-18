

import axios from 'axios';
import { User, UserRole } from '../models/user.model';
import { AppError } from '../utils/errors.utils';
import { authService, AuthService } from './auth.service';
import config from '../config/config';

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
}

interface LinkedInUserProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name: string;
  family_name: string;
  name: string;
  picture?: string;
}

export class LinkedInService {

  constructor(
    private authService: AuthService = new AuthService(),
    private userModel: typeof User = User,
    private appError: typeof AppError = AppError
  ) {}

  /**
   * Exchange authorization code for access token
   */
  static async getAccessToken(code: string): Promise<string> {
    try {
      console.log('Getting access token with code:', code);

      const response = await axios.post<LinkedInTokenResponse>(
        'https://www.linkedin.com/oauth/v2/accessToken',
        null,
        {
          params: {
            grant_type: 'authorization_code',
            code,
            client_id: config.linkedin.clientId,
            client_secret: config.linkedin.clientSecret,
            redirect_uri: config.linkedin.callbackUrl
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log('LinkedIn token response:', response.data);
      return response.data.access_token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('LinkedIn token error:', error.response?.data || (error as Error).message);
      } else {
        console.error('LinkedIn token error:', (error as Error).message);
      }
      throw new AppError('Failed to exchange LinkedIn code for token', 400);
    }
  }

  /**
   * Get user profile from LinkedIn using the userinfo endpoint
   */
  static async getUserProfile(accessToken: string): Promise<LinkedInUserProfile> {
    try {
      console.log('Getting user profile with token:', accessToken);

      const response = await axios.get<LinkedInUserProfile>(
        'https://api.linkedin.com/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      console.log('LinkedIn profile response:', response.data);

      if (!response.data || Object.keys(response.data).length === 0) {
        throw new AppError('Empty profile returned from LinkedIn', 400);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('LinkedIn profile error:', error.response?.data || (error as Error).message);
      } else {
        console.error('LinkedIn profile error:', (error as Error).message);
      }
      throw new AppError('Failed to fetch LinkedIn profile', 400);
    }
  }

  /**
   * Authenticate user with LinkedIn
   */
  static async authenticate(code: string) {
    try {
      // Get access token
      const accessToken = await this.getAccessToken(code);
      if (!accessToken) {
        throw new AppError('Failed to get access token', 400);
      }
      console.log('Access token received successfully');

      // Get user profile (which includes email in the userinfo endpoint)
      const profile = await this.getUserProfile(accessToken);

      if (!profile) {
        throw new AppError('Failed to get user profile', 400);
      }
      console.log('User profile received successfully');

      // Check if email exists and is valid
      if (!profile.email || !profile.email.includes('@')) {
        throw new AppError('Invalid or missing email in LinkedIn profile', 400);
      }

      // Find or create user
      let user = await User.findOne({ email: profile.email });

      if (!user) {
        // Create new user
        user = new User({
          email: profile.email,
          firstName: profile.given_name,
          lastName: profile.family_name,
          role: UserRole.ATTENDEE,
          // Generate a random password for the user
          password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
          socialLinks: {
            linkedin: profile.sub
          }
        });

        await user.save();
      } else if (!user.socialLinks?.linkedin) {
        // Update existing user with LinkedIn ID if not set
        user.socialLinks = {
          ...user.socialLinks,
          linkedin: profile.sub
        };
        await user.save();
      }

      // Generate tokens
      const tokens = await authService.generateTokens(user);

      // Don't return the password
      const userObject = user.toObject();
    //  delete userObject.password;

      return { user: userObject, tokens };
    } catch (error) {
      console.error('LinkedIn authentication error:', error as Error);
      throw error instanceof AppError ? error as Error : new AppError((error as Error).message, 400);
    }
  }
}

export default new LinkedInService();
