import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Loader, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Interface definitions (reusing from EventsPage)
interface Location {
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  country: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  type: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  startDate: string;
  endDate: string;
  location: Location;
  capacity?: number;
  coverImage?: string;
  organizer: string | { _id: string; firstName: string; lastName: string; email: string };
  attendees: string[] | unknown;
  isPublic: boolean;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

const MyEventsPage = () => {
  const { user } = useAuth();
  const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingEvents, setCancellingEvents] = useState<Record<string, boolean>>({});

  // Fetch registered events
  useEffect(() => {
    const fetchRegisteredEvents = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Authentication token not found');
          return;
        }

        // Fetch all events first
          const response = await axios.get('https://final-year-project-jy2j.onrender.com/api/v1/events/registered', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const myuserId = user.userId;
        console.log('User ID:', myuserId); // Log the user ID
        if (response.data.success) {
          // Filter events where user is an attendee
          const allEvents = response.data.data;
          console.log('My Events:', allEvents); // Log all events
          setRegisteredEvents(allEvents);
        } else {
          setError('Failed to fetch events');
        }
      } catch (err) {
        setError('An error occurred while fetching your registered events');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegisteredEvents();
  }, [user]);

  // Handle unregister from event
const handleUnregister = async (eventId: string) => {
  if (!user) return;

  if (window.confirm('Are you sure you want to cancel your registration for this event?')) {
    try {
      setCancellingEvents(prev => ({ ...prev, [eventId]: true }));

      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      const response = await axios.delete(`https://final-year-project-jy2j.onrender.com/api/v1/events/register/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        // Remove event from state
        setRegisteredEvents(prev => prev.filter(event => event._id !== eventId));
        toast.success('Successfully unregistered from the event');
      } else {
        toast.error('Failed to unregister from the event');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred while unregistering';
      toast.error(errorMessage);
    } finally {
      setCancellingEvents(prev => ({ ...prev, [eventId]: false }));
    }
  }
};

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate days until event
  const getDaysUntilEvent = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Past event';
    if (diffDays === 0) return 'Today!';
    if (diffDays === 1) return 'Tomorrow!';
    return `${diffDays} days away`;
  };

  // Get status badge with color
  const getStatusBadge = (status: string) => {
    let badgeColor = '';
    let icon = null;

    switch (status) {
      case 'published':
        badgeColor = 'bg-green-100 text-green-800';
        icon = <CheckCircle className="w-4 h-4 mr-1" />;
        break;
      case 'cancelled':
        badgeColor = 'bg-red-100 text-red-800';
        icon = <AlertCircle className="w-4 h-4 mr-1" />;
        break;
      case 'completed':
        badgeColor = 'bg-blue-100 text-blue-800';
        icon = <CheckCircle className="w-4 h-4 mr-1" />;
        break;
      default:
        badgeColor = 'bg-gray-100 text-gray-800';
        icon = <Calendar className="w-4 h-4 mr-1" />;
    }

    return (
      <span className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <Loader className="h-8 w-8 text-tiffany-600 animate-spin" />
          <p className="mt-4 text-gray-600">Loading your events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Error Loading Events</h3>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-tiffany-600 hover:bg-tiffany-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tiffany-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Registered Events</h1>
        <Link
          to="/dashboard/events"
          className="flex items-center text-tiffany-600 hover:text-tiffany-800"
        >
          <Calendar className="h-5 w-5 mr-2" />
          Browse Events
        </Link>
      </div>

      {/* Registered Events */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {registeredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No registered events</h3>
            <p className="mt-2 text-sm text-gray-500">You haven't registered for any events yet.</p>
            <Link
              to="/events"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-tiffany-600 hover:bg-tiffany-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tiffany-500"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registeredEvents.map((event) => (
              <div key={event._id} className="border rounded-lg overflow-hidden flex flex-col">
                {/* Event Image/Cover */}
                <div className="h-40 bg-gray-200 relative">
                  {event.coverImage ? (
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-tiffany-100">
                      <Calendar className="h-16 w-16 text-tiffany-400" />
                    </div>
                  )}

                  {/* Countdown badge */}
                  <div className="absolute top-2 right-2 bg-white py-1 px-2 rounded-full text-xs font-medium shadow">
                    {getDaysUntilEvent(event.startDate)}
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-4 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
                    {getStatusBadge(event.status)}
                  </div>

                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(event.startDate)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {event.location.name}, {event.location.city}
                    </div>
                  </div>
                </div>

                Actions
                <div className="border-t px-4 py-3 bg-gray-50 flex justify-between">
                  {/* <Link
                    to={`/events/${event._id}`}
                    className="text-tiffany-600 hover:text-tiffany-800 text-sm font-medium flex items-center"
                  >
                    View Details
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </Link> */}

                  <button
                    onClick={() => handleUnregister(event._id)}
                    disabled={cancellingEvents[event._id]}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    {cancellingEvents[event._id] ? (
                      <>
                        <Loader className="h-4 w-4 inline animate-spin mr-1" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Registration'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEventsPage;

