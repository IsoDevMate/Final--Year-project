import { User } from '../models/user.model';
import { AppError } from '../utils/errors.utils';
import { LinkedInService } from './linkedin.auth.service';

export class LinkedInStatusService {
  /**
   * Comprehensively check LinkedIn connection status
   */
  static async checkLinkedInStatus(userId: string): Promise<{
    hasLinkedIn: boolean;
    linkedInId?: string;
    isTokenValid: boolean;
  }> {
    try {
      // Find user with detailed social links
      const user = await User.findById(userId).select('socialLinks');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if LinkedIn ID exists
      const hasLinkedInId = !!user.socialLinks?.linkedinId;

      // Check token validity
      const isTokenValid = this.isLinkedInTokenValid(user);

      return {
        hasLinkedIn: hasLinkedInId,
        linkedInId: user.socialLinks?.linkedinId
        isTokenValid
      };
    } catch (error) {
      console.error('LinkedIn status check error:', error);
      throw new AppError('Failed to check LinkedIn status', 500);
    }
  }

  /**
   * Validate LinkedIn token
   */
  private static isLinkedInTokenValid(user: any): boolean {
    // Check if tokens exist and are not expired
    const hasAccessToken = !!user.socialLinks?.linkedinAccessToken;
    const hasTokenExpiry = user.socialLinks?.linkedinTokenExpiry;

    if (!hasAccessToken || !hasTokenExpiry) {
      return false;
    }

    // Check if token is still valid (not expired)
    return new Date(user.socialLinks.linkedinTokenExpiry) > new Date();
  }

  /**
   * Attempt to refresh LinkedIn token if invalid
   */
  static async refreshTokenIfNeeded(user: any): Promise<boolean> {
    try {
      // If token is invalid, attempt to refresh
      if (!this.isLinkedInTokenValid(user)) {
        await LinkedInService.refreshLinkedInToken(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }
}

export default LinkedInStatusService;
