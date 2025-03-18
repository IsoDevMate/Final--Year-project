import { SessionStatus } from '../models/session.model';

export interface SpeakerDto {
  name: string;
  bio?: string;
  profileImage?: string;
  organization?: string;
  position?: string;
  userId?: string;
}

export interface CreateSessionDto {
  title: string;
  description: string;
  event: string;
  speaker: SpeakerDto;
  startTime: Date;
  endTime: Date;
  location: string;
  capacity?: number;
  status: SessionStatus;
  tags?: string[];
  materials?: string[];
  isLiveStreamed: boolean;
  streamUrl?: string;
    attendees?: string[];
}
