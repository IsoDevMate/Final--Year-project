import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger,  } from '@radix-ui/react-dialog';

interface Note {
  title: string;
  content: string;
}

interface LinkedInShareModalProps {
  note: Note;
  onShare: (customMessage?: string) => Promise<void>;
}

const LinkedInShareModal: React.FC<LinkedInShareModalProps> = ({ note, onShare }) => {
  const [customMessage, setCustomMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await onShare(customMessage);
    } catch (error) {
      console.error('LinkedIn sharing error:', error);
      alert('Failed to share to LinkedIn');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center">
          <Share2 className="mr-2 h-4 w-4" /> Share on LinkedIn
        </button>
          </DialogTrigger>
        <DialogContent className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
          <DialogTitle>Share Note on LinkedIn</DialogTitle>
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">{note.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-3">
              {note.content.substring(0, 200)}
              {note.content.length > 200 ? '...' : ''}
            </p>
          </div>
          <textarea
            placeholder="Add a custom message to your LinkedIn post (optional)"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="min-h-[100px]"
          />
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

export default LinkedInShareModal;
