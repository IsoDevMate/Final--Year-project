// import { Types } from 'mongoose';
// import { v4 as uuidv4 } from 'uuid';
// import { Livestream, StreamStatus } from '../models/livestream.model';
// import { Event } from '../models/event.model';
// import { User } from '../models/user.model';
// import { AppError } from '../utils/errors.utils';
// import { CreateLivestreamDto, UpdateLivestreamDto, LivestreamQueryDto } from '../interfaces/livestream.interface';

// export class LivestreamService {
//   async createLivestream(streamerId: string, livestreamData: CreateLivestreamDto): Promise<Livestream> {
//     try {
//       // Validate event exists
//       if (!Types.ObjectId.isValid(livestreamData.eventId)) {
//         throw new AppError('Invalid event ID', 400);
//       }

//       const event = await Event.findById(livestreamData.eventId);
//       if (!event) {
//         throw new AppError('Event not found', 404);
//       }

//       // Validate session belongs to event
//       if (!Types.ObjectId.isValid(livestreamData.sessionId)) {
//         throw new AppError('Invalid session ID', 400);
//       }

//       // For now, we'll skip session validation since we don't have that model yet
//       // In a real implementation, you'd verify the session exists and belongs to the event

//       // Validate user exists
//       if (!Types.ObjectId.isValid(streamerId)) {
//         throw new AppError('Invalid streamer ID', 400);
//       }

//       const user = await User.findById(streamerId);
//       if (!user) {
//         throw new AppError('User not found', 404);
//       }

//       // Generate a unique room ID
//       const roomId = uuidv4();

//       const livestream = new Livestream({
//         ...livestreamData,
//         streamerId: new Types.ObjectId(streamerId),
//         roomId,
//         viewerCount: 0,
//         status: StreamStatus.SCHEDULED
//       });

//       await livestream.save();
//       return livestream;
//     } catch (error) {
//       if (error instanceof Error) {
//         throw new AppError(error.message, 400);
//       }
//       throw new AppError('Failed to create livestream', 500);
//     }
//   }

//   async getLivestreams(queryParams: LivestreamQueryDto): Promise<{
//     livestreams: Livestream[];
//     total: number;
//     page: number;
//     limit: number;
//   }> {
//     try {
//       const {
//         page = 1,
//         limit = 10,
//         eventId,
//         sessionId,
//         streamerId,
//         status,
//         startDate,
//         endDate
//       } = queryParams;

//       const skip = (page - 1) * limit;

//       // Build query filters
//       const filter: any = {};

//       if (eventId) {
//         if (!Types.ObjectId.isValid(eventId)) {
//           throw new AppError('Invalid event ID', 400);
//         }
//         filter.eventId = eventId;
//       }

//       if (sessionId) {
//         if (!Types.ObjectId.isValid(sessionId)) {
//           throw new AppError('Invalid session ID', 400);
//         }
//         filter.sessionId = sessionId;
//       }

//       if (streamerId) {
//         if (!Types.ObjectId.isValid(streamerId)) {
//           throw new AppError('Invalid streamer ID', 400);
//         }
//         filter.streamerId = streamerId;
//       }

//       if (status) {
//         filter.status = status;
//       }

//       // Date range filter for scheduled start time
//       if (startDate || endDate) {
//         filter.scheduledStartTime = {};
//         if (startDate) filter.scheduledStartTime.$gte = new Date(startDate);
//         if (endDate) filter.scheduledStartTime.$lte = new Date(endDate);
//       }

//       // Execute query with pagination
//       const livestreams = await Livestream.find(filter)
//         .sort({ scheduledStartTime: 1 })
//         .skip(skip)
//         .limit(limit)
//         .populate('streamerId', 'firstName lastName email profileImage')
//         .populate('eventId', 'title')
//         .populate('sessionId', 'title');

//       // Get total count for pagination
//       const total = await Livestream.countDocuments(filter);

//       return {
//         livestreams,
//         total,
//         page: Number(page),
//         limit: Number(limit)
//       };
//     } catch (error) {
//       if (error instanceof AppError) {
//         throw error;
//       }
//       throw new AppError('Failed to retrieve livestreams', 500);
//     }
//   }

