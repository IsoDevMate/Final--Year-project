import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface LinkedInShareButtonProps {
  noteId: string;
}

const LinkedInShareButton: React.FC<LinkedInShareButtonProps> = ({ noteId }) => {
  const [canShare, setCanShare] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<{ success: boolean; message: string } | null>(null);

  // Check if user has LinkedIn sharing capability
  useEffect(() => {
    const checkLinkedInStatus = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/linkedin/status`);
        setCanShare(response.data.data.hasLinkedIn);
      } catch (error) {
        console.error('Failed to check LinkedIn status:', error);
        setCanShare(false);
      }
    };

    checkLinkedInStatus();
  }, []);

  const handleShare = async () => {
    setIsSharing(true);
    setShareResult(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/linkedin/share/note/${noteId}`);

      setShareResult({
        success: true,
        message: 'Successfully shared to LinkedIn!'
      });

      // If there's a share URL, open it in a new tab
        if (response.data.data.shareUrl) {
            window.open(response.data.data.shareUrl, '_blank');
            }
        } catch (error) {
            console.error('Failed to share to LinkedIn:', error);
            setShareResult({
                success: false,
                message: 'Failed to share to LinkedIn.'
            });
        }
        setIsSharing(false);
    }
    return (
        <div>
            {canShare ? (
                <button onClick={handleShare} disabled={isSharing}>
                    {isSharing ? 'Sharing...' : 'Share to LinkedIn'}
                </button>
            ) : (
                <p>You need to connect your LinkedIn account to share.</p>
            )}
            {shareResult && (
                <p style={{ color: shareResult.success ? 'green' : 'red' }}>
                    {shareResult.message}
                </p>
            )}
        </div>
    );
}
export default LinkedInShareButton;
