import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Save, X,
 Tag, Lock, Unlock, Trash2, Plus, Pencil,
  ChevronLeft, Edit3,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { EventSelector } from '../Event/eventselector';
import LinkedInShareModal from './linkedinmodal';
import toast from 'react-hot-toast';
import { MediaAttachmentHandler } from './multimediaattatchmenthandler';
import SimpleCanvasDrawing from './canvasdrawingtool';
import LinkedInConnection from '../connectLinked';
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
    const { user ,isAuthenticated,setUser } = useAuth();
   const [title, setTitle] = useState('');

  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [currentTag, setCurrentTag] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCanvasEditor, setShowCanvasEditor] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<string | null>(null);
  const [lastDrawingId, setLastDrawingId] = useState<string | null>(null);
  const [drawingUploading, setDrawingUploading] = useState(false);

  const [selectedAttachment, setSelectedAttachment] = useState<MediaAttachment | null>(null);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();

  const editorRef = useRef<HTMLDivElement>(null);

   const API_BASE_URL = 'https://final-year-project-56d5.onrender.com';


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

const handleSaveDrawing = async (blob, fileName, previewUrl) => {
  setDrawingUploading(true);

  try {
    // If we have a noteId and it's not 'new', upload the image via API
    if (noteId && noteId !== 'new') {
      // First save the drawing as a temporary preview
      setCurrentDrawing(previewUrl);

      // Create a form data object to send the file
      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('type', 'image');
      formData.append('caption', 'Drawing added on ' + new Date().toLocaleString());

      // Upload the drawing as an attachment
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/v1/notes/${noteId}/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload drawing');
      }

      // Get the response data
      const data = await response.json();

      // Update the note content with a proper markdown image link to the uploaded file
      if (data.success && data.data && data.data.mediaAttachments) {
        const latestAttachment = data.data.mediaAttachments[data.data.mediaAttachments.length - 1];

        // Update the note with the new attachment
        setNote(data.data);

        // Add the image to the content as markdown
        const imageMarkdown = `\n\n![Drawing: ${latestAttachment.caption || 'Note drawing'}](${latestAttachment.url})\n`;
        setContent(prev => prev + imageMarkdown);

        // Store the ID for reference
        setLastDrawingId(latestAttachment._id);

        toast.success('Drawing saved successfully');
      }
    } else {
      // For new notes, just store the drawing as a data URL temporarily
      // We'll need to upload it after the note is created
      setCurrentDrawing(previewUrl);

      // Add a placeholder in the content
      const imageMarkdown = `\n\n![Drawing](${previewUrl})\n`;
      setContent(prev => prev + imageMarkdown);

      toast.success('Drawing added to note');
    }
  } catch (error) {
    console.error('Error saving drawing:', error);
    toast.error('Failed to save drawing');

    // Still show the drawing in the content as a fallback
    const imageMarkdown = `\n\n![Drawing](${previewUrl})\n`;
    setContent(prev => prev + imageMarkdown);
  } finally {
    setDrawingUploading(false);
    setShowCanvasEditor(false);
  }
}

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

  // const handleSave = async () => {
  //   console.group('Save Note');
  //   console.log('Save Note Started');
  //   console.log('Current User:', user);
  //   console.log('Is Authenticated:', isAuthenticated);

  //   // Validate user and token
  //   if (!user || !isAuthenticated) {
  //     console.warn('User not authenticated - cannot save');
  //     toast.error('Please log in to save notes');
  //     navigate('/auth/login');
  //     return;
  //   }

  //   // Additional input validation
  //   if (!title.trim()) {
  //     console.warn('Note title is empty');
  //     toast.error('Please enter a note title');
  //     return;
  //   }

  //   if (!selectedEventId) {
  //     console.warn('No event selected');
  //     toast.error('Please select an event for this note');
  //     return;
  //   }

  //   setIsSaving(true);
  //   try {
  //     const noteData = {
  //       title,
  //       content,
  //       tags,
  //       isPrivate,
  //       event: selectedEventId,
  //       session: selectedSessionId,
  //     };

  //     console.log('Note Data to Save:', noteData);

  //     const response = await fetch(
  //       `${API_BASE_URL}/api/v1/notes${noteId && noteId !== 'new' ? `/${noteId}` : ''}`,
  //       {
  //         method: noteId && noteId !== 'new' ? 'PUT' : 'POST',
  //         headers: getAuthHeaders(),
  //         body: JSON.stringify(noteData)
  //       }
  //     );

  //     console.log('Save Response Status:', response.status);

  //     // Enhanced error handling
  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       console.error('Save Error:', errorData);
  //       throw new Error(errorData.message || 'Failed to save note');
  //     }

  //     const savedNote = await response.json();
  //     console.log('Saved Note Response:', savedNote);

  //     // Navigate or update state based on save type
  //     if (noteId === 'new') {
  //       console.log('New note created, navigating to note page');
  //       navigate(`/dashboard/notes/${savedNote.data._id}`);
  //     } else {
  //       console.log('Existing note updated');
  //       setNote(savedNote.data);
  //     }

  //     toast.success('Note saved successfully');
  //   } catch (error) {
  //     console.error('Error saving note:', error);
  //     toast.error(error instanceof Error ? error.message : 'Failed to save note');
  //   } finally {
  //     setIsSaving(false);
  //     console.groupEnd();
  //   }
  // };


   // Enhanced handleSave function
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

    // If this was a new note and we have a drawing pending upload
    if (noteId === 'new' && currentDrawing) {
      // Convert data URL back to blob for upload
      const response = await fetch(currentDrawing);
      const blob = await response.blob();

      // Now we have a note ID, we can upload the drawing
      const formData = new FormData();
      formData.append('file', blob, `drawing-${new Date().getTime()}.png`);
      formData.append('type', 'image');
      formData.append('caption', 'Drawing added on ' + new Date().toLocaleString());

      // Upload the drawing as an attachment to the newly created note
      const uploadResponse = await fetch(`${API_BASE_URL}/api/v1/notes/${savedNote.data._id}/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (uploadResponse.ok) {
        console.log('Drawing uploaded successfully for new note');
      }
    }

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
        {/* Back Button and Title */}
        <div className="flex items-center">
          <button
        onClick={() => navigate('/dashboard/notes')}
        className="mr-4 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
          >
        <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
        {noteId === 'new' ? 'Create New Note' : 'Edit Note'}
          </h1>
        </div>

        {/* LinkedIn Connection */}
        <div className="flex gap-4 items-center">
          {user && (
        <LinkedInConnection
          user={user}
          API_BASE_URL={API_BASE_URL}
          onUpdate={() => {
            // Refresh user data after LinkedIn connection changes
            setUser({ ...user, socialLinks: { ...user.socialLinks, linkedinAccessToken: null } });
            toast.success("LinkedIn connection updated successfully!");
          }}
        />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {note && note._id &&  (
           <LinkedInShareModal
            note={note}
             onShare={handleLinkedInShare}
             user={user}
             API_BASE_URL={API_BASE_URL}
        />
          )}

          <button
        onClick={() => navigate('/dashboard/notes')}
        className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200 flex items-center focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
        <X className="mr-1 h-5 w-5" /> Cancel
          </button>

          <button
        onClick={handleSave}
        disabled={isSaving}
        className={`py-2 px-4 rounded-lg flex items-center transition duration-200 focus:outline-none focus:ring-2 ${
          isSaving
            ? 'bg-indigo-400 text-white cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
        }`}
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


            {showCanvasEditor && (
               <SimpleCanvasDrawing
                 onSave={handleSaveDrawing}
                onCancel={handleCancelDrawing}
                initialDrawing={currentDrawing || undefined}
               />
             )}


            <button
               onClick={() => setShowCanvasEditor(true)}
               className="flex items-center text-indigo-600              hover:text-indigo-800"
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
