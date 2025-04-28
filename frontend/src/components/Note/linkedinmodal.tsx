// // import React, { useState } from 'react';
// // import { Share2 } from 'lucide-react';
// // import { Dialog, DialogContent, DialogTitle, DialogTrigger,  } from '@radix-ui/react-dialog';

// // interface Note {
// //   title: string;
// //   content: string;
// // }

// // interface LinkedInShareModalProps {
// //   note: Note;
// //   onShare: (customMessage?: string) => Promise<void>;
// // }

// // const LinkedInShareModal: React.FC<LinkedInShareModalProps> = ({ note, onShare }) => {
// //   const [customMessage, setCustomMessage] = useState('');
// //   const [isSharing, setIsSharing] = useState(false);

// //   const handleShare = async () => {
// //     setIsSharing(true);
// //     try {
// //       await onShare(customMessage);
// //     } catch (error) {
// //       console.error('LinkedIn sharing error:', error);
// //       alert('Failed to share to LinkedIn');
// //     } finally {
// //       setIsSharing(false);
// //     }
// //   };

// //   return (
// //     <Dialog>
// //       <DialogTrigger asChild>
// //         <button className="flex items-center">
// //           <Share2 className="mr-2 h-4 w-4" /> Share on LinkedIn
// //         </button>
// //           </DialogTrigger>
// //         <DialogContent className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
// //           <DialogTitle>Share Note on LinkedIn</DialogTitle>
// //         <div className="space-y-4">
// //           <div className="bg-gray-100 p-4 rounded-lg">
// //             <h3 className="font-semibold mb-2">{note.title}</h3>
// //             <p className="text-sm text-gray-600 line-clamp-3">
// //               {note.content.substring(0, 200)}
// //               {note.content.length > 200 ? '...' : ''}
// //             </p>
// //           </div>
// //           <textarea
// //             placeholder="Add a custom message to your LinkedIn post (optional)"
// //             value={customMessage}
// //             onChange={(e) => setCustomMessage(e.target.value)}
// //             className="min-h-[100px]"
// //           />
// //           <button
// //             onClick={handleShare}
// //             disabled={isSharing}
// //             className="w-full"
// //           >
// //             {isSharing ? 'Sharing...' : 'Share to LinkedIn'}
// //           </button>
// //           </div>

// //       </DialogContent>
// //     </Dialog>
// //   );
// // };

// // export default LinkedInShareModal;


// import React, { useState } from 'react';
// import { Share2 } from 'lucide-react';
// import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog';

// interface Note {
//   title: string;
//   content: string;
// }

// interface LinkedInShareModalProps {
//   note: Note;
//   onShare: (customMessage?: string) => Promise<void>;
// }

// const LinkedInShareModal: React.FC<LinkedInShareModalProps> = ({ note, onShare }) => {
//   const [customMessage, setCustomMessage] = useState('');
//   const [isSharing, setIsSharing] = useState(false);

//   const handleShare = async () => {
//     setIsSharing(true);
//     try {
//       await onShare(customMessage);
//     } catch (error) {
//       console.error('LinkedIn sharing error:', error);
//       alert('Failed to share to LinkedIn');
//     } finally {
//       setIsSharing(false);
//     }
//   };

//   //close modal when clicking outside of it
//   const closeModal = () => {
//     const closeButton = document.querySelector('[aria-label="Close"]') as HTMLElement | null;
//     closeButton?.click();
//   };

//   // Create a sanitized preview of the note content by removing HTML tags
//   const sanitizeContent = (html: string): string => {
//     const tempDiv: HTMLDivElement = document.createElement('div');
//     tempDiv.innerHTML = html;
//     return tempDiv.textContent || tempDiv.innerText || '';
//   };

//   const previewContent = sanitizeContent(note.content).substring(0, 200);

//   return (
//     <Dialog>
//       <DialogTrigger asChild>
//       <button className="flex items-center px-3 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
//       <Share2 className="mr-2 h-4 w-4" /> Share on LinkedIn
//       </button>
//       </DialogTrigger>
//       <DialogContent className="fixed inset-0 flex items-center justify-center z-50 bg-gray-300">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden relative">
//       {/* Close Button */}
//       <button
//         type="button"
//         aria-label="Close"
//         onClick={() => {
//           const closeButton = document.querySelector('[aria-label="Close"]') as HTMLElement | null;
//           closeButton?.click();
//           closeModal();
//         }}
//         className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
//       >
//         ✕
//       </button>

