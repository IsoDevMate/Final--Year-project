"use strict";
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
exports.Livestream = exports.StreamStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var StreamStatus;
(function (StreamStatus) {
    StreamStatus["SCHEDULED"] = "scheduled";
    StreamStatus["LIVE"] = "live";
    StreamStatus["ENDED"] = "ended";
    StreamStatus["CANCELLED"] = "cancelled";
})(StreamStatus || (exports.StreamStatus = StreamStatus = {}));
const livestreamSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    sessionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    eventId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    streamerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: Object.values(StreamStatus),
        default: StreamStatus.SCHEDULED
    },
    scheduledStartTime: {
        type: Date,
        required: true
    },
    actualStartTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    viewerCount: {
        type: Number,
        default: 0
    },
    thumbnailUrl: {
        type: String
    },
    roomId: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
});
// Indexes for efficient queries
livestreamSchema.index({ eventId: 1 });
livestreamSchema.index({ sessionId: 1 });
livestreamSchema.index({ streamerId: 1 });
livestreamSchema.index({ status: 1 });
livestreamSchema.index({ scheduledStartTime: 1 });
exports.Livestream = mongoose_1.default.model('Livestream', livestreamSchema);
