"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkedInSharingService = exports.LinkedInSharingService = void 0;
const axios_1 = __importDefault(require("axios"));
const user_model_1 = require("../models/user.model");
const note_model_1 = require("../models/note.model");
const errors_utils_1 = require("../utils/errors.utils");
const linkedin_auth_service_1 = require("./linkedin.auth.service");
class LinkedInSharingService {
    /**
     * Check if a user has a linked LinkedIn account
     */
    static hasLinkedInAccount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield user_model_1.User.findById(userId);
            return !!((_a = user === null || user === void 0 ? void 0 : user.socialLinks) === null || _a === void 0 ? void 0 : _a.linkedinId);
        });
    }
    /**
     * Share a note to LinkedIn
     */
    static shareNote(noteId, userId, customMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Log incoming parameters for debugging
                console.log('Sharing Note - NoteID:', noteId);
                console.log('Sharing Note - UserID:', userId);
                // Verify user has LinkedIn account
                const hasAccount = yield this.hasLinkedInAccount(userId);
                if (!hasAccount) {
                    throw new errors_utils_1.AppError('LinkedIn account not connected', 400);
                }
                // Get the note
                const note = yield note_model_1.Note.findById(noteId)
                    .populate('user', 'firstName lastName');
                // Add more detailed logging
                if (!note) {
                    console.error('Note not found with ID:', noteId);
                    throw new errors_utils_1.AppError('Note not found', 404);
                }
                console.log('Note found:', note);
                console.log('Note User:', note.user);
                // Verify the user owns the note
                if (!note.user || note.user._id.toString() !== userId) {
                    console.error('Note ownership verification failed', {
                        noteUserId: (_a = note.user) === null || _a === void 0 ? void 0 : _a._id.toString(),
                        requestUserId: userId
                    });
                    throw new errors_utils_1.AppError('You can only share your own notes', 403);
                }
                // Get the user to get LinkedIn access token
                const user = yield user_model_1.User.findById(userId);
                if (!user) {
                    console.error('User not found with ID:', userId);
                    throw new errors_utils_1.AppError('User not found', 404);
                }
                const postContent = customMessage
                    ? `${customMessage}\n\n${note.title}\n\n${note.content.substring(0, 800)}${note.content.length > 800 ? '...' : ''}`
                    : `${note.title}\n\n${note.content.substring(0, 800)}${note.content.length > 800 ? '...' : ''}`;
                // Use existing sharing logic with modified content
                return yield this.shareContent(Object.assign(Object.assign({}, note), { content: postContent }), user);
            }
            catch (error) {
                console.error('Full share note error:', error);
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to share to LinkedIn', 500);
            }
        });
    }
    /**
     * Share content to LinkedIn based on content type
     */
    static shareContent(note, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Determine the type of post to create based on note content and media
                const hasMedia = note.mediaAttachments && note.mediaAttachments.length > 0;
                if (hasMedia) {
                    const mediaType = note.mediaAttachments[0].type;
                    switch (mediaType) {
                        case 'image':
                            return yield this.shareImagePost(note, user);
                        case 'video':
                            return yield this.shareVideoPost(note, user);
                        case 'document':
                            return yield this.shareArticlePost(note, user);
                        default:
                            return yield this.shareTextPost(note, user);
                    }
                }
                else {
                    // Text-only post
                    return yield this.shareTextPost(note, user);
                }
            }
            catch (error) {
                throw new errors_utils_1.AppError('Failed to share content to LinkedIn', 500);
            }
        });
    }
    /**
     * Share a text post to LinkedIn
     */
    static shareTextPost(note, user) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const accessToken = yield this.getAccessToken(user);
                if (!accessToken) {
                    throw new errors_utils_1.AppError('No LinkedIn access token found', 401);
                }
                // Prepare the content for LinkedIn's UGC Post API
                const postData = {
                    author: `urn:li:person:${(_a = user === null || user === void 0 ? void 0 : user.socialLinks) === null || _a === void 0 ? void 0 : _a.linkedinId}`,
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
                const response = yield axios_1.default.post('https://api.linkedin.com/v2/ugcPosts', postData, {
                    headers: {
                        'Authorization': `Bearer ${yield this.getAccessToken(user)}`,
                        'Content-Type': 'application/json',
                        'X-Restli-Protocol-Version': '2.0.0'
                    }
                });
                return {
                    success: true,
                    shareUrl: response.data.id ? `https://www.linkedin.com/feed/update/${response.data.id}` : undefined
                };
            }
            catch (error) {
                console.error('LinkedIn sharing error:', error);
                throw new errors_utils_1.AppError('Failed to share text post to LinkedIn', 500);
            }
        });
    }
    /**
     * Share an image post to LinkedIn
     */
    //  static async shareImagePost(note: any, user: any): Promise<{ success: boolean, shareUrl?: string }> {
    //   try {
    //      const accessToken = await this.getAccessToken(user);
    //     if (!accessToken) {
    //       throw new AppError('No LinkedIn access token found', 401);
    //     }
    //     // Get the image URL from the note
    //     const imageUrl = note.mediaAttachments[0].url;
    //     // Step 1: Register the image with LinkedIn
    //     const registerImageResponse = await axios.post(
    //       'https://api.linkedin.com/v2/assets?action=registerUpload',
    //       {
    //         registerUploadRequest: {
    //           recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
    //           owner: `urn:li:person:${user?.socialLinks?.linkedinId}`,
    //           serviceRelationships: [
    //             {
    //               relationshipType: 'OWNER',
    //               identifier: 'urn:li:userGeneratedContent'
    //             }
    //           ]
    //         }
    //       },
    //       {
    //         headers: {
    //           'Authorization': `Bearer ${await this.getAccessToken(user)}`,
    //           'Content-Type': 'application/json',
    //           'X-Restli-Protocol-Version': '2.0.0'
    //         }
    //       }
    //     );
    //     // Step 2: Upload the image using the upload URL from LinkedIn
    //     const uploadUrl = registerImageResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    //     const asset = registerImageResponse.data.value.asset;
    //     // Fetch the image data from the URL
    //     const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    //     const imageBuffer = Buffer.from(imageResponse.data, 'binary');
    //     // Upload the image to LinkedIn
    //     await axios.put(
    //       uploadUrl,
    //       imageBuffer,
    //       {
    //         headers: {
    //           'Authorization': `Bearer ${await this.getAccessToken(user)}`,
    //           'Content-Type': 'application/octet-stream'
    //         }
    //       }
    //     );
    //     // Step 3: Share the post with the uploaded image
    //     const postData = {
    //       author: `urn:li:person:${user?.socialLinks?.linkedinId}`,
    //       lifecycleState: 'PUBLISHED',
    //       specificContent: {
    //         'com.linkedin.ugc.ShareContent': {
    //           shareCommentary: {
    //             text: `${note.title}\n\n${note.content.substring(0, 800)}${note.content.length > 800 ? '...' : ''}`
    //           },
    //           shareMediaCategory: 'IMAGE',
    //           media: [
    //             {
    //               status: 'READY',
    //               description: {
    //                 text: note.mediaAttachments[0].caption || note.title
    //               },
    //               media: asset,
    //               title: {
    //                 text: note.title
    //               }
    //             }
    //           ]
    //         }
    //       },
    //       visibility: {
    //         'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    //       }
    //     };
    //     const response = await axios.post(
    //       'https://api.linkedin.com/v2/ugcPosts',
    //       postData,
    //       {
    //         headers: {
    //           'Authorization': `Bearer ${await this.getAccessToken(user)}`,
    //           'Content-Type': 'application/json',
    //           'X-Restli-Protocol-Version': '2.0.0'
    //         }
    //       }
    //     );
    //     return {
    //       success: true,
    //       shareUrl: response.data.id ? `https://www.linkedin.com/feed/update/${response.data.id}` : undefined
    //     };
    //   } catch (error) {
    //     console.error('LinkedIn image sharing error:', error);
    //     throw new AppError('Failed to share image post to LinkedIn', 500);
    //   }
    // }
    /**
     * Share a video post to LinkedIn
     */
    static shareVideoPost(note, user) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const accessToken = yield this.getAccessToken(user);
                if (!accessToken) {
                    throw new errors_utils_1.AppError('No LinkedIn access token found', 401);
                }
                // Get the video URL from the note
                const videoUrl = note.mediaAttachments[0].url;
                // Step 1: Register the video with LinkedIn
                const registerVideoResponse = yield axios_1.default.post('https://api.linkedin.com/v2/assets?action=registerUpload', {
                    registerUploadRequest: {
                        recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
                        owner: `urn:li:person:${(_a = user === null || user === void 0 ? void 0 : user.socialLinks) === null || _a === void 0 ? void 0 : _a.linkedinId}`,
                        serviceRelationships: [
                            {
                                relationshipType: 'OWNER',
                                identifier: 'urn:li:userGeneratedContent'
                            }
                        ]
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${yield this.getAccessToken(user)}`,
                        'Content-Type': 'application/json',
                        'X-Restli-Protocol-Version': '2.0.0'
                    }
                });
                // Step 2: Upload the video using the upload URL from LinkedIn
                const uploadUrl = registerVideoResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
                const asset = registerVideoResponse.data.value.asset;
                // Fetch the video data from the URL
                const videoResponse = yield axios_1.default.get(videoUrl, { responseType: 'arraybuffer' });
                const videoBuffer = Buffer.from(videoResponse.data, 'binary');
                // Upload the video to LinkedIn
                yield axios_1.default.put(uploadUrl, videoBuffer, {
                    headers: {
                        'Authorization': `Bearer ${yield this.getAccessToken(user)}`,
                        'Content-Type': 'application/octet-stream'
                    }
                });
                // Step 3: Share the post with the uploaded video
                const postData = {
                    author: `urn:li:person:${(_b = user === null || user === void 0 ? void 0 : user.socialLinks) === null || _b === void 0 ? void 0 : _b.linkedinId}`,
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
                const response = yield axios_1.default.post('https://api.linkedin.com/v2/ugcPosts', postData, {
                    headers: {
                        'Authorization': `Bearer ${yield this.getAccessToken(user)}`,
                        'Content-Type': 'application/json',
                        'X-Restli-Protocol-Version': '2.0.0'
                    }
                });
                return {
                    success: true,
                    shareUrl: response.data.id ? `https://www.linkedin.com/feed/update/${response.data.id}` : undefined
                };
            }
            catch (error) {
                console.error('LinkedIn video sharing error:', error);
                throw new errors_utils_1.AppError('Failed to share video post to LinkedIn', 500);
            }
        });
    }
    /**
     * Share a document/article to LinkedIn
     */
    static shareArticlePost(note, user) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const accessToken = yield this.getAccessToken(user);
                if (!accessToken) {
                    throw new errors_utils_1.AppError('No LinkedIn access token found', 401);
                }
                // For articles, we'll create a post with a link to the document
                const documentUrl = note.mediaAttachments[0].url;
                // Create a LinkedIn article post
                const postData = {
                    author: `urn:li:person:${(_a = user === null || user === void 0 ? void 0 : user.socialLinks) === null || _a === void 0 ? void 0 : _a.linkedinId}`,
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
                const response = yield axios_1.default.post('https://api.linkedin.com/v2/ugcPosts', postData, {
                    headers: {
                        'Authorization': `Bearer ${yield this.getAccessToken(user)}`,
                        'Content-Type': 'application/json',
                        'X-Restli-Protocol-Version': '2.0.0'
                    }
                });
                return {
                    success: true,
                    shareUrl: response.data.id ? `https://www.linkedin.com/feed/update/${response.data.id}` : undefined
                };
            }
            catch (error) {
                console.error('LinkedIn article sharing error:', error);
                throw new errors_utils_1.AppError('Failed to share article to LinkedIn', 500);
            }
        });
    }
    /**
     * Helper method to get a fresh access token for the user
     */
    //  static async getAccessToken(user: any): Promise<string> {
    //   try {
    //     const isTokenValid = user.socialLinks?.linkedinTokenExpiry &&  new Date(user.socialLinks.linkedinTokenExpiry) > new Date();
    //     if (!isTokenValid) {
    //       // Token is expired or about to expire, try to refresh it
    //       console.log('LinkedIn access token expired or invalid, attempting refresh...');
    //       await LinkedInService.refreshLinkedInToken(user);
    //       // Reload the user to get updated token info
    //       const updatedUser = await User.findById(user._id);
    //       if (!updatedUser) {
    //         throw new AppError('User not found after token refresh', 404);
    //       }
    //       return updatedUser.socialLinks?.linkedinAccessToken || '';
    //     }
    //     // Token is still valid, return it
    //     return user.socialLinks?.linkedinAccessToken;
    //   } catch (error) {
    //     console.error('LinkedIn token retrieval error:', error);
    //     // Handle specific error cases
    //     if (error instanceof AppError && error.message.includes('No LinkedIn refresh token')) {
    //       throw new AppError('LinkedIn session expired. Please reconnect your LinkedIn account.', 401);
    //     }
    //     throw new AppError('Failed to get valid LinkedIn access token', 401);
    //   }
    // }
    // Fix for linkedinsharing.service.ts - getAccessToken method
    static getAccessToken(user) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                // First, verify that user is properly defined
                if (!user || !user._id) {
                    throw new errors_utils_1.AppError('User data missing or invalid', 401);
                }
                // Check if token exists
                if (!((_a = user.socialLinks) === null || _a === void 0 ? void 0 : _a.linkedinAccessToken)) {
                    throw new errors_utils_1.AppError('No LinkedIn access token found', 401);
                }
                const isTokenValid = ((_b = user.socialLinks) === null || _b === void 0 ? void 0 : _b.linkedinTokenExpiry) &&
                    new Date(user.socialLinks.linkedinTokenExpiry) > new Date();
                if (!isTokenValid) {
                    // Token is expired or about to expire, try to refresh it
                    console.log('LinkedIn access token expired or invalid, attempting refresh...');
                    // Check for refresh token before attempting refresh
                    if (!((_c = user.socialLinks) === null || _c === void 0 ? void 0 : _c.linkedinRefreshToken)) {
                        throw new errors_utils_1.AppError('LinkedIn session expired. Please reconnect your LinkedIn account.', 401);
                    }
                    yield linkedin_auth_service_1.LinkedInService.refreshLinkedInToken(user);
                    // Reload the user to get updated token info
                    const updatedUser = yield user_model_1.User.findById(user._id);
                    if (!updatedUser) {
                        throw new errors_utils_1.AppError('User not found after token refresh', 404);
                    }
                    return ((_d = updatedUser.socialLinks) === null || _d === void 0 ? void 0 : _d.linkedinAccessToken) || '';
                }
                // Token is still valid, return it
                return (_e = user.socialLinks) === null || _e === void 0 ? void 0 : _e.linkedinAccessToken;
            }
            catch (error) {
                console.error('LinkedIn token retrieval error:', error);
                // Handle specific error cases
                if (error instanceof errors_utils_1.AppError) {
                    throw error; // Re-throw AppErrors directly
                }
                throw new errors_utils_1.AppError('Failed to get valid LinkedIn access token', 401);
            }
        });
    }
    // Fix for shareImagePost method
    static shareImagePost(note, user) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                // First, verify user data is complete
                if (!user || !user._id) {
                    throw new errors_utils_1.AppError('Invalid user data provided', 400);
                }
                // Get access token with improved error handling
                const accessToken = yield this.getAccessToken(user);
                if (!accessToken) {
                    throw new errors_utils_1.AppError('No LinkedIn access token found', 401);
                }
                // Get the image URL from the note
                if (!note.mediaAttachments || !note.mediaAttachments.length || !note.mediaAttachments[0].url) {
                    throw new errors_utils_1.AppError('No image attachment found in note', 400);
                }
                const imageUrl = note.mediaAttachments[0].url;
                // Step 1: Register the image with LinkedIn
                const registerImageResponse = yield axios_1.default.post('https://api.linkedin.com/v2/assets?action=registerUpload', {
                    registerUploadRequest: {
                        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                        owner: `urn:li:person:${(_a = user === null || user === void 0 ? void 0 : user.socialLinks) === null || _a === void 0 ? void 0 : _a.linkedinId}`,
                        serviceRelationships: [
                            {
                                relationshipType: 'OWNER',
                                identifier: 'urn:li:userGeneratedContent'
                            }
                        ]
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'X-Restli-Protocol-Version': '2.0.0'
                    }
                });
                // Step 2: Upload the image using the upload URL from LinkedIn
                const uploadUrl = registerImageResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
                const asset = registerImageResponse.data.value.asset;
                // Fetch the image data from the URL
                const imageResponse = yield axios_1.default.get(imageUrl, { responseType: 'arraybuffer' });
                const imageBuffer = Buffer.from(imageResponse.data, 'binary');
                // Upload the image to LinkedIn
                yield axios_1.default.put(uploadUrl, imageBuffer, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/octet-stream'
                    }
                });
                // Step 3: Share the post with the uploaded image
                const postData = {
                    author: `urn:li:person:${(_b = user === null || user === void 0 ? void 0 : user.socialLinks) === null || _b === void 0 ? void 0 : _b.linkedinId}`,
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
                const response = yield axios_1.default.post('https://api.linkedin.com/v2/ugcPosts', postData, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'X-Restli-Protocol-Version': '2.0.0'
                    }
                });
                return {
                    success: true,
                    shareUrl: response.data.id ? `https://www.linkedin.com/feed/update/${response.data.id}` : undefined
                };
            }
            catch (error) {
                console.error('LinkedIn image sharing error:', error);
                // More specific error handling
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                else if (axios_1.default.isAxiosError(error)) {
                    const statusCode = ((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) || 500;
                    const message = ((_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) || 'LinkedIn API error';
                    throw new errors_utils_1.AppError(`LinkedIn API error: ${message}`, statusCode);
                }
                throw new errors_utils_1.AppError('Failed to share image post to LinkedIn', 500);
            }
        });
    }
}
exports.LinkedInSharingService = LinkedInSharingService;
exports.linkedInSharingService = new LinkedInSharingService();
