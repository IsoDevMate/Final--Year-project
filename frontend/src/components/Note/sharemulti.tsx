import React, { useState } from 'react';
import { Share2, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog';


interface MediaAttachment {
  _id: string;
  type: 'image' | 'audio' | 'video' | 'document';
  url: string;
  fileName: string;
  fileSize: number;
  caption?: string;
  createdAt: string;
  storageRef?: string;
  file?: File;
  preview?: string;
}

interface User {
  id: string;
  role: string;
  userId: string;
  email: string;
  name: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  bio?: string;
  socialLinks?: {
    linkedinId?: string;
    linkedinAccessToken?: string;
  };
}

interface MultimediaShareModalProps {
  attachment: MediaAttachment;
  onShare: (customMessage?: string) => Promise<any>;
  noteMetadata?: {
    title?: string;
    content?: string;
    event?: string;
    session?: string;
  };
}

export const MultimediaShareModa: React.FC<MultimediaShareModalProps> = ({
  attachment,
  onShare,
  noteMetadata
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!attachment) {
      toast.error('No attachment to share');
      return;
    }

    setIsSharing(true);

    try {
      await onShare(customMessage);
      toast.success('Successfully shared to LinkedIn!');
      setCustomMessage('');
    } catch (error) {
      console.error('Sharing error:', error);
      toast.error('Failed to share to LinkedIn');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          <Share2 className="mr-2 h-4 w-4" /> Share to LinkedIn
        </button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <DialogTitle className="text-xl font-semibold mb-4">
          Share to LinkedIn
        </DialogTitle>

        {/* Preview and Custom Message */}
        <div className="space-y-4">
          <div className="relative">
            {attachment.type === 'image' && (
              <img
                src={attachment.url}
                alt="Preview"
                className="w-full h-64 object-cover rounded-md"
              />
            )}
            {attachment.type === 'video' && (
              <video
                src={attachment.url}
                controls
                className="w-full h-64 rounded-md"
              />
            )}
            {attachment.type === 'document' && (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-md">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <svg className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">{attachment.fileName}</span>
                </div>
              </div>
            )}
          </div>

          <textarea
            placeholder="Add a custom message to your LinkedIn post..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full min-h-[100px] border rounded-md p-2"
          />
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          disabled={isSharing}
          className={`w-full mt-4 py-2 rounded-md flex items-center justify-center ${
            isSharing
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
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
