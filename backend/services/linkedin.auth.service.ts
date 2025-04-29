import axios from 'axios';
import { User, UserRole } from '../models/user.model';
import { AppError } from '../utils/errors.utils';
import { authService, AuthService } from './auth.service';
import config from '../config/config';

interface LinkedInTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
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
  ) { }

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

  static async authenticate(code: string) {
    try {
      // Get access token
      const tokenResponse = await this.getAccessTokenInitial(code);

      // Get user profile
      const profile = await this.getUserProfile(tokenResponse.access_token);

      // Find or create user
      let user = await User.findOne({ email: profile.email });

      if (!user) {
        // Create new user
        user = new User({
          email: profile.email,
          firstName: profile.given_name,
          lastName: profile.family_name,
          role: UserRole.ATTENDEE,
          profileImage: profile.picture || '',
          bio: profile.name || 'Default user bio',
          password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
          socialLinks: {
            linkedinId: profile.sub,
            linkedinAccessToken: tokenResponse.access_token,
            // Only add refresh token if it exists
            ...(tokenResponse.refresh_token && {
              linkedinRefreshToken: tokenResponse.refresh_token
            }),
            linkedinTokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
          }
        });

        await user.save();
      } else {
        // Update existing user's LinkedIn tokens
        user.socialLinks = {
          ...user.socialLinks,
          linkedinId: profile.sub,
          linkedinAccessToken: tokenResponse.access_token,
          // Only update refresh token if it exists
          ...(tokenResponse.refresh_token && {
            linkedinRefreshToken: tokenResponse.refresh_token
          }),
          linkedinTokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
        };
        await user.save();
      }

      // Generate tokens
      const tokens = await authService.generateTokens(user);

      const userObject = user.toObject();
      console.log('User object:', userObject);
      return { user: userObject, tokens };
    } catch (error) {
      console.error('LinkedIn authentication error:', error as Error);
      throw error instanceof AppError ? error as Error : new AppError((error as Error).message, 400);
    }
  }

  /**
   * Get initial access token with authorization code
   */
  static async getAccessTokenInitial(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }> {
    try {
      const response = await axios.post(
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


      console.log('LinkedIn Token Response:', response.data);

      return response.data;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new AppError('Failed to exchange LinkedIn code for token', 400);
    }
  }

  static async refreshLinkedInToken(user: any): Promise<void> {
    // Check if refresh token exists
    if (!user.socialLinks?.linkedinRefreshToken) {
      console.warn('No LinkedIn refresh token available for user:', user._id);
      throw new AppError('No LinkedIn refresh token available. Please reconnect your LinkedIn account.', 401);
    }

    try {
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: user.socialLinks.linkedinRefreshToken,
          client_id: config.linkedin.clientId,
          client_secret: config.linkedin.clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // Log the response to understand what's being returned
      console.log('LinkedIn Refresh Token Response:', response.data);

      // Update user's tokens
      user.socialLinks.linkedinAccessToken = response.data.access_token;
      user.socialLinks.linkedinTokenExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

      // Optional: Update refresh token if a new one is provided
      if (response.data.refresh_token) {
        user.socialLinks.linkedinRefreshToken = response.data.refresh_token;
      }

      await user.save();
    } catch (error) {
      console.error('LinkedIn token refresh failed:', error);
      throw new AppError('Failed to refresh LinkedIn token. Please reconnect your account.', 401);
    }
  }


  /**
  * Get current valid access token for a user
  */
  static async getValidAccessToken(user: any): Promise<string> {
  // Simply return the saved access token from the database
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Directly access linkedinAccessToken at the root of socialLinks
  if (!user.socialLinks || !user.socialLinks.linkedinAccessToken) {
    console.log(user, "user object");
    throw new AppError('No LinkedIn access token found', 401);
  }

  // Check if current token is valid (not expired)
  if (user.socialLinks.linkedinTokenExpiry &&
      new Date(user.socialLinks.linkedinTokenExpiry) > new Date()) {
    return user.socialLinks.linkedinAccessToken;
  }

  return user.socialLinks.linkedinAccessToken;
}
}



export default new LinkedInService();
