import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface Event {
  _id: string;
  title: string;
  description: string;
  ateendees: string[];
  location: string;
  startDate: string;
  endDate: string;
}

interface EventSelectorProps {
  onEventSelect: (eventId: string) => void;
  selectedEventId?: string;
}

export const EventSelector: React.FC<EventSelectorProps> = ({
  onEventSelect,
  selectedEventId
}) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'https://final-year-project-56d5.onrender.com';

   const fetchRegisteredEvents = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/v1/events/registered`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setEvents(response.data.data);
              // If no event is selected and there are events, auto-select the first one
        if (!selectedEventId && response.data.length > 0) {
          onEventSelect(response.data.data[0]._id);
        }
      } else {
        setError('Failed to fetch events');
      }
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError('Could not load events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    fetchRegisteredEvents();
  }, []);

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onEventSelect(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <span className="animate-pulse">Loading events...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No registered events found
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <select
        value={selectedEventId || ''}
        onChange={handleEventChange}
        className="w-full p-2 border rounded-md appearance-none bg-white"
      >
        {events.map(event => (
          <option key={event._id} value={event._id}>
            {event.title} ({new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <ChevronDown size={20} />
      </div>
    </div>
  );
};
