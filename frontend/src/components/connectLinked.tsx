import React, { useState } from 'react';
import { Linkedin, LinkIcon, Check, X } from 'lucide-react';

interface LinkedInConnectionProps {
  user: any;
  API_BASE_URL: string;
  onUpdate?: () => void;
}

const LinkedInConnection: React.FC<LinkedInConnectionProps> = ({ user, API_BASE_URL, onUpdate }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isLinkedInConnected = user?.socialLinks?.linkedinAccessToken;

  const connectLinkedIn = async () => {
    try {
      setIsConnecting(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/linkedin`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get LinkedIn authorization URL');
      }

      const data = await response.json();
      window.location.href = data.data.url;
    } catch (error) {
      console.error('LinkedIn connection error:', error);
      alert('Failed to connect LinkedIn account. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectLinkedIn = async () => {
    if (!confirm('Are you sure you want to disconnect your LinkedIn account?')) {
      return;
    }

    try {
      setIsDisconnecting(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/linkedin/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect LinkedIn account');
      }

      // Update the UI to show disconnected state
      if (onUpdate) {
        onUpdate();
      } else {
        // Fallback if no update callback provided
        window.location.reload();
      }
    } catch (error) {
      console.error('LinkedIn disconnection error:', error);
      alert('Failed to disconnect LinkedIn account. Please try again.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <Linkedin className="h-5 w-5 mr-2" /> LinkedIn Connection
        </h2>

        {isLinkedInConnected && (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <Check className="h-3 w-3 mr-1" /> Connected
          </span>
        )}
      </div>

      {isLinkedInConnected ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Your LinkedIn account is connected. You can share notes directly to your LinkedIn profile.
          </p>
          <button
            onClick={disconnectLinkedIn}
            disabled={isDisconnecting}
            className="flex items-center justify-center w-full px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
          >
            {isDisconnecting ? (
              <>
                <span className="inline-block h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></span>
                Disconnecting...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" /> Disconnect LinkedIn
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your LinkedIn account to share notes directly to your LinkedIn profile.
          </p>
          <button
            onClick={connectLinkedIn}
            disabled={isConnecting}
            className="flex items-center justify-center w-full px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
          >
            {isConnecting ? (
              <>
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Connecting...
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4 mr-2" /> Connect LinkedIn
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default LinkedInConnection;
