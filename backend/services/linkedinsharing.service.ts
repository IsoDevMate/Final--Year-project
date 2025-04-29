import axios from 'axios';
import { User } from '../models/user.model';
import { Note } from '../models/note.model';
import { AppError } from '../utils/errors.utils';
import { LinkedInService } from './linkedin.auth.service';
export class LinkedInSharingService {

  /**
   * Check if a user has a linked LinkedIn account
   */
  static async hasLinkedInAccount(userId: string): Promise<boolean> {
    const user = await User.findById(userId);
    return !!(user?.socialLinks?.linkedinId);
  }

  /**
   * Share a note to LinkedIn
   */
 static async shareNote(noteId: string, userId: string,customMessage?: string): Promise<{ success: boolean, shareUrl?: string }> {
  try {
    // Log incoming parameters for debugging
    console.log('Sharing Note - NoteID:', noteId);
    console.log('Sharing Note - UserID:', userId);

    // Verify user has LinkedIn account
    const hasAccount = await this.hasLinkedInAccount(userId);
    if (!hasAccount) {
      throw new AppError('LinkedIn account not connected', 400);
    }

    // Get the note
    const note = await Note.findById(noteId)
      .populate('user', 'firstName lastName');

    // Add more detailed logging
    if (!note) {
      console.error('Note not found with ID:', noteId);
      throw new AppError('Note not found', 404);
    }

    console.log('Note found:', note);
    console.log('Note User:', note.user);

    // Verify the user owns the note
    if (!note.user || note.user._id.toString() !== userId) {
      console.error('Note ownership verification failed', {
        noteUserId: note.user?._id.toString(),
        requestUserId: userId
      });
      throw new AppError('You can only share your own notes', 403);
    }

    // Get the user to get LinkedIn access token
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found with ID:', userId);
      throw new AppError('User not found', 404);
    }

  const postContent = customMessage
      ? `${customMessage}\n\n${note.title}\n\n${note.content.substring(0, 800)}${note.content.length > 800 ? '...' : ''}`
      : `${note.title}\n\n${note.content.substring(0, 800)}${note.content.length > 800 ? '...' : ''}`;

    // Use existing sharing logic with modified content
    return await this.shareContent({
      ...note,
      content: postContent
    }, user);
  } catch (error) {
    console.error('Full share note error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to share to LinkedIn', 500);
  }
}

  /**
   * Share content to LinkedIn based on content type
   */
   static async shareContent(note: any, user: any): Promise<{ success: boolean, shareUrl?: string }> {
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
   static async shareTextPost(note: any, user: any): Promise<{ success: boolean, shareUrl?: string }> {
     try {
      const accessToken = await this.getAccessToken(user);
      if (!accessToken) {
        throw new AppError('No LinkedIn access token found', 401);
      }
      // Prepare the content for LinkedIn's UGC Post API
      const postData = {
        author: `urn:li:person:${user?.socialLinks?.linkedinId}`,
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
      }

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
   static async shareImagePost(note: any, user: any): Promise<{ success: boolean, shareUrl?: string }> {
    try {
      // Get the image URL from the note
      const imageUrl = note.mediaAttachments[0].url;

      // Step 1: Register the image with LinkedIn
      const registerImageResponse = await axios.post(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        {
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: `urn:li:person:${user?.socialLinks?.linkedinId}`,
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
        author: `urn:li:person:${user?.socialLinks?.linkedinId}`,
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
   static async shareVideoPost(note: any, user: any): Promise<{ success: boolean, shareUrl?: string }> {
     try {


      // Get the video URL from the note
      const videoUrl = note.mediaAttachments[0].url;

      // Step 1: Register the video with LinkedIn
      const registerVideoResponse = await axios.post(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        {
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
            owner: `urn:li:person:${user?.socialLinks?.linkedinId}`,
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
        author: `urn:li:person:${user?.socialLinks?.linkedinId}`,
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
   static async shareArticlePost(note: any, user: any): Promise<{ success: boolean, shareUrl?: string }> {
    try {
      // For articles, we'll create a post with a link to the document
      const documentUrl = note.mediaAttachments[0].url;

      // Create a LinkedIn article post
      const postData = {
        author: `urn:li:person:${user?.socialLinks?.linkedinId}`,
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
 static async getAccessToken(user: any): Promise<string> {
  try {

    const isTokenValid = user.socialLinks?.linkedinTokenExpiry &&  new Date(user.socialLinks.linkedinTokenExpiry) > new Date();

    if (!isTokenValid) {
      // Token is expired or about to expire, try to refresh it
      console.log('LinkedIn access token expired or invalid, attempting refresh...');
      await LinkedInService.refreshLinkedInToken(user);

      // Reload the user to get updated token info
      const updatedUser = await User.findById(user._id);
      if (!updatedUser) {
        throw new AppError('User not found after token refresh', 404);
      }

      return updatedUser.socialLinks?.linkedinAccessToken || '';
    }

    // Token is still valid, return it
    return user.socialLinks?.linkedinAccessToken;
  } catch (error) {
    console.error('LinkedIn token retrieval error:', error);

    // Handle specific error cases
    if (error instanceof AppError && error.message.includes('No LinkedIn refresh token')) {
      throw new AppError('LinkedIn session expired. Please reconnect your LinkedIn account.', 401);
    }

    throw new AppError('Failed to get valid LinkedIn access token', 401);
  }
}
}

export const linkedInSharingService = new LinkedInSharingService();
