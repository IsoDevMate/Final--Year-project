import { Request, Response, NextFunction } from 'express';
import { LinkedInSharingService } from '../services/linkedinsharing.service';
import { ResponseUtil } from '../utils/response.utils';
import { AppError } from '../utils/errors.utils';
import { LinkedInService } from '../services/linkedin.auth.service';
import { User } from '../models/user.model';

export class LinkedInSharingController {
  /**
   * Check if a user has a linked LinkedIn account
   */
  static async checkLinkedInStatus(req: Request, res: Response, next: NextFunction) {
    try {
      // Get userId from authenticated user
      const userId = (req.user as any)?.userId;

      if (!userId) {
        return ResponseUtil.error(res, 401, 'User not authenticated');
      }

      // Find user with detailed social links
      const user = await User.findById(userId).select('socialLinks');

      if (!user) {
        return ResponseUtil.error(res, 404, 'User not found');
      }

      // Check if LinkedIn ID exists
      const hasLinkedInId = !!user.socialLinks?.linkedinId

      // Check token validity - use a separate function to avoid 'this' context issues
      const isTokenValid = LinkedInSharingController.validateLinkedInToken(user);

      return ResponseUtil.success(res, 200, {
        hasLinkedIn: hasLinkedInId,
        linkedInId: user.socialLinks?.linkedinId,
        isTokenValid
      }, 'LinkedIn account status retrieved');
    } catch (error) {
      console.error('LinkedIn status check error:', error);
      next(new AppError('Failed to check LinkedIn status', 500));
    }
  }

  /**
   * Validate LinkedIn token
   */


