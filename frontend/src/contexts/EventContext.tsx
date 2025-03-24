import React, { createContext, useContext, useState, ReactNode } from 'react';

export enum EventType {
  CONFERENCE = 'conference',
  SEMINAR = 'seminar',
  WORKSHOP = 'workshop',
  EXPO = 'expo',
  OTHER = 'other'
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

interface Event {
  _id: string;
  title: string;
    // Add other event properties as needed
  description: string;
  organizer: string;
  type: EventType;
  status: EventStatus;
  startDate: Date;
  endDate: Date;
   location: {
    name: string;
    address: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  capacity?: number;
  ticketPrice?: number
    }
    sessions: string[];
    attendees: string[];
    createdAt: Date;
    updatedAt: Date;
}

interface EventContextType {
  currentEvent: Event | null;
  setCurrentEvent: (event: Event | null) => void;
  eventList: Event[];
  setEventList: (events: Event[]) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [eventList, setEventList] = useState<Event[]>([]);

  return (
    <EventContext.Provider
      value={{
        currentEvent,
        setCurrentEvent,
        eventList,
        setEventList
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = (): EventContextType => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};
