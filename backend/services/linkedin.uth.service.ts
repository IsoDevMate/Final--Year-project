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
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    displayImage: string;
  };
}

interface LinkedInEmailResponse {
  elements: Array<{
    handle: string;
    'handle~': {
      emailAddress: string;
    };
  }>;
}

export class LinkedInService {

  constructor(
    private authService: AuthService = new AuthService(),
    // private userModel: typeof User = User,
    // private appError: typeof AppError = AppError
  ) {}

  /**
   * Exchange authorization code for access token
   */
  static async getAccessToken(code: string): Promise<string> {
    try {
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

      return response.data.access_token;
    } catch (error) {
      throw new AppError('Failed to exchange LinkedIn code for token', 400);
    }
  }

  /**
   * Get user profile from LinkedIn
   */
 static  async getUserProfile(accessToken: string): Promise<LinkedInUserProfile> {
    try {
      const response = await axios.get<LinkedInUserProfile>(
        'https://api.linkedin.com/v2/me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          params: {
            projection: '(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))'
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new AppError('Failed to fetch LinkedIn profile', 400);
    }
  }

  /**
   * Get user email from LinkedIn
   */
 static  async getUserEmail(accessToken: string): Promise<string> {
    try {
      const response = await axios.get<LinkedInEmailResponse>(
        'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (!response.data.elements || response.data.elements.length === 0) {
        throw new AppError('Email not found in LinkedIn profile', 400);
      }

      return response.data.elements[0]['handle~'].emailAddress;
    } catch (error) {
      throw new AppError('Failed to fetch LinkedIn email', 400);
    }
  }

  /**
   * Authenticate user with LinkedIn
   */
  static async authenticate(code: string) {
    // Get access token
    const accessToken = await this.getAccessToken(code);

    // Get user profile
    const profile = await this.getUserProfile(accessToken);

    // Get user email
    const email = await this.getUserEmail(accessToken);

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = new User({
        email,
        firstName: profile.localizedFirstName,
        lastName: profile.localizedLastName,
        role: UserRole.ATTENDEE,
        // Generate a random password for the user
        password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)
      });

      await user.save();
    }

    // Generate tokens
    const tokens = await authService.generateTokens(user);
    // Save refresh token to database

    // Don't return the password
    user.password = '';

    return { user, tokens };
  }
}

export default new LinkedInService();
