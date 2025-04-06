import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, Calendar, Video, Users, MapPin, ArrowLeft, Plus, Edit, Trash2, FileText, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { useEvent } from '../../contexts/EventContext';
import { useSession } from '../../contexts/SessionContext';



interface Speaker {
  userId?: string;
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  photoUrl?: string;
}

interface Material {
  type: 'presentation' | 'document' | 'video' | 'other';
  title: string;
  url: string;
  description?: string;
  isPublic: boolean;
}

interface Session {
  _id: string;
  eventId: string;
  title: string;
  description: string;
  speaker?: Speaker;
  startTime: string;
  endTime: string;
  location?: string;
  capacity?: number;
  attendees: string[];
  materials?: Material[];
  isLiveStreamed?: boolean;
  streamUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Event {
  _id: string;
  title: string;
  location: {
    name: string;
    city: string;
  };
  startDate: string;
  endDate: string;
}

const SessionsPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { setCurrentEvent } = useEvent();
  const { sessionList, setSessionList } = useSession();


  const [sessions, setSessions] = useState<Session[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sessions and event data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch event details
        const eventResponse = await axios.get(`https://final-year-project-77pa.onrender.com/api/v1/events/${eventId}`);
        if (eventResponse.data.success) {
          const eventData = eventResponse.data.data;
          setEvent(eventData);
          setCurrentEvent(eventData); // Set in context
        }

        // Fetch sessions for this event
        const sessionsResponse = await axios.get(`https://final-year-project-77pa.onrender.com/api/v1/sessions/event/${eventId}`);
        if (sessionsResponse.data.success) {
          const sessionsData = sessionsResponse.data.data;
          setSessions(sessionsData);
          setSessionList(sessionsData); // Set in context
        } else {
          setError('Failed to fetch sessions');
        }
      } catch (err) {
        setError('An error occurred while fetching data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchData();
    }
  }, [eventId, setCurrentEvent, setSessionList]);
  // Handle delete session
  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        const response = await axios.delete(`https://final-year-project-77pa.onrender.com/api/v1/sessions/${sessionId}`);

        if (response.data.success) {
          // Remove from local state
          setSessions(prev => prev.filter(session => session._id !== sessionId));
        } else {
          setError('Failed to delete session');
        }
      } catch (err) {
        setError('An error occurred while deleting the session');
        console.error(err);
      }
    }
  };

  // Toggle live stream status
  const handleToggleLiveStream = async (sessionId: string, isCurrentlyLiveStreamed: boolean, streamUrl?: string) => {
    try {
      const updateData = {
        isLiveStreamed: !isCurrentlyLiveStreamed,
        streamUrl: !isCurrentlyLiveStreamed ? streamUrl || '' : undefined
      };

      // If turning on live stream and no URL, prompt for one
      if (!isCurrentlyLiveStreamed && !streamUrl) {
        const url = prompt('Please enter the stream URL:');
        if (!url) return; // User cancelled
        updateData.streamUrl = url;
      }

      const response = await axios.patch(`https://final-year-project-77pa.onrender.com/api/v1/sessions/${sessionId}/livestream`, updateData);

      if (response.data.success) {
        // Update in local state
        setSessions(prev => prev.map(session =>
          session._id === sessionId ? { ...session, ...updateData } : session
        ));
      } else {
        setError('Failed to update live stream status');
      }
    } catch (err) {
      setError('An error occurred while updating live stream status');
      console.error(err);
    }
  };

  // Register for a session
  const handleRegisterForSession = async (sessionId: string) => {
    try {
      const response = await axios.post(`https://final-year-project-77pa.onrender.com/api/v1/sessions/${sessionId}/register`);

      if (response.data.success) {
        // Update the attendees count in local state
        setSessions(prev => prev.map(session =>
          session._id === sessionId
            ? { ...session, attendees: [...session.attendees, 'currentUser'] }
            : session
        ));
      } else {
        setError('Failed to register for session');
      }
    } catch (err) {
      setError('An error occurred while registering for the session');
      console.error(err);
    }
  };

  // Format date and time
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate session duration in minutes
  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffInMs = end.getTime() - start.getTime();
    return Math.round(diffInMs / (1000 * 60));
  };

  // Group sessions by date
  const groupSessionsByDate = () => {
    const grouped: { [key: string]: Session[] } = {};

    sessions.forEach(session => {
      const date = new Date(session.startTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(session);
    });

    // Sort each day's sessions by start time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return grouped;
  };

  const groupedSessions = groupSessionsByDate();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Event
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isLoading ? 'Loading...' : event ? `Sessions for ${event.title}` : 'Sessions'}
          </h1>
          {event && (
            <div className="text-sm text-gray-500 mt-1">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
              </div>
              <div className="flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {event.location.name}, {event.location.city}
              </div>
            </div>
          )}
        </div>
        <Link
          to={`/events/${eventId}/sessions/create`}
          className="flex items-center bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200 mt-4 md:mt-0"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Session
        </Link>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No sessions yet</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              There are no sessions scheduled for this event. Create a new session to get started.
            </p>
            <div className="mt-6">
              <Link
                to={`/dashboard/events/${eventId}/sessions/create`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Session
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(groupedSessions).map(date => (
              <div key={date} className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">{date}</h2>
                <div className="space-y-4">
                  {groupedSessions[date].map(session => (
                    <div key={session._id} className="border rounded-lg p-4 hover:shadow-md transition duration-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex-1">
                          <Link to={`/sessions/${session._id}`} className="text-lg font-medium text-indigo-600 hover:text-indigo-800">
                            {session.title}
                          </Link>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDateTime(session.startTime)} - {formatDateTime(session.endTime)}
                              <span className="ml-2 text-gray-500">({calculateDuration(session.startTime, session.endTime)} min)</span>
                            </div>
                            {session.location && (
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-1" />
                                {session.location}
                              </div>
                            )}
                            {session.speaker && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Users className="h-4 w-4 mr-1" />
                                Speaker: {session.speaker.name}
                                {session.speaker.title && session.speaker.company && (
                                  <span className="ml-1 text-gray-500">
                                    ({session.speaker.title}, {session.speaker.company})
                                  </span>
                                )}
                              </div>
                            )}
                            {session.capacity && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Users className="h-4 w-4 mr-1" />
                                {session.attendees.length} / {session.capacity} Attendees
                              </div>
                            )}
                          </div>
                          {session.tags && session.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {session.tags.map(tag => (
                                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex mt-4 md:mt-0 space-x-2">
                          {session.isLiveStreamed && (
                            <a
                              href={session.streamUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Live
                            </a>
                          )}
                          <button
                            onClick={() => handleToggleLiveStream(session._id, !!session.isLiveStreamed, session.streamUrl)}
                            className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded
                              ${session.isLiveStreamed
                                ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                                : 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700'}`}
                          >
                            <Video className="h-4 w-4 mr-1" />
                            {session.isLiveStreamed ? 'End Stream' : 'Start Stream'}
                          </button>
                          <button
                            onClick={() => handleRegisterForSession(session._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Register
                          </button>
                          <Link
                            to={`/sessions/${session._id}/edit`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteSession(session._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Materials section */}
                      {session.materials && session.materials.length > 0 && (
                        <div className="mt-4 pt-3 border-t">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Materials</h4>
                          <div className="flex flex-wrap gap-2">
                            {session.materials.map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Material {index + 1}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsPage;
