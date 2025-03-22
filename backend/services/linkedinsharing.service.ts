import axios from 'axios';
import { User } from '../models/user.model';
import { Note } from '../models/note.model';
import { AppError } from '../utils/errors.utils';
import config from '../config/config';

export class LinkedInSharingService {
  /**
   * Check if a user has a linked LinkedIn account
   */
  static async hasLinkedInAccount(userId: string): Promise<boolean> {
    const user = await User.findById(userId);
    return !!(user?.socialLinks?.linkedin);
  }

  /**
   * Share a note to LinkedIn
   */
  static async shareNote(noteId: string, userId: string): Promise<{ success: boolean, shareUrl?: string }> {
    try {
      // Verify user has LinkedIn account
      const hasAccount = await this.hasLinkedInAccount(userId);
      if (!hasAccount) {
        throw new AppError('LinkedIn account not connected', 400);
      }

      // Get the note
      const note = await Note.findById(noteId)
        .populate('user', 'firstName lastName');

      if (!note) {
        throw new AppError('Note not found', 404);
      }

      // Verify the user owns the note
      if (note.user._id.toString() !== userId) {
        throw new AppError('You can only share your own notes', 403);
      }

      // Get the user to get LinkedIn access token
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Prepare the content based on note type and media
      return await this.shareContent(note, user);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to share to LinkedIn', 500);
    }
  }

  /**
   * Share content to LinkedIn based on content type
   */
  private static async shareContent(note: any, user: any): Promise<{ success: boolean, shareUrl?: string }> {
    try {
      // Determine the type of post to create based on note content and media
      const hasMedia = note.mediaAttachments && note.mediaAttachments.length > 0;

      if (hasMedia) {
        const mediaType = note.mediaAttachments[0].type;

        switch (mediaType) {
          case 'image':
            return await this.shareImagePost(note, user);
          case 'video':
            return await this.shareVideoPost(note, user);
          case 'document':
            return await this.shareArticlePost(note, user);
          default:
            return await this.shareTextPost(note, user);
        }
      } else {
        // Text-only post
        return await this.shareTextPost(note, user);
      }
    } catch (error) {
      throw new AppError('Failed to share content to LinkedIn', 500);
    }
  }

  /**
   * Share a text post to LinkedIn
   */
  private static async shareTextPost(note: any, user: any): Promise<{ success: boolean, shareUrl?: string }> {
    try {
      // Prepare the content for LinkedIn's UGC Post API
      const postData = {
        author: `urn:li:person:${user.socialLinks.linkedin}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: `${note.title}\n\n${note.content.substring(0, 1000)}${note.content.length > 1000 ? '...' : ''}`
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      // Make API call to LinkedIn
      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        postData,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken(user)}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      return {
        success: true,
        shareUrl: response.data.id ? `https://www.linkedin.com/feed/update/${response.data.id}` : undefined
      };
    } catch (error) {
      console.error('LinkedIn sharing error:', error);
      throw new AppError('Failed to share text post to LinkedIn', 500);
    }
  }

