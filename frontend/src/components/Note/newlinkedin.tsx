import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

import {
  Dialog,
  DialogContent,
  // DialogHeader,
  DialogTitle,
  DialogDescription
} from '@radix-ui/react-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@radix-ui/react-select';

interface MediaAttachment {
  type: 'image' | 'video' | 'document' | 'audio';
  url: string;
  caption?: string;
}

interface LinkedInShareProps {
  note: {
    id?: string;
    title: string;
    content: string;
    mediaAttachments?: MediaAttachment[];
  };
}

export const LinkedInShareComponent: React.FC<LinkedInShareProps> = ({ note }) => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'video' | 'article'>('text');
  const [customMessage, setCustomMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<{ success: boolean; shareUrl?: string } | null>(null);

  // Check LinkedIn connection status before sharing
  const checkLinkedInStatus = async () => {
    try {
      const response = await axios.get('/api/v1/linkedin/status', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return response.data.data;
    } catch (error) {
      console.error('LinkedIn status check failed', error);
      return null;
    }
  };

  // Determine share route based on media type
  const getShareRoute = () => {
    switch (mediaType) {
      case 'image': return 'https://final-year-project-56d5.onrender.com/api/v1/linkedin/share/image';
      case 'video': return 'https://final-year-project-56d5.onrender.com/api/v1/linkedin/share/video';
      case 'article': return 'https://final-year-project-56d5.onrender.com/api/v1/linkedin/share/article';
      default: return 'https://final-year-project-56d5.onrender.com/api/v1/linkedin/share/text';
    }
  };

  const handleShare = async () => {
    // Validate authentication and LinkedIn connection
    if (!isAuthenticated) {
      alert('Please log in first');
      return;
    }

    const linkedInStatus = await checkLinkedInStatus();
    if (!linkedInStatus?.hasLinkedIn) {
      alert('Please connect your LinkedIn account first');
      return;
    }

    setIsSharing(true);
    try {
      // Prepare note data for sharing
      const shareData = {
        note: {
          ...note,
          content: customMessage || note.content
        },
        user
      };

      // Make API call to share
      const response = await axios.post(getShareRoute(), shareData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });

      setShareResult(response.data.data);
      setIsOpen(false);
    } catch (error) {
      console.error('Sharing failed', error);
      alert('Failed to share on LinkedIn');
    } finally {
      setIsSharing(false);
    }
  };

  // Determine available media types based on note's media attachments
  const getAvailableMediaTypes = () => {
    const types = ['text'];
    if (note.mediaAttachments && note.mediaAttachments.length > 0) {
      const mediaType = note.mediaAttachments[0].type;
      if (mediaType === 'image') types.push('image');
      if (mediaType === 'video') types.push('video');
      if (mediaType === 'document') types.push('article');
    }
    return types;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={!isAuthenticated}
      >
        Share on LinkedIn
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <div>
            <DialogTitle>Share on LinkedIn</DialogTitle>
            <DialogDescription>
              Choose how you want to share your content
            </DialogDescription>
          </div>

          {/* Media Type Selection */}
          <div className="space-y-4">
            <Select
              value={mediaType}
              onValueChange={(value) => setMediaType(value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select share type" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableMediaTypes().map(type => (
                  <SelectItem key={type} value={type}>
                    Share as {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Custom Message Input */}
            <textarea
              className="min-h-[100px] p-2 border rounded"
              placeholder="Add a custom message (optional)"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />

            {/* Share button */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full"
            >
              {isSharing ? 'Sharing...' : 'Share'}
            </button>

            {/* Share Result */}
            {shareResult?.success && (
              <div className="text-green-600">
                Successfully shared!
                {shareResult.shareUrl && (
                  <a
                    href={shareResult.shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 underline"
                  >
                    View Post
                  </a>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LinkedInShareComponent;
