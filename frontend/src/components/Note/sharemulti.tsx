import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog';
import { toast } from 'react-hot-toast';

interface MultimediaShareModalProps {
  attachment: {
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
  };
  onShare: (customMessage?: string) => Promise<void>;
}

const MultimediaShareModal: React.FC<MultimediaShareModalProps> = ({ attachment, onShare }) => {
  const [customMessage, setCustomMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await onShare(customMessage);
      toast.success('Successfully shared to LinkedIn');
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
              <button
                  type="button"
                  className="text-linkedin hover:bg-linkedin/10"
                    title="Share to LinkedIn"
                  >
          <Share2 className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <div className="dialog-header">
          <DialogTitle>Share to LinkedIn</DialogTitle>
        </div>

        <div className="flex flex-col space-y-4">
          {/* Preview of attachment */}
          {attachment.type === 'image' && (
            <img
              src={attachment.url}
              alt="Attachment preview"
              className="max-h-64 object-contain mx-auto"
            />
          )}

          {/* Custom message input */}
          <textarea
            placeholder={`Add a message to your ${attachment.type} share...`}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
          />

          {/* Share button */}
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full"
          >
            {isSharing ? 'Sharing...' : 'Share to LinkedIn'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MultimediaShareModal;