  /**
   * Share an image post to LinkedIn
   */
  private static async shareImagePost(note: any, user: any): Promise<{ success: boolean, shareUrl?: string }> {
    try {
      // Get the image URL from the note
      const imageUrl = note.mediaAttachments[0].url;

      // Step 1: Register the image with LinkedIn
      const registerImageResponse = await axios.post(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        {
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: `urn:li:person:${user.socialLinks.linkedin}`,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent'
              }
            ]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken(user)}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      // Step 2: Upload the image using the upload URL from LinkedIn
      const uploadUrl = registerImageResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerImageResponse.data.value.asset;

      // Fetch the image data from the URL
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(imageResponse.data, 'binary');

      // Upload the image to LinkedIn
      await axios.put(
        uploadUrl,
        imageBuffer,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken(user)}`,
            'Content-Type': 'application/octet-stream'
          }
        }
      );

      // Step 3: Share the post with the uploaded image
      const postData = {
        author: `urn:li:person:${user.socialLinks.linkedin}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: `${note.title}\n\n${note.content.substring(0, 800)}${note.content.length > 800 ? '...' : ''}`
            },
            shareMediaCategory: 'IMAGE',
            media: [
              {
                status: 'READY',
                description: {
                  text: note.mediaAttachments[0].caption || note.title
                },
                media: asset,
                title: {
                  text: note.title
                }
              }
            ]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        postData,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken(user)}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      return {
        success: true,
        shareUrl: response.data.id ? `https://www.linkedin.com/feed/update/${response.data.id}` : undefined
      };
    } catch (error) {
      console.error('LinkedIn image sharing error:', error);
      throw new AppError('Failed to share image post to LinkedIn', 500);
    }
  }

  /**
   * Share a video post to LinkedIn
   */
  private static async shareVideoPost(note: any, user: any): Promise<{ success: boolean, shareUrl?: string }> {
    try {
      // Get the video URL from the note
      const videoUrl = note.mediaAttachments[0].url;

      // Step 1: Register the video with LinkedIn
      const registerVideoResponse = await axios.post(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        {
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
            owner: `urn:li:person:${user.socialLinks.linkedin}`,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent'
              }
            ]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken(user)}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      // Step 2: Upload the video using the upload URL from LinkedIn
      const uploadUrl = registerVideoResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerVideoResponse.data.value.asset;

      // Fetch the video data from the URL
      const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
      const videoBuffer = Buffer.from(videoResponse.data, 'binary');

      // Upload the video to LinkedIn
      await axios.put(
        uploadUrl,
        videoBuffer,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken(user)}`,
            'Content-Type': 'application/octet-stream'
          }
        }
      );

      // Step 3: Share the post with the uploaded video
      const postData = {
        author: `urn:li:person:${user.socialLinks.linkedin}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: `${note.title}\n\n${note.content.substring(0, 700)}${note.content.length > 700 ? '...' : ''}`
            },
            shareMediaCategory: 'VIDEO',
            media: [
              {
                status: 'READY',
                description: {
                  text: note.mediaAttachments[0].caption || note.title
                },
                media: asset,
                title: {
                  text: note.title
                }
              }
            ]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        postData,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken(user)}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      return {
        success: true,
        shareUrl: response.data.id ? `https://www.linkedin.com/feed/update/${response.data.id}` : undefined
      };
    } catch (error) {
      console.error('LinkedIn video sharing error:', error);
      throw new AppError('Failed to share video post to LinkedIn', 500);
    }
  }

  /**
   * Share a document/article to LinkedIn
   */
  private static async shareArticlePost(note: any, user: any): Promise<{ success: boolean, shareUrl?: string }> {
    try {
      // For articles, we'll create a post with a link to the document
      const documentUrl = note.mediaAttachments[0].url;

      // Create a LinkedIn article post
      const postData = {
        author: `urn:li:person:${user.socialLinks.linkedin}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: `${note.title}\n\n${note.content.substring(0, 500)}${note.content.length > 500 ? '...' : ''}`
            },
            shareMediaCategory: 'ARTICLE',
            media: [
              {
                status: 'READY',
                description: {
                  text: note.mediaAttachments[0].caption || `Check out my document: ${note.title}`
                },
                originalUrl: documentUrl,
                title: {
                  text: note.title
                }
              }
            ]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        postData,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken(user)}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      return {
        success: true,
        shareUrl: response.data.id ? `https://www.linkedin.com/feed/update/${response.data.id}` : undefined
      };
    } catch (error) {
      console.error('LinkedIn article sharing error:', error);
      throw new AppError('Failed to share article to LinkedIn', 500);
    }
  }

  /**
   * Helper method to get a fresh access token for the user
   */
  private static async getAccessToken(user: any): Promise<string> {
    try {
      // You'll need to implement a token refresh mechanism here
      // This will depend on how you're storing LinkedIn tokens

      // For now, we'll assume we have a refresh token stored in the user document
      // In a real implementation, you'd store this securely and refresh as needed

      // Placeholder for token refresh logic
      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        null,
        {
          params: {
            grant_type: 'refresh_token',
            refresh_token: user.socialLinks.linkedinRefreshToken,
            client_id: config.linkedin.clientId,
            client_secret: config.linkedin.clientSecret
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('LinkedIn token refresh error:', error);
      throw new AppError('Failed to refresh LinkedIn access token', 401);
    }
  }
}

export const linkedInSharingService = new LinkedInSharingService();
