// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { NotesPage } from '../components/Note/notes';

// interface Note {
//   _id: string;
//   title: string;
//   content: string;
//   tags: string[];
//   isPrivate: boolean;
//   createdAt: string;
//   updatedAt: string;
//   user: {
//     _id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//   };
//   event?: {
//     _id: string;
//     title: string;
//   };
//   session?: {
//     _id: string;
//     title: string;
//   };
//   mediaAttachments: MediaAttachment[];
//   sharedWith?: string[];
// }

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

// const Notes: React.FC = () => {
//   const { user, isAuthenticated, isLoading } = useAuth();
//   const navigate = useNavigate();
//   const [notes, setNotes] = useState<Note[]>([]);
//   const [isLoadingNotes, setIsLoadingNotes] = useState(true);

//   useEffect(() => {
//     if (!isLoading && !isAuthenticated) {
//       navigate('/login');
//       return;
//     }

//     if (isAuthenticated) {
//       fetchNotes();
//     }
//   }, [isAuthenticated, isLoading, navigate]);

//   const fetchNotes = async () => {
//     try {
//       const token = localStorage.getItem('accessToken');
//       const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/notes`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setNotes(response.data.notes);
//     } catch (error) {
//       console.error('Failed to fetch notes:', error);
//     } finally {
//       setIsLoadingNotes(false);
//     }
//   };

//   if (isLoading || isLoadingNotes) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
//         <button
//           onClick={() => navigate('/profile')}
//           className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//         >
//           Profile
//         </button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {notes.map((note) => (
//           <div key={note._id} className="bg-white rounded-lg shadow-md p-6">
//             <h3 className="text-xl font-semibold mb-2">{note.title}</h3>
//             <p className="text-gray-600 mb-4">{note.content}</p>
//             <div className="flex justify-between items-center text-sm text-gray-500">
//               <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
//               <button
//                 onClick={() => navigate(`/dashboard/notes/${note._id}`)}
//                 className="text-blue-500 hover:text-blue-700"
//               >
//                 Edit
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {notes.length === 0 && (
//         <div className="text-center text-gray-500 mt-8">
//           No notes yet. Create your first note!
//         </div>
//       )}

//       <button
//         onClick={() => navigate('/dashboard/notes/new')}
//         className="fixed bottom-8 right-8 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600"
//       >
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           className="h-6 w-6"
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M12 4v16m8-8H4"
//           />
//         </svg>
//       </button>
//     </div>
//   );
// };

// export default Notes;