//   async getLivestreamById(livestreamId: string): Promise<Livestream | null> {
//     try {
//       if (!Types.ObjectId.isValid(livestreamId)) {
//         throw new AppError('Invalid livestream ID', 400);
//       }

//       return await Livestream.findById(livestreamId)
//         .populate('streamerId', 'firstName lastName email profileImage')
//         .populate('eventId', 'title')
//         .populate('sessionId', 'title');
//     } catch (error) {
//       if (error instanceof AppError) {
//         throw error;
//       }
//       throw new AppError('Failed to retrieve livestream', 500);
//     }
//   }

//   async updateLivestream(livestreamId: string, streamerId: string, updateData: UpdateLivestreamDto): Promise<Livestream | null> {
//     try {
//       if (!Types.ObjectId.isValid(livestreamId)) {
//         throw new AppError('Invalid livestream ID', 400);
//       }

//       // Find the livestream
//       const livestream = await Livestream.findById(livestreamId);
//       if (!livestream) {
//         throw new AppError('Livestream not found', 404);
//       }

//       // Verify the user is the streamer
//       if (livestream.streamerId.toString() !== streamerId) {
//         throw new AppError('You do not have permission to update this livestream', 403);
//       }

//       // Apply updates
//       Object.assign(livestream, updateData);
//       await livestream.save();

//       return livestream;
//     } catch (error) {
//       if (error instanceof AppError) {
//         throw error;
//       }
//       if (error instanceof Error) {
//         throw new AppError(error.message, 400);
//             }
//             throw new AppError('Failed to update livestream', 500);
//         }
//     }


import { Server as WebSocketServer } from 'ws';
import { Server } from 'http';
import { Types } from 'mongoose';
import { Session } from '../models/session.model';
import { AppError } from '../utils/errors.utils';

interface StreamClient {
  id: string;
  userId: string;
  sessionId: string;
  role: 'broadcaster' | 'viewer';
  ws: any; // WebSocket instance
}

