import { Request, Response, NextFunction } from 'express';
import { LinkedInSharingService } from '../services/linkedinsharing.service';
import { ResponseUtil } from '../utils/response.utils';
import { AppError } from '../utils/errors.utils';

export class LinkedInSharingController {
  /**
   * Share a note to LinkedIn
   */
  static async shareNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { noteId } = req.params;
     // In linkedinsharing.controller.ts
      const userId = (req.user as any)?.userId;

      if (!userId) {
        return ResponseUtil.error(res, 401, 'User not authenticated');
      }

      const result = await LinkedInSharingService.shareNote(noteId, userId);

      return ResponseUtil.success(res, 200, result, 'Successfully shared to LinkedIn');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if a user has LinkedIn sharing capabilities
   */
  static async checkLinkedInStatus(req: Request, res: Response, next: NextFunction) {
    try {
      // In linkedinsharing.controller.ts
     const userId = (req.user as any)?.userId;

      if (!userId) {
        return ResponseUtil.error(res, 401, 'User not authenticated');
      }

      const hasLinkedIn = await LinkedInSharingService.hasLinkedInAccount(userId);

      return ResponseUtil.success(res, 200, { hasLinkedIn }, 'LinkedIn status retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
