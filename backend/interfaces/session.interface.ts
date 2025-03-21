// import { SessionStatus } from '../models/session.model';

// export interface SpeakerDto {
//   name: string;
//   bio?: string;
//   profileImage?: string;
//   organization?: string;
//   position?: string;
//   userId?: string;
// }

// export interface CreateSessionDto {
//   title: string;
//   description: string;
//   event: string;
//   speaker: SpeakerDto;
//   startTime: Date;
//   endTime: Date;
//   location: string;
//   capacity?: number;
//   status: SessionStatus;
//   tags?: string[];
//   materials?: string[];
//   isLiveStreamed?: boolean;
//   streamUrl?: string;
//     attendees?: string[];
// }


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
  isLiveStreamed?: boolean;
  streamUrl?: string;
  attendees?: string[];
}

export interface UpdateSessionDto {
  title?: string;
  description?: string;
  speaker?: SpeakerDto;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  capacity?: number;
  status?: SessionStatus;
  tags?: string[];
  isLiveStreamed?: boolean;
  streamUrl?: string;
}

export interface SessionQueryDto {
  page?: number;
  limit?: number;
  title?: string;
  event?: string;
  speaker?: string;
  status?: SessionStatus;
  startDate?: string;
  endDate?: string;
  isLiveStreamed?: boolean;
  tags?: string[];
}

export interface SessionMaterialDto {
  title?: string;
  url: string;
  type?: string;
}
