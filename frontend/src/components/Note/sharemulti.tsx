// import React, { useState } from 'react';
// import { Share2 } from 'lucide-react';
// import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog';
// import { toast } from 'react-hot-toast';

// interface MultimediaShareModalProps {
//   attachment: {
//     type: 'image' | 'video' | 'audio' | 'document';
//     url: string;
//   };
//   onShare: (customMessage?: string) => Promise<void>;
// }

// const MultimediaShareModal: React.FC<MultimediaShareModalProps> = ({ attachment, onShare }) => {
//   const [customMessage, setCustomMessage] = useState('');
//   const [isSharing, setIsSharing] = useState(false);

//   const handleShare = async () => {
//     setIsSharing(true);
//     try {
//       await onShare(customMessage);
//       toast.success('Successfully shared to LinkedIn');
//       setCustomMessage('');
//     } catch (error) {
//       console.error('Sharing error:', error);
//       toast.error('Failed to share to LinkedIn');
//     } finally {
//       setIsSharing(false);
//     }
//   };

//   return (
//     <Dialog>
//       <DialogTrigger asChild>
//               <button
//                   type="button"
//                   className="text-linkedin hover:bg-linkedin/10"
//                     title="Share to LinkedIn"
//                   >
//           <Share2 className="h-4 w-4" />
//         </button>
//       </DialogTrigger>
//       <DialogContent>
//         <div className="dialog-header">
//           <DialogTitle>Share to LinkedIn</DialogTitle>
//         </div>

//         <div className="flex flex-col space-y-4">
//           {/* Preview of attachment */}
//           {attachment.type === 'image' && (
//             <img
//               src={attachment.url}
//               alt="Attachment preview"
//               className="max-h-64 object-contain mx-auto"
//             />
//           )}

//           {/* Custom message input */}
//           <textarea
//             placeholder={`Add a message to your ${attachment.type} share...`}
//             value={customMessage}
//             onChange={(e) => setCustomMessage(e.target.value)}
//           />

//           {/* Share button */}
//           <button
//             onClick={handleShare}
//             disabled={isSharing}
//             className="w-full"
//           >
//             {isSharing ? 'Sharing...' : 'Share to LinkedIn'}
//           </button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default MultimediaShareModal;


import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  Image,
  Video,
  File,
  X,
  Share2,
  Upload
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog';

interface MediaAttachment {
  type: 'image' | 'video' | 'document';
  url: string;
  file: File;
  preview: string;
}

const MultimediaShareModa: React.FC = () => {
  const [attachment, setAttachment] = useState<MediaAttachment | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (type: 'image' | 'video' | 'document' | 'audio') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image'
        ? 'image/*'
        : type === 'video'
        ? 'video/*'
        : '.pdf,.doc,.docx,.txt';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment({
        type: file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
          ? 'video'
          : 'document',
        url: reader.result as string,
        file,
        preview: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleShare = async () => {
    if (!attachment) {
      toast.error('Please select a file to share');
      return;
    }

    setIsSharing(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', attachment.file);

      // First, upload the file
      const uploadResponse = await axios.post('/api/v1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      // Then share to LinkedIn
      const shareResponse = await axios.post('/api/v1/linkedin/share/image', {
        note: {
          title: customMessage || 'My LinkedIn Share',
          content: customMessage,
          mediaAttachments: [{
            type: attachment.type,
            url: uploadResponse.data.fileUrl,
            caption: customMessage
          }]
        }
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      // Success handling
      toast.success('Successfully shared to LinkedIn!');

      // Reset state
      setAttachment(null);
      setCustomMessage('');
    } catch (error) {
      console.error('Sharing error:', error);
      toast.error('Failed to share to LinkedIn');
    } finally {
      setIsSharing(false);
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center bg-linkedin text-white px-4 py-2 rounded-md hover:bg-linkedin/90">
          <Share2 className="mr-2 h-4 w-4" /> Share to LinkedIn
        </button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <DialogTitle className="text-xl font-semibold mb-4">
          Share to LinkedIn
        </DialogTitle>

        {/* File Input (Hidden) */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* File Selection Buttons */}
        {!attachment && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => handleFileSelect('image')}
              className="flex flex-col items-center p-3 border rounded-md hover:bg-gray-50"
            >
              <Image className="h-6 w-6 text-blue-500 mb-2" />
              <span className="text-xs">Image</span>
            </button>
            <button
              onClick={() => handleFileSelect('video')}
              className="flex flex-col items-center p-3 border rounded-md hover:bg-gray-50"
            >
              <Video className="h-6 w-6 text-red-500 mb-2" />
              <span className="text-xs">Video</span>
            </button>
            <button
              onClick={() => handleFileSelect('document')}
              className="flex flex-col items-center p-3 border rounded-md hover:bg-gray-50"
            >
              <File className="h-6 w-6 text-green-500 mb-2" />
              <span className="text-xs">Document</span>
            </button>
          </div>
        )}

        {/* Preview and Custom Message */}
        {attachment && (
          <div className="space-y-4">
            <div className="relative">
              {attachment.type === 'image' && (
                <img
                  src={attachment.preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-md"
                />
              )}
              {attachment.type === 'video' && (
                <video
                  src={attachment.preview}
                  controls
                  className="w-full h-64 rounded-md"
                />
              )}
              <button
                onClick={clearAttachment}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              placeholder="Add a custom message to your LinkedIn post..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full min-h-[100px] border rounded-md p-2"
            />
          </div>
        )}

        {/* Share Button */}
        <button
          onClick={handleShare}
          disabled={!attachment || isSharing}
          className={`w-full mt-4 py-2 rounded-md flex items-center justify-center ${
            !attachment || isSharing
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-linkedin text-white hover:bg-linkedin/90'
          }`}
        >
          {isSharing ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-pulse" />
              Sharing...
            </>
          ) : (
            'Share to LinkedIn'
          )}
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default MultimediaShareModa;
