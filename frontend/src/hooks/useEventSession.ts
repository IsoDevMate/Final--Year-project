// hooks/useEventSessions.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '../contexts/EventContext';
import { useSession } from '../contexts/SessionContext';
import * as apiService from '../services/api-service';

export const useEventSessions = (eventId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { currentEvent, setCurrentEvent, eventList, setEventList } = useEvent();
  const { sessionList, setSessionList } = useSession();

  // Load event and its sessions if eventId is provided
  useEffect(() => {
    if (eventId) {
      loadEventWithSessions(eventId);
    }
  }, [eventId]);

  // Function to load an event and its sessions
  const loadEventWithSessions = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch event details
      const eventResult = await apiService.fetchEventById(id);
      if (eventResult.success) {
        setCurrentEvent(eventResult.data);

        // Fetch sessions for this event
        const sessionsResult = await apiService.fetchSessionsByEventId(id);
        if (sessionsResult.success) {
          setSessionList(sessionsResult.data);
        } else {
          setError('Failed to fetch sessions');
        }
      } else {
        setError('Failed to fetch event details');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to event's sessions page
  const goToEventSessions = (id: string) => {
    navigate(`/events/${id}/sessions`);
  };

  // Navigate back to event details from sessions
  const goBackToEvent = () => {
    if (currentEvent) {
      navigate(`/events/${currentEvent._id}`);
    } else if (eventId) {
      navigate(`/events/${eventId}`);
    } else {
      navigate('/dashboard/events');
    }
  };

  // Navigate to create a new session for an event
  const goToCreateSession = (id: string) => {
    navigate(`/events/${id}/sessions/create`);
  };

  // Delete an event and navigate back to events list
  const deleteEventAndNavigate = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setIsLoading(true);
      try {
        const result = await apiService.deleteEvent(id);
        if (result.success) {
          // Update event list in context
          setEventList(prevEvents => prevEvents.filter(event => event._id !== id));
          navigate('/dashboard/events');
        } else {
          setError('Failed to delete event');
        }
      } catch (err) {
        setError('An error occurred while deleting the event');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Delete a session and update the session list
  const deleteSessionAndUpdate = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      setIsLoading(true);
      try {
        const result = await apiService.deleteSession(sessionId);
        if (result.success) {
          // Update session list in context and state
          setSessionList(prevSessions => prevSessions.filter(session => session._id !== sessionId));
        } else {
          setError('Failed to delete session');
        }
      } catch (err) {
        setError('An error occurred while deleting the session');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return {
    isLoading,
    error,
    currentEvent,
    sessionList,
    loadEventWithSessions,
    goToEventSessions,
    goBackToEvent,
    goToCreateSession,
    deleteEventAndNavigate,
    deleteSessionAndUpdate,
    setError
  };
};
