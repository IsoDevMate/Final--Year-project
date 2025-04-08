import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Save, X,
 Tag, Lock, Unlock, Trash2, Plus, Pencil,
  ChevronLeft, Edit3,
} from 'lucide-react';
// import * as fabric from 'fabric';
import { useAuth } from '../../contexts/AuthContext';
import { EventSelector } from '../Event/eventselector';
import LinkedInShareModal from './linkedinmodal';
import toast from 'react-hot-toast';
import { MediaAttachmentHandler } from './multimediaattatchmenthandler';
// import  LinkedInShareComponent  from './newlinkedin';
import SimpleCanvasDrawing from './canvasdrawingtool';
interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  event: {
    _id: string;
    title: string;
  };
  session?: {
    _id: string;
    title: string;
  };
  mediaAttachments: MediaAttachment[];
  sharedWith?: string[];
}

interface MediaAttachment {
  _id: string;
  type: 'image' | 'audio' | 'video' | 'document';
  url: string;
  fileName: string;
  fileSize: number;
  caption?: string;
  createdAt: string;
  storageRef?: string;
}

 const NotesPage: React.FC = () => {
  const { noteId, eventId } = useParams();
  const navigate = useNavigate();
    const [note, setNote] = useState<Note | null>(null);
    const { user ,isAuthenticated } = useAuth();
   const [title, setTitle] = useState('');
  //  const [brushWidth, setBrushWidth] = useState(5);
  // const [brushColor, setBrushColor] = useState('#000000');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [currentTag, setCurrentTag] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCanvasEditor, setShowCanvasEditor] = useState(false);
  // const canvasRef = useRef<HTMLCanvasElement>(null);
  // const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<MediaAttachment | null>(null);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();

  const editorRef = useRef<HTMLDivElement>(null);
  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  // const [isLoading, setIsLoading] = useState(true);
   const API_BASE_URL = 'https://final-year-project-77pa.onrender.com';

   const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    fetchNoteData();
  }, [noteId, user, navigate]);

  // Fetch note data or initialize a new note
   const fetchNoteData = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      if (noteId && noteId !== 'new') {
        // Fetch existing note using the unified API URL
        const response = await fetch(`${API_BASE_URL}/api/v1/notes/${noteId}`, {
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Handle unauthorized access
            navigate('/auth/login');
            return;
          }
          throw new Error('Failed to fetch note');
        }

        const data = await response.json();
        setNote(data.data);
        setTitle(data.data.title);
        setContent(data.data.content);
        setTags(data.data.tags || []);
        setIsPrivate(data.data.isPrivate);
        setSelectedEventId(data.data.event?._id);
        setSelectedSessionId(data.data.session?._id);
      } else {
        // Initialize new note
        setTitle('');
        setContent('');
        setTags([]);
        setIsPrivate(true);
        setSelectedEventId(undefined);
        setSelectedSessionId(undefined);
        setNote(null);
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize fabric.js canvas when showing canvas editor
// useEffect(() => {
//   if (showCanvasEditor && canvasRef.current && !fabricCanvasRef.current) {
//     fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
//       width: canvasRef.current.offsetWidth,
//       height: 400,
//       backgroundColor: '#fff'
//     });

//     // Enhanced drawing configuration
//     fabricCanvasRef.current.isDrawingMode = true;
//     if (fabricCanvasRef.current.freeDrawingBrush) {
//       fabricCanvasRef.current.freeDrawingBrush.width = 5;
//       fabricCanvasRef.current.freeDrawingBrush.color = '#000';
//     }

//     // Add color and brush size controls
//     const updateBrush = () => {
//       if (fabricCanvasRef.current) {
//         fabricCanvasRef.current.freeDrawingBrush.width = brushWidth;
//         fabricCanvasRef.current.freeDrawingBrush.color = brushColor;
//       }
//     };

//     // Call updateBrush when brushWidth or brushColor changes
//     updateBrush();

//     return () => {
//       if (fabricCanvasRef.current) {
//         fabricCanvasRef.current.dispose();
//         fabricCanvasRef.current = null;
//       }
//     };
//   }
// }, [showCanvasEditor]);

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // const handleAddDrawing = () => {
  //   if (!fabricCanvasRef.current) return;

  //   // Convert canvas to image and add to note content
  //   const dataUrl = fabricCanvasRef.current.toDataURL({
  //     format: 'png',
  //     quality: 0.8,
  //     multiplier: 1
  //   });

  //   // For this demo, we'll add it as a base64 image in the content
  //   // In production, you would upload this to your storage service
  //   setContent(prev => `${prev}\n\n![Drawing](${dataUrl})`);

  //   // Clear and hide canvas
  //   fabricCanvasRef.current.clear();
  //   setShowCanvasEditor(false);
  //  };

   const handleSaveDrawing = (dataUrl) => {
  // Add the drawing to the note content
  setContent(prev => `${prev}\n\n![Drawing](${dataUrl})`);
  setShowCanvasEditor(false);
};

const handleCancelDrawing = () => {
  setShowCanvasEditor(false);
};

   // Add this method to your NotesPage component
const handleLinkedInShare = async (customMessage?: string) => {
  if (!note) return;

  //check if user object contains linkedin token
  if (!user || !user.socialLinks?.linkedinAccessToken) {
    toast.error('Please connect your LinkedIn account to share notes.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/linkedin/share/note/${note._id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        customMessage,
        // You can pass additional metadata if needed
        noteMetadata: {
          title: note.title,
          content: note.content,
          event: note.event?.title,
          session: note.session?.title
        }
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        navigate('/auth/login');
        return;
      }
      throw new Error('Failed to share to LinkedIn');
    }

    const result = await response.json();
    alert('Successfully shared to LinkedIn!');

    // Optionally open the shared post
    if (result.data.shareUrl) {
      window.open(result.data.shareUrl, '_blank');
    }
  } catch (error) {
    console.error('LinkedIn sharing error:', error);
    alert('Failed to share to LinkedIn');
  }
   };

  const handleSave = async () => {
    console.group('Save Note');
    console.log('Save Note Started');
    console.log('Current User:', user);
    console.log('Is Authenticated:', isAuthenticated);

    // Validate user and token
    if (!user || !isAuthenticated) {
      console.warn('User not authenticated - cannot save');
      toast.error('Please log in to save notes');
      navigate('/auth/login');
      return;
    }

    // Additional input validation
    if (!title.trim()) {
      console.warn('Note title is empty');
      toast.error('Please enter a note title');
      return;
    }

    if (!selectedEventId) {
      console.warn('No event selected');
      toast.error('Please select an event for this note');
      return;
    }

    setIsSaving(true);
    try {
      const noteData = {
        title,
        content,
        tags,
        isPrivate,
        event: selectedEventId,
        session: selectedSessionId,
      };

      console.log('Note Data to Save:', noteData);

      const response = await fetch(
        `${API_BASE_URL}/api/v1/notes${noteId && noteId !== 'new' ? `/${noteId}` : ''}`,
        {
          method: noteId && noteId !== 'new' ? 'PUT' : 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(noteData)
        }
      );

      console.log('Save Response Status:', response.status);

      // Enhanced error handling
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Save Error:', errorData);
        throw new Error(errorData.message || 'Failed to save note');
      }

      const savedNote = await response.json();
      console.log('Saved Note Response:', savedNote);

      // Navigate or update state based on save type
      if (noteId === 'new') {
        console.log('New note created, navigating to note page');
        navigate(`/dashboard/notes/${savedNote.data._id}`);
      } else {
        console.log('Existing note updated');
        setNote(savedNote.data);
      }

      toast.success('Note saved successfully');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save note');
    } finally {
      setIsSaving(false);
      console.groupEnd();
    }
  };




  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!noteId || !attachmentId) return;

    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/notes/${noteId}/media/${attachmentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/auth/login');
          return;
        }
        throw new Error('Failed to delete attachment');
      }

      const result = await response.json();
      setNote(result.data);
      setSelectedAttachment(null);
      setShowMediaPreview(false);
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Failed to delete attachment');
    }
  };

  const handleDeleteNote = async () => {
    if (!note || !note._id || !isAuthenticated) return;

    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/notes/${note._id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          if (response.status === 401) {
            navigate('/auth/login');
            return;
          }
          throw new Error('Failed to delete note');
        }

        navigate('/dashboard/notes');
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note');
      }
    }
  };


