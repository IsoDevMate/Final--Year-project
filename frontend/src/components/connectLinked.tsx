// import React, { useState } from 'react';
// import { Linkedin, LinkIcon, Check, X } from 'lucide-react';

// interface LinkedInConnectionProps {
//   user: any;
//   API_BASE_URL: string;
//   onUpdate?: () => void;
// }

// const LinkedInConnection: React.FC<LinkedInConnectionProps> = ({ user, API_BASE_URL, onUpdate }) => {
//   const [isConnecting, setIsConnecting] = useState(false);
//   const [isDisconnecting, setIsDisconnecting] = useState(false);

//   const isLinkedInConnected = user?.socialLinks?.linkedinAccessToken;

//   const connectLinkedIn = async () => {
//     try {
//       setIsConnecting(true);
//       const response = await fetch(`${API_BASE_URL}/api/v1/auth/linkedin`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         throw new Error('Failed to get LinkedIn authorization URL');
//       }

//       const data = await response.json();
//       window.location.href = data.data.url;
//     } catch (error) {
//       console.error('LinkedIn connection error:', error);
//       alert('Failed to connect LinkedIn account. Please try again.');
//     } finally {
//       setIsConnecting(false);
//     }
//   };

//   const disconnectLinkedIn = async () => {
//     if (!confirm('Are you sure you want to disconnect your LinkedIn account?')) {
//       return;
//     }

//     try {
//       setIsDisconnecting(true);
//       const response = await fetch(`${API_BASE_URL}/api/v1/linkedin/disconnect`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         throw new Error('Failed to disconnect LinkedIn account');
//       }

//       // Update the UI to show disconnected state
//       if (onUpdate) {
//         onUpdate();
//       } else {
//         // Fallback if no update callback provided
//         window.location.reload();
//       }
//     } catch (error) {
//       console.error('LinkedIn disconnection error:', error);
//       alert('Failed to disconnect LinkedIn account. Please try again.');
//     } finally {
//       setIsDisconnecting(false);
//     }
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-sm p-6">
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-lg font-medium text-gray-900 flex items-center">
//           <Linkedin className="h-5 w-5 mr-2" /> LinkedIn Connection
//         </h2>

//         {isLinkedInConnected && (
//           <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
//             <Check className="h-3 w-3 mr-1" /> Connected
//           </span>
//         )}
//       </div>

//       {isLinkedInConnected ? (
//         <div className="space-y-4">
//           <p className="text-sm text-gray-600">
//             Your LinkedIn account is connected. You can share notes directly to your LinkedIn profile.
//           </p>
//           <button
//             onClick={disconnectLinkedIn}
//             disabled={isDisconnecting}
//             className="flex items-center justify-center w-full px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
//           >
//             {isDisconnecting ? (
//               <>
//                 <span className="inline-block h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></span>
//                 Disconnecting...
//               </>
//             ) : (
//               <>
//                 <X className="h-4 w-4 mr-2" /> Disconnect LinkedIn
//               </>
//             )}
//           </button>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           <p className="text-sm text-gray-600">
//             Connect your LinkedIn account to share notes directly to your LinkedIn profile.
//           </p>
//           <button
//             onClick={connectLinkedIn}
//             disabled={isConnecting}
//             className="flex items-center justify-center w-full px-4 py-2 bg-tiffany-500 text-white rounded-md hover:bg-tiffany-600"
//           >
//             {isConnecting ? (
//               <>
//                 <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
//                 Connecting...
//               </>
//             ) : (
//               <>
//                 <LinkIcon className="h-4 w-4 mr-2" /> Connect LinkedIn
//               </>
//             )}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default LinkedInConnection;


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LinkIcon, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LinkedInConnectionProps {
  API_BASE_URL: string;
  onConnectionChange?: (isConnected: boolean) => void;
}

const LinkedInConnection: React.FC<LinkedInConnectionProps> = ({ API_BASE_URL, onConnectionChange }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check LinkedIn connection status on component mount
  useEffect(() => {
    checkLinkedInStatus();
  }, []);

  const checkLinkedInStatus = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');

      const response = await axios.get(`${API_BASE_URL}/api/v1/linkedin/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data?.data?.hasLinkedIn) {
        setIsConnected(true);

        // Call onConnectionChange callback if provided
        if (onConnectionChange) {
          onConnectionChange(true);
        }
      } else {
        setIsConnected(false);

        // Call onConnectionChange callback if provided
        if (onConnectionChange) {
          onConnectionChange(false);
        }
      }
    } catch (error) {
      console.error('Error checking LinkedIn status:', error);
      setIsConnected(false);
      if (onConnectionChange) {
        onConnectionChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const connectLinkedIn = async () => {
    try {
      setIsConnecting(true);
      // Request LinkedIn authorization URL from your backend
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/api/v1/auth/linkedin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status !== 200) {
        throw new Error('Failed to get LinkedIn authorization URL');
      }

      // Redirect to LinkedIn authorization page
      window.location.href = response.data.data.url;
    } catch (error) {
      console.error('LinkedIn connection error:', error);
      toast.error('Failed to connect to LinkedIn');
      setIsConnecting(false);
    }
  };

  const disconnectLinkedIn = async () => {
    try {
      setIsDisconnecting(true);
      const token = localStorage.getItem('accessToken');

      const response = await axios.post(`${API_BASE_URL}/api/v1/linkedin/disconnect`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setIsConnected(false);
        toast.success('LinkedIn account disconnected successfully');

        // Update local storage user data if needed
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          if (user.socialLinks) {
            // Remove LinkedIn related properties from user object
            delete user.socialLinks.linkedinId;
            delete user.socialLinks.linkedinAccessToken;
            delete user.socialLinks.linkedinRefreshToken;
            delete user.socialLinks.linkedinTokenExpiry;

            // Update user in local storage
            localStorage.setItem('user', JSON.stringify(user));
          }
        }

        // Call onConnectionChange callback if provided
        if (onConnectionChange) {
          onConnectionChange(false);
        }
      } else {
        throw new Error('Failed to disconnect LinkedIn account');
      }
    } catch (error) {
      console.error('LinkedIn disconnect error:', error);
      toast.error('Failed to disconnect LinkedIn account');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg flex justify-center items-center">
        <div className="animate-spin h-5 w-5 border-2 border-tiffany-500 border-t-transparent rounded-full mr-2"></div>
        <span>Checking LinkedIn connection...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-5 mb-4">
      <h3 className="text-lg font-medium text-gray-900 mb-3">LinkedIn Connection</h3>

      {isConnected ? (
        <>
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Your LinkedIn account is connected. You can share notes directly to your LinkedIn profile.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={disconnectLinkedIn}
            disabled={isDisconnecting}
            className="inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isDisconnecting ? (
              <>
                <span className="inline-block h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-2"></span>
                Disconnecting...
              </>
            ) : (
              'Disconnect LinkedIn'
            )}
          </button>
        </>
      ) : (
        <>
          <div className="bg-tiffany-50 p-4 rounded-lg mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <LinkIcon className="h-5 w-5 text-tiffany-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-tiffany-700">
                  Connect your LinkedIn account to share your notes directly to your LinkedIn profile.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={connectLinkedIn}
            disabled={isConnecting}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-tiffany-600 hover:bg-tiffany-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tiffany-500 disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" /> Connect with LinkedIn
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
};

export default LinkedInConnection;