export class LiveStreamService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, StreamClient> = new Map();
  private sessions: Map<string, string> = new Map(); // sessionId -> broadcasterId

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: any) => {
      const clientId = this.generateClientId();

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(clientId, ws, data);
        } catch (error) {
          console.error('Error handling message:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });
    });

    console.log('WebRTC LiveStream service initialized');
  }

  private handleMessage(clientId: string, ws: any, data: any) {
    const { type, payload } = data;

    switch (type) {
      case 'join':
        this.handleJoin(clientId, ws, payload);
        break;
      case 'offer':
        this.handleOffer(clientId, payload);
        break;
      case 'answer':
        this.handleAnswer(clientId, payload);
        break;
      case 'ice-candidate':
        this.handleIceCandidate(clientId, payload);
        break;
      case 'leave':
        this.handleLeave(clientId);
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  }

  private async handleJoin(clientId: string, ws: any, payload: any) {
    const { sessionId, userId, role } = payload;

    if (!sessionId || !userId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Missing sessionId or userId' }));
      return;
    }

    // Verify if session exists
    try {
      if (!Types.ObjectId.isValid(sessionId)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid session ID' }));
        return;
      }

      const session = await Session.findById(sessionId);
      if (!session) {
        ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
        return;
      }

      // Create client
      const client: StreamClient = {
        id: clientId,
        userId,
        sessionId,
        role: role === 'broadcaster' ? 'broadcaster' : 'viewer',
        ws
      };

      this.clients.set(clientId, client);

      // Handle broadcaster
      if (client.role === 'broadcaster') {
        const currentBroadcasterId = this.sessions.get(sessionId);

        if (currentBroadcasterId) {
          // Check if the current broadcaster is still connected
          const broadcaster = this.clients.get(currentBroadcasterId);
          if (broadcaster) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Another broadcaster is already streaming this session'
            }));
            return;
          }
        }

        // Set this client as the broadcaster for the session
        this.sessions.set(sessionId, clientId);

        // Update the session in the database
        await Session.findByIdAndUpdate(sessionId, {
          isLiveStreamed: true
        });

        ws.send(JSON.stringify({
          type: 'joined',
          payload: {
            role: 'broadcaster',
            clientId,
            sessionId
          }
        }));

        // Notify all viewers that a new broadcaster has joined
        this.notifySessionParticipants(sessionId, {
          type: 'broadcaster-joined',
          payload: { sessionId }
        }, clientId);
      } else {
        // Handle viewer
        ws.send(JSON.stringify({
          type: 'joined',
          payload: {
            role: 'viewer',
            clientId,
            sessionId
          }
        }));

        // Notify the broadcaster that a new viewer has joined
        const broadcasterId = this.sessions.get(sessionId);
        if (broadcasterId) {
          const broadcaster = this.clients.get(broadcasterId);
          if (broadcaster) {
            broadcaster.ws.send(JSON.stringify({
              type: 'viewer-joined',
              payload: { clientId, sessionId }
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error handling join:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to join session' }));
    }
  }

  private handleOffer(clientId: string, payload: any) {
    const { targetId, offer } = payload;
    const client = this.clients.get(clientId);

    if (!client) return;

    const target = this.clients.get(targetId);
    if (!target) return;

    target.ws.send(JSON.stringify({
      type: 'offer',
      payload: {
        offer,
        clientId: client.id
      }
    }));
  }

  private handleAnswer(clientId: string, payload: any) {
    const { targetId, answer } = payload;
    const client = this.clients.get(clientId);

    if (!client) return;

    const target = this.clients.get(targetId);
    if (!target) return;

    target.ws.send(JSON.stringify({
      type: 'answer',
      payload: {
        answer,
        clientId: client.id
      }
    }));
  }

  private handleIceCandidate(clientId: string, payload: any) {
    const { targetId, candidate } = payload;
    const client = this.clients.get(clientId);

    if (!client) return;

    const target = this.clients.get(targetId);
    if (!target) return;

    target.ws.send(JSON.stringify({
      type: 'ice-candidate',
      payload: {
        candidate,
        clientId: client.id
      }
    }));
  }

  private async handleLeave(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // If the client is a broadcaster, update the session
    if (client.role === 'broadcaster') {
      const sessionId = client.sessionId;
      const currentBroadcasterId = this.sessions.get(sessionId);

      if (currentBroadcasterId === clientId) {
        this.sessions.delete(sessionId);

        // Update the session in the database
        await Session.findByIdAndUpdate(sessionId, {
          isLiveStreamed: false
        });

        // Notify all viewers that the broadcaster has left
        this.notifySessionParticipants(sessionId, {
          type: 'broadcaster-left',
          payload: { sessionId }
        }, clientId);
      }
    } else {
      // If the client is a viewer, notify the broadcaster
      const broadcasterId = this.sessions.get(client.sessionId);
      if (broadcasterId) {
        const broadcaster = this.clients.get(broadcasterId);
        if (broadcaster) {
          broadcaster.ws.send(JSON.stringify({
            type: 'viewer-left',
            payload: { clientId }
          }));
        }
      }
    }

    this.clients.delete(clientId);
  }

  private handleDisconnect(clientId: string) {
    this.handleLeave(clientId);
  }

  private notifySessionParticipants(sessionId: string, message: any, excludeClientId?: string) {
    for (const [id, client] of this.clients.entries()) {
      if (client.sessionId === sessionId && (!excludeClientId || id !== excludeClientId)) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getActiveStreams(): Promise<any[]> {
    const activeStreams = [];

    for (const [sessionId, broadcasterId] of this.sessions.entries()) {
      if (this.clients.has(broadcasterId)) {
        const session = await Session.findById(sessionId)
          .populate('event', 'title')
          .populate('speaker.userId', 'firstName lastName');

        if (session) {
          activeStreams.push({
            sessionId,
            title: session.title,
            event: session.event,
            speaker: session.speaker,
            viewerCount: this.getViewerCount(sessionId)
          });
        }
      }
    }

    return activeStreams;
  }

  private getViewerCount(sessionId: string): number {
    let count = 0;
    for (const client of this.clients.values()) {
      if (client.sessionId === sessionId && client.role === 'viewer') {
        count++;
      }
    }
    return count;
  }
}

export const livestreamService = new LiveStreamService();
