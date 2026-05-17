import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Tag, Search, Plus,
  Filter, ChevronDown, File, Image,
  Video, Mic, Lock, Share2, Trash2,
  SortAsc, SortDesc, Check, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

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
}

interface MediaAttachment {
  _id: string;
  type: 'image' | 'audio' | 'video' | 'document';
  url: string;
  fileName: string;
  fileSize: number;
  caption?: string;
  createdAt: string;
}

interface FilterState {
  searchTerm: string;
  eventId?: string;
  sessionId?: string;
  tags: string[];
  isPrivate?: boolean;
}

const NotesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [events, setEvents] = useState<{ _id: string; title: string }[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    tags: [],
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://final-year-project-jy2j.onrender.com';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch events for filter dropdown
  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/events`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch events');
      const result = await response.json();
      setEvents(result.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // Fetch notes data
  const fetchNotes = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    setIsLoading(true);
    try {
      // Construct query params based on filters
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', '10');

      if (filters.searchTerm) queryParams.append('searchTerm', filters.searchTerm);
      if (filters.eventId) queryParams.append('event', filters.eventId);
      if (filters.sessionId) queryParams.append('session', filters.sessionId);
      if (filters.tags.length > 0) {
        filters.tags.forEach(tag => queryParams.append('tags[]', tag));
      }
      if (filters.isPrivate !== undefined) {
        queryParams.append('isPrivate', filters.isPrivate.toString());
      }

      // Fetch notes
      const response = await fetch(`${API_BASE_URL}/api/v1/notes?${queryParams.toString()}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/auth/login');
          return;
        }
        throw new Error('Failed to fetch notes');
      }

      const result = await response.json();

      // Sort notes based on sortBy state
      let sortedNotes = [...result.data.notes];
      switch (sortBy) {
        case 'newest':
          sortedNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          break;
        case 'oldest':
          sortedNotes.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
          break;
        case 'title':
          sortedNotes.sort((a, b) => a.title.localeCompare(b.title));
          break;
      }

      setNotes(sortedNotes);
      setTotalPages(result.data.totalPages);

      // Extract all unique tags
      const uniqueTags = Array.from(new Set(result.data.notes.flatMap(note => note.tags)));
      setAllTags(uniqueTags);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when filters/sort change
  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [page, sortBy, filters, isAuthenticated]);

  // Handle note selection for bulk actions
  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  // Bulk delete notes
  const handleBulkDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the selected notes?')) return;

    try {
      const deletePromises = selectedNotes.map(noteId =>
        fetch(`${API_BASE_URL}/api/v1/notes/${noteId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        })
      );

      const results = await Promise.all(deletePromises);

      // Check if all deletions were successful
      const allSuccessful = results.every(response => response.ok);

      if (allSuccessful) {
        toast.success('Selected notes deleted successfully');
        fetchNotes(); // Refresh notes list
        setSelectedNotes([]); // Clear selection
      } else {
        toast.error('Some notes could not be deleted');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete notes');
    }
  };

  // Render media icon based on attachment type
  const renderMediaIcon = (type: MediaAttachment['type']) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4 text-blue-500" />;
      case 'video': return <Video className="h-4 w-4 text-red-500" />;
      case 'audio': return <Mic className="h-4 w-4 text-tiffany-500" />;
      case 'document': return <File className="h-4 w-4 text-green-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tiffany-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Notes</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/dashboard/notes/new')}
            className="flex items-center bg-tiffany-600 text-white px-4 py-2 rounded-md hover:bg-tiffany-700"
          >
            <Plus className="h-5 w-5 mr-2" /> New Note
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex space-x-4">
        <div className="flex-grow relative">
          <input
            type="text"
            placeholder="Search notes..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({...prev, searchTerm: e.target.value}))}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-tiffany-500"
          />
          <Search className="absolute left-3 top-3 text-gray-400" />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center border px-4 py-2 rounded-md hover:bg-gray-50"
          >
            <Filter className="h-5 w-5 mr-2" /> Filters
            {showFilters ? <ChevronDown className="ml-2" /> : null}
          </button>

          {showFilters && (
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded-md shadow-lg p-4 z-10">
              {/* Event Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Event</label>
                <select
                  value={filters.eventId || ''}
                  onChange={(e) => setFilters(prev => ({...prev, eventId: e.target.value}))}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="">All Events</option>
                  {events.map(event => (
                    <option key={event._id} value={event._id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Privacy Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Privacy</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={filters.isPrivate === undefined}
                      onChange={() => setFilters(prev => ({...prev, isPrivate: undefined}))}
                      className="form-radio"
                    />
                    <span className="ml-2">All</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={filters.isPrivate === true}
                      onChange={() => setFilters(prev => ({...prev, isPrivate: true}))}
                      className="form-radio"
                    />
                    <span className="ml-2">Private</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={filters.isPrivate === false}
                      onChange={() => setFilters(prev => ({...prev, isPrivate: false}))}
                      className="form-radio"
                    />
                    <span className="ml-2">Shared</span>
                  </label>
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          tags: prev.tags.includes(tag)
                            ? prev.tags.filter(t => t !== tag)
                            : [...prev.tags, tag]
                        }));
                      }}
                      className={`px-2 py-1 rounded-full text-xs ${
                        filters.tags.includes(tag)
                          ? 'bg-tiffany-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="border px-4 py-2 rounded-md"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">By Title</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedNotes.length > 0 && (
        <div className="bg-gray-100 p-4 rounded-md mb-4 flex justify-between items-center">
          <span>{selectedNotes.length} notes selected</span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-5 w-5 mr-2" /> Delete Selected
          </button>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No notes found. Create your first note!
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => (
            <div
              key={note._id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow relative"
            >
              {/* Note Selection Checkbox */}
              <input
                type="checkbox"
                checked={selectedNotes.includes(note._id)}
                onChange={() => toggleNoteSelection(note._id)}
                className="absolute top-2 left-2"
              />

              {/* Privacy Icon */}
              {note.isPrivate ? (
                <Lock className="absolute top-2 right-2 text-gray-400 h-4 w-4" />
              ) : (
                <Share2 className="absolute top-2 right-2 text-tiffany-500 h-4 w-4" />
              )}

              <Link to={`/dashboard/notes/${note._id}`} className="block">
                <h3 className="text-lg font-semibold mb-2 truncate">{note.title}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{note.content}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {note.tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-gray-200 text-xs px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Media Attachments */}
                {note.mediaAttachments.length > 0 && (
                  <div className="flex space-x-2 mt-2">
                    {note.mediaAttachments.slice(0, 3).map(attachment => (
                      <div key={attachment._id} className="tooltip" title={attachment.fileName}>
                        {renderMediaIcon(attachment.type)}
                      </div>
                    ))}
                    {note.mediaAttachments.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{note.mediaAttachments.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Note Metadata */}
                <div className="text-xs text-gray-500 mt-2 flex justify-between">
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  <span>{note.event?.title}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setPage(index + 1)}
              className={`px-4 py-2 rounded-md ${
                page === index + 1
                  ? 'bg-tiffany-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesListPage;
