import React from 'react';
import {
  Image,
  File,
  Mic,
  Video,
  X,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MultimediaShareModa } from './sharemulti';

interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  event: {
    _id: string;
    title: string;
  };
  session?: {
    _id: string;
    title: string;
  };
  mediaAttachments: MediaAttachment[];
  sharedWith?: string[];
}

interface MediaAttachment {
  _id: string;
  type: 'image' | 'audio' | 'video' | 'document';
  url: string;
  fileName: string;
  fileSize: number;
  caption?: string;
  createdAt: string;
  storageRef?: string;
}

export const MediaAttachmentHandler = {
  // File upload handler
  handleFileUpload: async (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: 'image' | 'audio' | 'video' | 'document',
    noteId: string,
    API_BASE_URL: string,
    setNote: React.Dispatch<React.SetStateAction<Note | null>>,
    navigate: (path: string) => void
  ) => {
    const file = event.target.files?.[0];

    if (!file || !noteId) {
      toast.error('Cannot upload file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);

    const token = localStorage.getItem('accessToken');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/notes/${noteId}/media`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status !== 200) {
        if (response.status === 401) {
          navigate('/auth/login');
          return;
        }
        throw new Error('Failed to upload file');
      }

      setNote(response.data.data);
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  },

  // Handle delete attachment - FIXED URL FORMAT
  handleDeleteAttachment: async (
    attachmentId: string,
    noteId: string,
    API_BASE_URL: string,
    setNote: React.Dispatch<React.SetStateAction<Note | null>>,
    navigate: (path: string) => void
  ) => {
    const token = localStorage.getItem('accessToken');

    try {
      // Fixed URL format - removed colons before params
      const response = await axios.delete(`${API_BASE_URL}/api/v1/notes/${noteId}/media/${attachmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status !== 200) {
        if (response.status === 401) {
          navigate('/auth/login');
          return;
        }
        throw new Error('Failed to delete file');
      }

      setNote(response.data.data);
      toast.success('File deleted successfully!');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  },

  // Media upload buttons component
  MediaUploadButtons: React.memo(({
    noteId,
    API_BASE_URL,
    setNote,
    navigate
  }: {
    noteId: string | undefined,
    API_BASE_URL: string,
    setNote: React.Dispatch<React.SetStateAction<Note | null>>,
    navigate: (path: string) => void
  }) => {
    const uploadTypes = [
      { type: 'image', accept: 'image/*', icon: Image, label: 'Image' },
      { type: 'document', accept: '.pdf,.doc,.docx,.txt', icon: File, label: 'Document' },
      { type: 'audio', accept: 'audio/*', icon: Mic, label: 'Audio' },
      { type: 'video', accept: 'video/*', icon: Video, label: 'Video' }
    ] as const;

    return (
      <div className="grid grid-cols-2 gap-2 mb-4">
        {uploadTypes.map(({ type, accept, icon: Icon, label }) => (
          <label
            key={type}
            className="flex flex-col items-center justify-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
          >
            <Icon className="h-5 w-5 mb-1 text-indigo-600" />
            <span className="text-xs text-gray-500">{label}</span>
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => noteId &&
                MediaAttachmentHandler.handleFileUpload(
                  e,
                  type,
                  noteId,
                  API_BASE_URL,
                  setNote,
                  navigate
                )
              }
            />
          </label>
        ))}
      </div>
    );
  }),

  // Attachments list component - ADDED DEBUG LOGGING
  AttachmentsList: React.memo(({
    note,
    openMediaPreview
  }: {
    note: Note | null,
    openMediaPreview: (attachment: MediaAttachment) => void
  }) => {
    if (!note?.mediaAttachments?.length) return null;

    const iconMap = {
      image: Image,
      document: File,
      audio: Mic,
      video: Video
    };

    const colorMap = {
      image: 'text-blue-500',
      document: 'text-green-500',
      audio: 'text-purple-500',
      video: 'text-red-500'
    };

    return (
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files</h4>
        {note.mediaAttachments.map((attachment) => {
          console.log('Attachment data:', attachment); // Debug logging
          const Icon = iconMap[attachment.type];
          const color = colorMap[attachment.type];

          return (
            <div
              key={attachment._id}
              className="flex items-center justify-between mb-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50"
              onClick={() => openMediaPreview(attachment)}
            >
              <div className="flex items-center space-x-2">
                <Icon className={`h-5 w-5 ${color}`} />
                <span className="text-sm text-black">
                  {attachment.fileName || 'Unnamed file'} {/* Fallback if fileName is missing */}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }),

  // MediaPreviewModal component - IMPROVED ERROR HANDLING
  // MediaPreviewModal: React.memo(({
  //   selectedAttachment,
  //   showMediaPreview,
  //   setShowMediaPreview,
  //   note,
  //   handleDeleteAttachment
  // }: {
  //   selectedAttachment: MediaAttachment | null,
  //   showMediaPreview: boolean,
  //   setShowMediaPreview: (show: boolean) => void,
  //   note: Note | null,
  //   handleDeleteAttachment: (attachmentId: string) => Promise<void>
  // }) => {
  //   if (!showMediaPreview || !selectedAttachment) return null;

  //   // In the handleShareAttachment function in MediaPreviewModal
  //   const handleShareAttachment = async (customMessage = '') => {
  //     if (!note || !selectedAttachment) return;

  //     // Get token from localStorage directly instead of user object
  //     const token = localStorage.getItem('accessToken');
  //     if (!token) {
  //       toast.error('Authentication token missing');
  //       return;
  //     }

  //     // Get LinkedIn token from user object
  //     const userFromStorage = localStorage.getItem('user');
  //     if (!userFromStorage) {
  //       toast.error('User information not found');
  //       return;
  //     }

  //     const parsedUser = JSON.parse(userFromStorage);
  //     const linkedInToken = parsedUser?.socialLinks?.linkedinAccessToken;

  //     if (!linkedInToken) {
  //       toast.error('LinkedIn not connected. Please connect your LinkedIn account first.');
  //       return;
  //     }

  //     const API_BASE_URL = "https://final-year-project-56d5.onrender.com";

  //     try {
  //       // Use your API endpoint but with proper error handling
  //       const sharingEndpoint = (() => {
  //         switch (selectedAttachment.type) {
  //           case 'image': return `${API_BASE_URL}/api/v1/linkedin/share/image`;
  //           case 'video': return `${API_BASE_URL}/api/v1/linkedin/share/video`;
  //           case 'document': return `${API_BASE_URL}/api/v1/linkedin/share/article`;
  //           default: return `${API_BASE_URL}/api/v1/linkedin/share/content`;
  //         }
  //       })();

  //       const payload = {
  //         note: {
  //           title: note.title,
  //           content: customMessage || `Check out this ${selectedAttachment.type}`,
  //           mediaAttachments: [
  //             {
  //               type: selectedAttachment.type,
  //               url: selectedAttachment.url,
  //               caption: customMessage || selectedAttachment.caption || note.title
  //             }
  //           ]
  //         },
  //         user: {
  //           socialLinks: {
  //             linkedinAccessToken: linkedInToken,
  //             linkedinId: parsedUser.socialLinks?.linkedinId
  //           }
  //         }
  //       };

  //       const response = await axios.post(sharingEndpoint, payload, {
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json'
  //         }
  //       });

  //       if (response.status >= 200 && response.status < 300) {
  //         toast.success('Successfully shared to LinkedIn!');
  //         return response.data;
  //       } else {
  //         throw new Error('Failed to share');
  //       }
  //     } catch (error) {
  //       console.error('Error sharing to LinkedIn:', error);
  //       // Don't automatically logout on error
  //       if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
  //         toast.error('Your session has expired. Please login again.');
  //         // Only logout if absolutely necessary
  //         // navigate('/auth/login');
  //       } else {
  //         toast.error('Failed to share to LinkedIn');
  //       }
  //       throw error;
  //     }
  //   };

  //   // Improved deletion handler with validation
  //   const handleDeleteClick = () => {
  //     if (selectedAttachment && selectedAttachment._id && note && note._id) {
  //       handleDeleteAttachment(selectedAttachment._id);
  //     } else {
  //       toast.error('Cannot delete: Missing attachment or note ID');
  //       console.error('Delete error - IDs:', {
  //         attachmentId: selectedAttachment?._id,
  //         noteId: note?._id
  //       });
  //     }
  //   };

  //   return (
  //     <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-70 flex items-center justify-center p-4">
  //       <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
  //         <div className="p-4 border-b flex justify-between items-center">
  //           <h3 className="text-lg font-medium">{selectedAttachment.fileName || 'Unnamed file'}</h3>
  //           <div className="flex items-center space-x-2">
  //             <MultimediaShareModa
  //               attachment={selectedAttachment}
  //               onShare={(customMessage) => handleShareAttachment(customMessage)}
  //             />
  //             <button
  //               onClick={handleDeleteClick}
  //               className="text-red-500 hover:text-red-700"
  //             >
  //               <Trash2 className="h-5 w-5" />
  //             </button>
  //             <button
  //               onClick={() => setShowMediaPreview(false)}
  //               className="text-gray-500 hover:text-gray-700"
  //             >
  //               <X className="h-6 w-6" />
  //             </button>
  //           </div>
  //         </div>

  //         <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
  //           {selectedAttachment.type === 'image' && (
  //             <img
  //               src={selectedAttachment.url}
  //               alt={selectedAttachment.fileName || 'Image file'}
  //               className="max-w-full max-h-[70vh] object-contain"
  //               onError={(e) => {
  //                 e.currentTarget.src = '/path/to/fallback/image.png';
  //               }}
  //             />
  //           )}
  //           {selectedAttachment.type === 'audio' && (
  //             <audio controls className="w-full">
  //               <source src={selectedAttachment.url} />
  //               Your browser does not support the audio element.
  //             </audio>
  //           )}
  //           {selectedAttachment.type === 'video' && (
  //             <video controls className="max-w-full max-h-[70vh]">
  //               <source src={selectedAttachment.url} />
  //               Your browser does not support the video element.
  //             </video>
  //           )}
  //           {selectedAttachment.type === 'document' && (
  //             <iframe
  //               src={selectedAttachment.url}
  //               width="100%"
  //               height="600px"
  //               className="border-none"
  //             >
  //               Document preview not available
  //             </iframe>
  //           )}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // })

  MediaPreviewModal: React.memo(({
    selectedAttachment,
    showMediaPreview,
    setShowMediaPreview,
    note,
    handleDeleteAttachment
  }: {
    selectedAttachment: MediaAttachment | null,
    showMediaPreview: boolean,
    setShowMediaPreview: (show: boolean) => void,
    note: Note | null,
    handleDeleteAttachment: (attachmentId: string) => Promise<void>
  }) => {
    if (!showMediaPreview || !selectedAttachment) return null;

    // In the handleShareAttachment function in MediaPreviewModal
    const handleShareAttachment = async (customMessage = '') => {
      if (!note || !selectedAttachment) return;

      // Get token from localStorage directly instead of user object
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Authentication token missing');
        return;
      }

      // Get LinkedIn token from user object
      const userFromStorage = localStorage.getItem('user');
      if (!userFromStorage) {
        toast.error('User information not found');
        return;
      }

      const parsedUser = JSON.parse(userFromStorage);
      const linkedInToken = parsedUser?.socialLinks?.linkedinAccessToken;

      if (!linkedInToken) {
        toast.error('LinkedIn not connected. Please connect your LinkedIn account first.');
        return;
      }

      const API_BASE_URL = "https://final-year-project-56d5.onrender.com";

      try {
        // Use your API endpoint but with proper error handling
        const sharingEndpoint = (() => {
          switch (selectedAttachment.type) {
            case 'image': return `${API_BASE_URL}/api/v1/linkedin/share/image`;
            case 'video': return `${API_BASE_URL}/api/v1/linkedin/share/video`;
            case 'document': return `${API_BASE_URL}/api/v1/linkedin/share/article`;
            default: return `${API_BASE_URL}/api/v1/linkedin/share/content`;
          }
        })();

        const payload = {
          note: {
            title: note.title,
            content: customMessage || `Check out this ${selectedAttachment.type}`,
            mediaAttachments: [
              {
                type: selectedAttachment.type,
                url: selectedAttachment.url,
                caption: customMessage || selectedAttachment.caption || note.title
              }
            ]
          },
          user: {
            socialLinks: {
              linkedinAccessToken: linkedInToken,
              linkedinId: parsedUser.socialLinks?.linkedinId
            }
          }
        };

        const response = await axios.post(sharingEndpoint, payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status >= 200 && response.status < 300) {
          toast.success('Successfully shared to LinkedIn!');
          // Close the modal after successful sharing
          setShowMediaPreview(false);
          return response.data;
        } else {
          throw new Error('Failed to share');
        }
      } catch (error) {
        console.error('Error sharing to LinkedIn:', error);
        // Don't automatically logout on error
        if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
          toast.error('Your session has expired. Please login again.');
          // Only logout if absolutely necessary
          // navigate('/auth/login');
        } else {
          toast.error('Failed to share to LinkedIn');
        }
        throw error;
      }
    };

    // Improved deletion handler with validation
    const handleDeleteClick = () => {
      if (selectedAttachment && selectedAttachment._id && note && note._id) {
        handleDeleteAttachment(selectedAttachment._id);
      } else {
        toast.error('Cannot delete: Missing attachment or note ID');
        console.error('Delete error - IDs:', {
          attachmentId: selectedAttachment?._id,
          noteId: note?._id
        });
      }
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-800 bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium">{selectedAttachment.fileName || 'Unnamed file'}</h3>
            <div className="flex items-center space-x-2">
              <MultimediaShareModa
                attachment={selectedAttachment}
                onShare={(customMessage) => handleShareAttachment(customMessage)}
              />
              <button
                onClick={handleDeleteClick}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowMediaPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
            {selectedAttachment.type === 'image' && (
              <img
                src={selectedAttachment.url}
                alt={selectedAttachment.fileName || 'Image file'}
                className="max-w-full max-h-[70vh] object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/path/to/fallback/image.png';
                }}
              />
            )}
            {selectedAttachment.type === 'audio' && (
              <audio controls className="w-full">
                <source src={selectedAttachment.url} />
                Your browser does not support the audio element.
              </audio>
            )}
            {selectedAttachment.type === 'video' && (
              <video controls className="max-w-full max-h-[70vh]">
                <source src={selectedAttachment.url} />
                Your browser does not support the video element.
              </video>
            )}
            {selectedAttachment.type === 'document' && (
              <iframe
                src={selectedAttachment.url}
                width="100%"
                height="600px"
                className="border-none"
              >
                Document preview not available
              </iframe>
            )}
          </div>
        </div>
      </div>
    );
  })
  
}