//       <div className="p-6 border-b border-gray-200">
//       <DialogTitle className="text-xl font-semibold text-gray-900">Share Note on LinkedIn</DialogTitle>
//       </div>

//       <div className="p-6 space-y-6">
//       {/* Note Preview */}
//       <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
//         <h3 className="font-semibold text-gray-900 mb-2">{note.title}</h3>
//         <p className="text-sm text-gray-600 line-clamp-3">
//         {previewContent}
//         {note.content.length > 200 ? '...' : ''}
//         </p>
//       </div>

//       {/* Custom Message Input */}
//       <div>
//         <label htmlFor="customMessage" className="block text-sm font-medium text-gray-700 mb-2">
//         Add a custom message (optional)
//         </label>
//         <textarea
//         id="customMessage"
//         placeholder="Add a custom message to your LinkedIn post"
//         value={customMessage}
//         onChange={(e) => setCustomMessage(e.target.value)}
//         className="w-full min-h-[100px] px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
//         />
//       </div>
//       </div>

//       {/* Action Buttons */}
//       <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
//       <button
//         type="button"
//         onClick={() => {
//         const closeButton = document.querySelector('[aria-label="Close"]') as HTMLElement | null;
//         closeButton?.click();
//         }}
//         className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
//       >
//         Cancel
//       </button>
//       <button
//         onClick={handleShare}
//         disabled={isSharing}
//         className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
//       >
//         {isSharing ? (
//         <>
//         <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
//         Sharing...
//         </>
//         ) : (
//         'Share'
//         )}
//       </button>
//       </div>
//       </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default LinkedInShareModal;


import React, { useState } from 'react';
import { Share2, LinkIcon, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog';
import { toast } from 'react-hot-toast';
interface Note {
  title: string;
  content: string;
}

interface LinkedInShareModalProps {
  note: Note;
  onShare: (customMessage?: string) => Promise<void>;
  user: any; // Add user prop to check LinkedIn connection status
  API_BASE_URL: string;
}

const LinkedInShareModal: React.FC<LinkedInShareModalProps> = ({ note, onShare, user, API_BASE_URL }) => {
  const [customMessage, setCustomMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if user has LinkedIn connected
  const isLinkedInConnected = user?.socialLinks?.linkedinAccessToken;

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await onShare(customMessage);
    } catch (error) {
      console.error('LinkedIn sharing error:', error);
      toast.error('Failed to share to LinkedIn');
    } finally {
      setIsSharing(false);
    }
  };

  const connectLinkedIn = async () => {
    try {
      setIsConnecting(true);
      // Request LinkedIn authorization URL from your backend
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
      // Redirect to LinkedIn authorization page
      window.location.href = data.data.url;
    } catch (error) {
      console.error('LinkedIn connection error:', error);
      toast.error('Failed to connect to LinkedIn');
    } finally {
      setIsConnecting(false);
    }
  };

  // Create a sanitized preview of the note content by removing HTML tags
  const sanitizeContent = (html: string): string => {
    const tempDiv: HTMLDivElement = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const previewContent = sanitizeContent(note.content).substring(0, 200);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center px-3 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
          <Share2 className="mr-2 h-4 w-4" /> Share on LinkedIn
        </button>
      </DialogTrigger>
      <DialogContent className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">Share Note on LinkedIn</DialogTitle>
          </div>

          <div className="p-6 space-y-6">
            {!isLinkedInConnected ? (
              // LinkedIn Account Connection UI
              <div className="text-center space-y-4">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <LinkIcon className="h-12 w-12 text-blue-700 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Connect Your LinkedIn Account
                  </h3>
                  <p className="text-gray-600 mb-4">
                    To share your notes on LinkedIn, you'll need to connect your LinkedIn account first.
                  </p>
                  <button
                    onClick={connectLinkedIn}
                    disabled={isConnecting}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full"
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
                </div>
              </div>
            ) : (
              // Note Sharing UI
              <>
                {/* Note Preview */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">{note.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {previewContent}
                    {note.content.length > 200 ? '...' : ''}
                  </p>
                </div>

                {/* Custom Message Input */}
                <div>
                  <label htmlFor="customMessage" className="block text-sm font-medium text-gray-700 mb-2">
                    Add a custom message (optional)
                  </label>
                  <textarea
                    id="customMessage"
                    placeholder="Add a custom message to your LinkedIn post"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full min-h-[100px] px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => (document.querySelector('[aria-label="Close"]') as HTMLElement)?.click()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            {isLinkedInConnected && (
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
              >
                {isSharing ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Sharing...
                  </>
                ) : (
                  'Share'
                )}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkedInShareModal;