  /**
   * Attempt to refresh LinkedIn token if invalid
   */
  static async refreshTokenIfNeeded(user: any): Promise<boolean> {
    try {
      // If token is invalid, attempt to refresh
      if (!this.validateLinkedInToken(user)) {
        await LinkedInService.refreshLinkedInToken(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }



  static async shareNote(req: Request, res: Response, next: NextFunction) {
  try {
    const { noteId } = req.params;
    const { customMessage } = req.body;
    const userId = (req.user as any)?.userId;

    if (!userId) {
      return ResponseUtil.error(res, 401, 'User not authenticated');
    }

    const result = await LinkedInSharingService.shareNote(noteId, userId, customMessage);

    return ResponseUtil.success(res, 200, result, 'Note successfully shared to LinkedIn');
  } catch (error) {
    next(error);
  }
}

/**
 * Share content to LinkedIn based on content type
*/
static async shareContent(req: Request, res: Response, next: NextFunction) {
  try {
     const { note, user } = req.body;
     const userId = (req.user as any)?.userId;

      if (!userId) {
        return ResponseUtil.error(res, 401, 'User not authenticated');
      }

      const result = await LinkedInSharingService.shareContent(note, user);

      return ResponseUtil.success(res, 200, result, 'Content successfully shared to LinkedIn');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Specific method to share text post
   */
  static async shareTextPost(req: Request, res: Response, next: NextFunction) {
    try {
      const { note, user } = req.body;
      const userId = (req.user as any)?.userId;

      if (!userId) {
        return ResponseUtil.error(res, 401, 'User not authenticated');
      }

      const result = await LinkedInSharingService.shareTextPost(note, user);

      return ResponseUtil.success(res, 200, result, 'Text post successfully shared to LinkedIn');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Specific method to share image post
  */
 // static async shareImagePost(req: Request, res: Response, next: NextFunction) {
  //   try {
    //     const { note, user } = req.body;
    //     const userId = (req.user as any)?.userId;

    //     if (!userId) {
      //       return ResponseUtil.error(res, 401, 'User not authenticated');
      //     }

      //     const result = await LinkedInSharingService.shareImagePost(note, user);

      //     return ResponseUtil.success(res, 200, result, 'Image post successfully shared to LinkedIn');
      //   } catch (error) {
        //     next(error);
        //   }
        // }

        // static validateLinkedInToken(user: any): boolean {
        //   // Check if tokens exist and are not expired
        //   const hasAccessToken = !!user.socialLinks?.linkedinAccessToken;
        //   const hasTokenExpiry = user.socialLinks?.linkedinTokenExpiry;

        //   if (!hasAccessToken || !hasTokenExpiry) {
        //     return false;
        //   }

        //   // Check if token is still valid (not expired)
        //   return new Date(user.socialLinks.linkedinTokenExpiry) > new Date();
        // }


  /**
 * Fix for shareImagePost method in LinkedInSharingController
 */
static async shareImagePost(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as any)?.userId;

    if (!userId) {
      return ResponseUtil.error(res, 401, 'User not authenticated');
    }

    // First retrieve the full user record to ensure we have complete data
    const user = await User.findById(userId);
    if (!user) {
      return ResponseUtil.error(res, 404, 'User not found');
    }

    // Check if LinkedIn account is connected
    if (!user.socialLinks?.linkedinId) {
      return ResponseUtil.error(res, 400, 'LinkedIn account not connected. Please connect your LinkedIn account first.');
    }

    // Check if token exists and is valid
    const isTokenValid = LinkedInSharingController.validateLinkedInToken(user);
    if (!isTokenValid && !user.socialLinks?.linkedinRefreshToken) {
      return ResponseUtil.error(res, 401, 'LinkedIn session expired. Please reconnect your LinkedIn account.');
    }

    // Now pass the full user object instead of just req.body.user
    const result = await LinkedInSharingService.shareImagePost(req.body.note, user);

    return ResponseUtil.success(res, 200, result, 'Image post successfully shared to LinkedIn');
  } catch (error) {
    console.error('Controller error:', error);

    // Handle specific error types
    if (error instanceof AppError) {
      return ResponseUtil.error(res, error.statusCode || 500, error.message);
    }

    next(error);
  }
}

/**
 * Fix for validateLinkedInToken method in LinkedInSharingController
 */
static validateLinkedInToken(user: any): boolean {
  if (!user || !user.socialLinks) {
    return false;
  }

  // Check if tokens exist and are not expired
  const hasAccessToken = !!user.socialLinks.linkedinAccessToken;
  const hasTokenExpiry = user.socialLinks.linkedinTokenExpiry;

  if (!hasAccessToken || !hasTokenExpiry) {
    return false;
  }

  // Check if token is still valid (not expired)
  const expiryDate = new Date(user.socialLinks.linkedinTokenExpiry);
  const now = new Date();

  // Add some logging for debugging
  console.log('Token expiry check:', {
    expiryDate,
    now,
    isValid: expiryDate > now
  });
  
  return expiryDate > now;
}


        /**
         * Specific method to share video post
        */
       static async shareVideoPost(req: Request, res: Response, next: NextFunction) {
         try {
           const { note, user } = req.body;
      const userId = (req.user as any)?.userId;

      if (!userId) {
        return ResponseUtil.error(res, 401, 'User not authenticated');
      }

      const result = await LinkedInSharingService.shareVideoPost(note, user);

      return ResponseUtil.success(res, 200, result, 'Video post successfully shared to LinkedIn');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Specific method to share article/document post
   */
  static async shareArticlePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { note, user } = req.body;
      const userId = (req.user as any)?.userId;

      if (!userId) {
        return ResponseUtil.error(res, 401, 'User not authenticated');
      }

      const result = await LinkedInSharingService.shareArticlePost(note, user);

      return ResponseUtil.success(res, 200, result, 'Article post successfully shared to LinkedIn');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get access token for LinkedIn
   */
  static async getAccessToken(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.body.user;
      const userId = (req.user as any)?.userId;

      if (!userId) {
        return ResponseUtil.error(res, 401, 'User not authenticated');
      }

      const accessToken = await LinkedInSharingService.getAccessToken(user);

      return ResponseUtil.success(res, 200, { accessToken }, 'LinkedIn access token retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export default LinkedInSharingController;
