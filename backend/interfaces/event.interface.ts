import { EventType, EventStatus } from '../models/event.model';

export interface LocationDto {
  name: string;
  address: string;
  city: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface CreateEventDto {
  title: string;
  description: string;
  organizer: string;
  type: EventType;
  status: EventStatus;
  startDate: Date;
  endDate: Date;
  location: LocationDto;
  capacity?: number;
  ticketPrice?: number;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  type?: EventType;
  status?: EventStatus;
  startDate?: Date;
  endDate?: Date;
  location?: Partial<LocationDto>;
  capacity?: number;
  ticketPrice?: number;
}

export interface EventQueryDto {
  page?: number;
  limit?: number;
  title?: string;
  type?: EventType;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  city?: string;
  organizer?: string;
}
