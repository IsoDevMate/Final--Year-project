"use strict";
// import { Request, Response } from 'express';
// import { livestreamService } from '../services/livestream.service';
// import { AppError } from '../utils/errors.utils';
// import { Session } from '../models/session.model';
// import { Types } from 'mongoose';
// export class LiveStreamController {
//   static async getActiveStreams(req: Request, res: Response) {
//     try {
//       const activeStreams = await livestreamService.getActiveStreams();
//       return res.status(200).json({
//         success: true,
//         data: activeStreams,
//         message: 'Active streams retrieved successfully'
//       });
//     } catch (error) {
//       if (error instanceof AppError) {
//         return res.status(error.statusCode).json({
//           success: false,
//           message: error.message
//         });
//       }
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to retrieve active streams'
//       });
//     }
//   }
//   static async getStreamDetails(req: Request, res: Response) {
//     try {
//       const sessionId = req.params.sessionId;
//       if (!Types.ObjectId.isValid(sessionId)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid session ID'
//         });
//       }
//       const session = await Session.findById(sessionId)
//         .populate('event', 'title description')
//         .populate('speaker.userId', 'firstName lastName email profileImage');
//       if (!session) {
//         return res.status(404).json({
//           success: false,
//           message: 'Session not found'
//         });
//       }
//       // Generate ICE server configuration
//       const iceServers = [
//         { urls: 'stun:stun.l.google.com:19302' },
//         { urls: 'stun:stun1.l.google.com:19302' },
//         { urls: 'stun:stun2.l.google.com:19302' }
//         // Add TURN servers in production for better connectivity
//         // { urls: 'turn:your-turn-server.com', username: 'username', credential: 'credential' }
//       ];
//       return res.status(200).json({
//         success: true,
//         data: {
//           session,
//           rtcConfig: {
//             iceServers
//           }
//         },
//         message: 'Stream details retrieved successfully'
//       });
//     } catch (error) {
//       if (error instanceof AppError) {
//         return res.status(error.statusCode).json({
//           success: false,
//           message: error.message
//         });
//       }
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to retrieve stream details'
//       });
//     }
//   }
// }