const openMediaPreview = (attachment: MediaAttachment) => {
  console.log('Opening preview for:', attachment);
  setSelectedAttachment(attachment);
  setShowMediaPreview(true);
};


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">

        {/* {note && note._id && (
          <LinkedInShareComponent
            note={{
              id: note._id,
              title: note.title,
              content: note.content,
              mediaAttachments: note.mediaAttachments || []
            }}
          />
        )} */}

        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard/notes')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {noteId === 'new' ? 'Create New Note' : 'Edit Note'}
          </h1>
        </div>

        <div className="flex space-x-3">

              {note && note._id  && (
               <LinkedInShareModal
                 note={note}
                 onShare={handleLinkedInShare}
               />
          )}

          <button
            onClick={() => navigate('/dashboard/notes')}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200 flex items-center"
          >
            <X className="mr-1 h-5 w-5" /> Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-1 h-5 w-5" /> Save Note
              </>
            )}
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Note Editor */}
        <div className="lg:col-span-2 space-y-6">
           <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Event
        </label>
        <EventSelector
          onEventSelect={handleEventSelect}
          selectedEventId={selectedEventId}
        />
      </div>
          {/* Title Input */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Note Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Rich Text Editor */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Note Content</h2>
              <button
                onClick={() => setShowCanvasEditor(!showCanvasEditor)}
                className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm font-medium"
              >
                <Edit3 className="h-4 w-4 mr-1" /> {showCanvasEditor ? 'Hide Drawing Tool' : 'Show Drawing Tool'}
              </button>
            </div>

            {/* Canvas Editor */}
            {/* {showCanvasEditor && (
              <div className="mb-4 border border-gray-300 rounded-md p-2">
                <div className="bg-gray-100 p-2 rounded-md mb-2 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Drawing Tool</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fabricCanvasRef.current?.clear()}
                      className="text-sm bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleAddDrawing}
                      className="text-sm bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                    >
                      Add to Note
                    </button>
                  </div>
                </div>
                <canvas ref={canvasRef} className="border border-gray-200 rounded-md w-full"></canvas>
              </div>
            )} */}

            {showCanvasEditor && (
               <SimpleCanvasDrawing
                 onSave={handleSaveDrawing}
                 onCancel={handleCancelDrawing}
               />
             )}


            <button
  onClick={() => setShowCanvasEditor(true)}
  className="flex items-center text-indigo-600 hover:text-indigo-800"
>
  <Pencil className="h-5 w-5 mr-1" />
  Show Drawing Tool
</button>


            {/* Text Editor */}
            <div
              ref={editorRef}
              className="border border-gray-300 rounded-md p-4 min-h-[300px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              contentEditable
              dangerouslySetInnerHTML={{ __html: content }}
              onBlur={(e) => setContent(e.currentTarget.innerHTML)}
            ></div>
          </div>
        </div>

        {/* Sidebar / Settings */}
        <div className="space-y-6">
          {/* Note Options */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Note Options</h2>

            {/* Privacy Toggle */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-medium text-gray-700">Privacy</span>
              <button
                onClick={() => setIsPrivate(!isPrivate)}
                className={`flex items-center px-3 py-2 rounded-md ${
                  isPrivate
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {isPrivate ? (
                  <>
                    <Lock className="h-4 w-4 mr-1" /> Private
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-1" /> Public
                  </>
                )}
              </button>
            </div>

            {/* Delete Note Button (for existing notes) */}
                {note && note._id && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <button
                      onClick={handleDeleteNote}
                      className="w-full flex items-center justify-center py-2 px-4 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Note
                    </button>
                  </div>
                )}
            {/* Tags */}
            <div className="mb-6">
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex">
                <input
                  id="tags"
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Add a tag"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={addTag}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {/* Tag List */}
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-indigo-800 hover:text-indigo-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>



            <MediaAttachmentHandler.MediaUploadButtons
               noteId={note?._id}
               API_BASE_URL={API_BASE_URL}
               setNote={setNote}
               navigate={navigate}
             />

             <MediaAttachmentHandler.AttachmentsList
               note={note}
               openMediaPreview={openMediaPreview}
             />

          </div>

          {/* Note Info */}
          {note && note._id && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Note Information</h2>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(note.updatedAt).toLocaleString()}
                  </span>
                </div>

                {note.event && (
                  <div>
                    <span className="text-gray-500">Event:</span>
                    <span className="ml-2 text-indigo-600">
                      <Link to={`/dashboard/events/${note.event._id}`}>{note.event.title}</Link>
                    </span>
                  </div>
                )}

                {note.session && (
                  <div>
                    <span className="text-gray-500">Session:</span>
                    <span className="ml-2 text-indigo-600">
                      <Link to={`/dashboard/sessions/${note.session._id}`}>{note.session.title}</Link>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Media Preview Modal */}
      {/* {showMediaPreview && selectedAttachment && (
         <div className="fixed inset-0 z-50 overflow-y-auto bg-black        bg-opacity-70 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-medium">{selectedAttachment.fileName}</h3>
        <button
          onClick={() => setShowMediaPreview(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        {selectedAttachment.type === 'image' && (
          <img
            src={selectedAttachment.url}
            alt={selectedAttachment.fileName}
            className="max-w-full max-h-[70vh] object-contain"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.src = '/path/to/fallback/image.png';
            }}
          />
        )}
        {selectedAttachment.type === 'audio' && (
          <audio controls className="w-full">
            <source src={selectedAttachment.url} />
            Your browser does not support the audio element.
          </audio>
        )}
        {selectedAttachment.type === 'video' && (
          <video controls className="max-w-full max-h-[70vh]">
            <source src={selectedAttachment.url} />
            Your browser does not support the video element.
          </video>
        )}
        {selectedAttachment.type === 'document' && (
          <iframe
            src={selectedAttachment.url}
            width="100%"
            height="600px"
            className="border-none"
          >
            Document preview not available
          </iframe>
        )}
      </div>
    </div>
         </div>
       )} */}

          <MediaAttachmentHandler.MediaPreviewModal
             selectedAttachment={selectedAttachment}
             showMediaPreview={showMediaPreview}
             setShowMediaPreview={setShowMediaPreview}
             note={note}
             handleDeleteAttachment={handleDeleteAttachment}
           />
    </div>
  );
};

export default NotesPage;
