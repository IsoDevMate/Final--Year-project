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

  console.log('Component rendered with attachment:', attachment);
  console.log('Note metadata:', noteMetadata);

  const handleShare = async () => {
    console.log('Share button clicked');
    if (!attachment) {
      console.error('No attachment to share');
      toast.error('No attachment to share');
      return;
    }

    setIsSharing(true);
    console.log('Sharing started with custom message:', customMessage);

    try {
      await onShare(customMessage);
      console.log('Successfully shared to LinkedIn');
      toast.success('Successfully shared to LinkedIn!');
      setCustomMessage('');
    } catch (error) {
      console.error('Sharing error:', error);
      toast.error('Failed to share to LinkedIn');
    } finally {
      setIsSharing(false);
      console.log('Sharing process completed');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center bg-tiffany-600 text-white px-4 py-2 rounded-md hover:bg-tiffany-700">
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
                  <div className="flex justify-center mb-2"></div>
                    <svg className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    </div>
                    <span className="text-gray-700">{attachment.fileName}</span>
                  </div>

            )}
            {attachment.type === 'audio' && (
              <audio
                src={attachment.url}
                controls
                className="w-full h-16 rounded-md"
              />
            )}



          <textarea
            placeholder="Add a custom message to your LinkedIn post..."
            value={customMessage}
            onChange={(e) => {
              console.log('Custom message updated:', e.target.value);
              setCustomMessage(e.target.value);
            }}
            className="w-full min-h-[100px] border rounded-md p-2"
          />
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          disabled={isSharing}
          className={`w-full mt-4 py-2 rounded-md flex items-center justify-center ${
            isSharing
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-tiffany-600 text-white hover:bg-tiffany-700'
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


// import React, { useState } from 'react';
// import { Share2, X } from 'lucide-react';
// import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog';
// import { toast } from 'react-hot-toast';

// interface MediaAttachment {
//   _id: string;
//   type: 'image' | 'audio' | 'video' | 'document';
//   url: string;
//   fileName: string;
//   fileSize: number;
//   caption?: string;
//   createdAt: string;
//   storageRef?: string;
// }

// interface MultimediaShareModaProps {
//   attachment: MediaAttachment;
//   onShare: (customMessage?: string) => Promise<void>;
// }

// export const MultimediaShareModa: React.FC<MultimediaShareModaProps> = ({ attachment, onShare }) => {
//   const [customMessage, setCustomMessage] = useState('');
//   const [isSharing, setIsSharing] = useState(false);
//   const [isOpen, setIsOpen] = useState(false);

//   const handleShare = async () => {
//     setIsSharing(true);
//     try {
//       await onShare(customMessage);
//       // Close modal after successful share
//       setIsOpen(false);
//     } catch (error) {
//       console.error('Sharing error:', error);
//       toast.error('Failed to share media');
//     } finally {
//       setIsSharing(false);
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={setIsOpen}>
//       <DialogTrigger asChild>
//         <button
//           className="text-blue-600 hover:text-blue-800"
//           onClick={() => setIsOpen(true)}
//         >
//           <Share2 className="h-5 w-5" />
//         </button>
//       </DialogTrigger>

//       <DialogContent className="fixed inset-0 flex items-center justify-center z-50">
//         {/* Semi-transparent backdrop */}
//         <div className="fixed inset-0 bg-gray-700 bg-opacity-50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

//         <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden relative z-10">
//           {/* Close button */}
//           <button
//             type="button"
//             onClick={() => setIsOpen(false)}
//             aria-label="Close"
//             className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
//           >
//             <X className="h-5 w-5" />
//           </button>

//           <div className="p-6 border-b border-gray-200">
//             <DialogTitle className="text-xl font-semibold text-gray-900">Share on LinkedIn</DialogTitle>
//           </div>

//           <div className="p-6 space-y-4">
//             {/* Media Preview */}
//             {attachment.type === 'image' && (
//               <div className="flex justify-center mb-4">
//                 <img
//                   src={attachment.url}
//                   alt={attachment.fileName || "Media preview"}
//                   className="max-h-48 object-contain rounded"
//                 />
//               </div>
//             )}

//             {attachment.type === 'video' && (
//               <div className="flex justify-center mb-4">
//                 <video
//                   src={attachment.url}
//                   className="max-h-48 object-contain rounded"
//                   controls
//                 >
//                   Your browser does not support video playback.
//                 </video>
//               </div>
//             )}

//             {attachment.type === 'document' && (
//               <div className="flex items-center justify-center p-4 bg-gray-50 rounded mb-4">
//                 <div className="text-center">
//                   <p className="font-medium text-gray-800">{attachment.fileName}</p>
//                   <p className="text-sm text-gray-500">Document</p>
//                 </div>
//               </div>
//             )}

//             {/* Custom Message Input */}
//             <div>
//               <label htmlFor="shareMessage" className="block text-sm font-medium text-gray-700 mb-2">
//                 Add a message (optional)
//               </label>
//               <textarea
//                 id="shareMessage"
//                 placeholder="Write something about this media..."
//                 value={customMessage}
//                 onChange={(e) => setCustomMessage(e.target.value)}
//                 className="w-full min-h-[100px] px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 resize-none"
//               />
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
//             <button
//               type="button"
//               onClick={() => setIsOpen(false)}
//               className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
//             >
//               Cancel
//             </button>

//             <button
//               onClick={handleShare}
//               disabled={isSharing}
//               className="px-4 py-2 rounded-md text-white bg-tiffany-600 hover:bg-tiffany-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
//             >
//               {isSharing ? (
//                 <>
//                   <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
//                   Sharing...
//                 </>
//               ) : (
//                 'Share'
//               )}
//             </button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };
