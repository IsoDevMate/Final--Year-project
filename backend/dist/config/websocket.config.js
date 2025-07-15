"use strict";
// import * as WebSocket from 'ws';
// import { Server } from 'http';
// import jwt from 'jsonwebtoken';
// import { UserRole } from '../models/user.model';
// import { Livestream, LivestreamStatus } from '../models/livestream.model';
// import { ChatMessage } from '../models/chat-message.model';
// import config from '../config/config';
// interface AuthenticatedClient extends WebSocket {
//   userId: string;
//   username: string;
//   role: UserRole;
//   livestreamId?: string;
//   isAlive: boolean;
// }
// export class WebSocketServer {
//   private wss: WebSocket.Server;
//   private rooms: Map<string, Set<AuthenticatedClient>> = new Map();
//   constructor(server: Server) {
//     this.wss = new WebSocket.Server({ server });
//     this.initialize();
//   }
//   private initialize() {
//     this.wss.on('connection', (ws: WebSocket, req) => {
//       const client = ws as AuthenticatedClient;
//       client.isAlive = true;
//       // Extract token from query parameter
//       const url = new URL(req.url || '', `http://${req.headers.host}`);
//       const token = url.searchParams.get('token');
//       const livestreamId = url.searchParams.get('livestreamId');
//       if (!token) {
//         client.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
//         client.terminate();
//         return;
//       }
//       // Verify JWT token
//       try {
//         const decoded = jwt.verify(token, config.jwt.accessTokenSecret as string) as {
//           userId: string;
//           email: string;
//           role: UserRole;
//           firstName?: string;
//           lastName?: string;
//         };
//         client.userId = decoded.userId;
//         client.username = `${decoded.firstName || ''} ${decoded.lastName || ''}`.trim() || decoded.email;
//         client.role = decoded.role;
//         if (livestreamId) {
//           client.livestreamId = livestreamId;
//           this.joinRoom(client, livestreamId);
//         }
//         // Handle ping/pong for connection health check
//         client.on('pong', () => {
//           client.isAlive = true;
//         });
//         // Handle messages
//         client.on('message', async (message: string) => {
//           try {
//             const parsedMessage = JSON.parse(message);
//             await this.handleMessage(client, parsedMessage);
//           } catch (error) {
//             client.send(JSON.stringify({
//               type: 'error',
//               message: 'Invalid message format'
//             }));
//           }
//         });
//         // Handle disconnection
//         client.on('close', () => {
//           if (client.livestreamId) {
//             this.leaveRoom(client, client.livestreamId);
//           }
//         });
//         // Send welcome message
//         client.send(JSON.stringify({
//           type: 'connection',
//           message: 'Connected to ComfyBase livestream server',
//           userId: client.userId,
//           username: client.username,
//           role: client.role
//         }));
//       } catch (error) {
//         client.send(JSON.stringify({ type: 'error', message: 'Invalid authentication token' }));
//         client.terminate();
//       }
//     });
//     // Set up interval to check for dead connections
//     const interval = setInterval(() => {
//       this.wss.clients.forEach((ws) => {
//         const client = ws as AuthenticatedClient;
//         if (client.isAlive === false) return client.terminate();
//         client.isAlive = false;
//         client.ping();
//       });
//     }, 30000);
//     this.wss.on('close', () => {
//       clearInterval(interval);
//     });
//   }
//   private async handleMessage(client: AuthenticatedClient, data: any) {
//     const { type, livestreamId, content } = data;
//     if (!type || !livestreamId) {
//       client.send(JSON.stringify({
//         type: 'error',
//         message: 'Invalid message format. Must include type and livestreamId.'
//       }));
//       return;
//     }
//     // Verify the livestream exists and is active
//     try {
//       const livestream = await Livestream.findById(livestreamId);
//       if (!livestream) {
//         client.send(JSON.stringify({
//           type: 'error',
//           message: 'Livestream not found'
//         }));
//         return;
//       }
//       switch (type) {
//         case 'join':
//           this.joinRoom(client, livestreamId);
//           break;
//         case 'leave':
//           this.leaveRoom(client, livestreamId);
//           break;
//         case 'chat':
//           if (!content) {
//             client.send(JSON.stringify({
//               type: 'error',
//               message: 'Chat message cannot be empty'
//             }));
//             return;
//           }
//           // Store chat message in database
//           const chatMessage = new ChatMessage({
//             livestreamId,
//             userId: client.userId,
//             message: content,
//             timestamp: new Date()
//           });
//           await chatMessage.save();
//           // Broadcast to all clients in the room
//           this.broadcastToRoom(livestreamId, {
//             type: 'chat',
//             userId: client.userId,
//             username: client.username,
//             content,
//             timestamp: new Date()
//           });
//           break;
//         case 'stream_status':
//           // Only host or admin can update stream status
//           if (livestream.hostId.toString() !== client.userId && client.role !== UserRole.ADMIN) {
//             client.send(JSON.stringify({
//               type: 'error',
//               message: 'Unauthorized to update stream status'
//             }));
//             return;
//           }
//           const { status } = data;
//           if (!status || !Object.values(LivestreamStatus).includes(status)) {
//             client.send(JSON.stringify({
//               type: 'error',
//               message: 'Invalid stream status'
//             }));
//             return;
//           }
//           // Update livestream status
//           await this.updateLivestreamStatus(livestreamId, status as LivestreamStatus);
//           // Broadcast status change to all clients in the room
//           this.broadcastToRoom(livestreamId, {
//             type: 'stream_status',
//             status,
//             updatedAt: new Date()
//           });
//           break;
//         default:
//           client.send(JSON.stringify({
//             type: 'error',
//             message: 'Unknown message type'
//           }));
//       }
//     } catch (error) {
//       console.error('Error handling WebSocket message:', error);
//       client.send(JSON.stringify({
//         type: 'error',
//         message: 'Server error processing request'
//       }));
//     }
//   }
//   private joinRoom(client: AuthenticatedClient, livestreamId: string) {
//     // Add client to room
//     if (!this.rooms.has(livestreamId)) {
//       this.rooms.set(livestreamId, new Set());
//     }
//     this.rooms.get(livestreamId)?.add(client);
//     client.livestreamId = livestreamId;
//     // Notify client they've joined
//     client.send(JSON.stringify({
//       type: 'room_joined',
//       livestreamId,
//       participants: this.getParticipantCount(livestreamId)
//     }));
//     // Notify others about new participant
//     this.broadcastToRoom(livestreamId, {
//       type: 'participant_joined',
//       userId: client.userId,
//       username: client.username,
//       participants: this.getParticipantCount(livestreamId)
//     }, [client]);
//     // Update viewers count in database
//     this.updateViewersCount(livestreamId);
//   }
//   private leaveRoom(client: AuthenticatedClient, livestreamId: string) {
//     const room = this.rooms.get(livestreamId);
//     if (room) {
//       room.delete(client);
//       // Clean up empty rooms
//       if (room.size === 0) {
//         this.rooms.delete(livestreamId);
//       } else {
//         // Notify others about participant leaving
//         this.broadcastToRoom(livestreamId, {
//           type: 'participant_left',
//           userId: client.userId,
//           username: client.username,
//           participants: this.getParticipantCount(livestreamId)
//         });
//       }
//     }
//     client.livestreamId = undefined;
//     // Update viewers count in database
//     this.updateViewersCount(livestreamId);
//   }
//   private broadcastToRoom(roomId: string, message: any, exclude: AuthenticatedClient[] = []) {
//     const room = this.rooms.get(roomId);
//     if (room) {
//       const serializedMessage = JSON.stringify(message);
//       room.forEach(client => {
//         if (!exclude.includes(client) && client.readyState === WebSocket.OPEN) {
//           client.send(serializedMessage);
//         }
//       });
//     }
//   }
//   private getParticipantCount(roomId: string): number {
//     return this.rooms.get(roomId)?.size || 0;
//   }
//   private async updateViewersCount(livestreamId: string) {
//     try {
//       const participants = this.getParticipantCount(livestreamId);
//       await Livestream.findByIdAndUpdate(livestreamId, {
//         $set: { viewersCount: participants }
//       });
//     } catch (error) {
//       console.error('Error updating viewers count:', error);
//     }
//   }
//   private async updateLivestreamStatus(livestreamId: string, status: LivestreamStatus) {
//     try {
//       const updates: any = { status };
//       // Set timestamps based on status
//       if (status === LivestreamStatus.LIVE) {
//         updates.actualStartTime = new Date();
//       } else if (status === LivestreamStatus.ENDED) {
//         updates.endTime = new Date();
//       }
//       await Livestream.findByIdAndUpdate(livestreamId, { $set: updates });
//     } catch (error) {
//       console.error('Error updating livestream status:', error);
//     }
//   }
// }
