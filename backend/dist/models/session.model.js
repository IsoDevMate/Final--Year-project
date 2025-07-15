"use strict";
// import mongoose, { Document, Schema } from 'mongoose';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = exports.StreamType = exports.SessionStatus = void 0;
// export enum SessionStatus {
//   SCHEDULED = 'scheduled',
//   ONGOING = 'ongoing',
//   COMPLETED = 'completed',
//   CANCELLED = 'cancelled'
// }
// export interface Session extends Document {
//   title: string;
//   description: string;
//   event: mongoose.Types.ObjectId;
//   speaker: {
//     name: string;
//     bio?: string;
//     profileImage?: string;
//     organization?: string;
//     position?: string;
//     userId?: mongoose.Types.ObjectId;
//   };
//   startTime: Date;
//   endTime: Date;
//   location: string;
//   capacity?: number;
//   status: SessionStatus;
//   tags?: string[];
//   materials?: string[];
//   isLiveStreamed: boolean;
//   streamUrl?: string;
//   attendees: mongoose.Types.ObjectId[];
//   createdAt: Date;
//   updatedAt: Date;
// }
// const sessionSchema = new Schema<Session>(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true
//     },
//     description: {
//       type: String,
//       required: true
//     },
//     event: {
//       type: Schema.Types.ObjectId,
//       ref: 'Event',
//       required: true
//     },
//     speaker: {
//       name: {
//         type: String,
//         required: true
//       },
//       bio: String,
//       profileImage: String,
//       organization: String,
//       position: String,
//       userId: {
//         type: Schema.Types.ObjectId,
//         ref: 'User'
//       }
//     },
//     startTime: {
//       type: Date,
//       required: true
//     },
//     endTime: {
//       type: Date,
//       required: true
//     },
//     location: {
//       type: String,
//       required: true
//     },
//     capacity: {
//       type: Number
//     },
//     status: {
//       type: String,
//       enum: Object.values(SessionStatus),
//       default: SessionStatus.SCHEDULED
//     },
//     tags: [{
//       type: String
//     }],
//     materials: [{
//       type: String
//     }],
//     isLiveStreamed: {
//       type: Boolean,
//       default: false
//     },
//     streamUrl: {
//       type: String
//     },
//     attendees: [{
//       type: Schema.Types.ObjectId,
//       ref: 'User'
//     }]
//   },
//   {
//     timestamps: true
//   }
// );
// // Indexes for efficient queries
// sessionSchema.index({ startTime: 1 });
// sessionSchema.index({ event: 1 });
// sessionSchema.index({ title: 'text', description: 'text' });
// export const Session = mongoose.model<Session>('Session', sessionSchema);
const mongoose_1 = __importStar(require("mongoose"));
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["SCHEDULED"] = "scheduled";
    SessionStatus["ONGOING"] = "ongoing";
    SessionStatus["COMPLETED"] = "completed";
    SessionStatus["CANCELLED"] = "cancelled";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
var StreamType;
(function (StreamType) {
    StreamType["WEBRTC"] = "webrtc";
    StreamType["EXTERNAL"] = "external";
})(StreamType || (exports.StreamType = StreamType = {}));
const sessionSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    event: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    speaker: {
        name: {
            type: String,
            required: true
        },
        bio: String,
        profileImage: String,
        organization: String,
        position: String,
        userId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    capacity: {
        type: Number
    },
    status: {
        type: String,
        enum: Object.values(SessionStatus),
        default: SessionStatus.SCHEDULED
    },
    tags: [{
            type: String
        }],
    materials: [{
            type: String
        }],
    isLiveStreamed: {
        type: Boolean,
        default: false
    },
    streamType: {
        type: String,
        enum: Object.values(StreamType),
        default: StreamType.WEBRTC
    },
    streamUrl: {
        type: String
    },
    streamConfig: {
        isPrivate: {
            type: Boolean,
            default: false
        },
        requiresPayment: {
            type: Boolean,
            default: false
        },
        price: {
            type: Number
        }
    },
    attendees: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }]
}, {
    timestamps: true
});
// Indexes for efficient queries
sessionSchema.index({ startTime: 1 });
sessionSchema.index({ event: 1 });
sessionSchema.index({ title: 'text', description: 'text' });
sessionSchema.index({ isLiveStreamed: 1 });
exports.Session = mongoose_1.default.model('Session', sessionSchema);
