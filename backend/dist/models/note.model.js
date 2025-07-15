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
exports.Note = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const noteSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    session: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Session'
    },
    mediaAttachments: [{
            type: {
                type: String,
                enum: ['image', 'audio', 'video', 'document'],
                required: true
            },
            url: {
                type: String,
                required: true
            },
            caption: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
    tags: [{
            type: String
        }],
    isPrivate: {
        type: Boolean,
        default: true
    },
    sharedWith: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
}, {
    timestamps: true
});
// Indexes for efficient queries
noteSchema.index({ user: 1, event: 1 });
noteSchema.index({ session: 1 });
noteSchema.index({ title: 'text', content: 'text', tags: 'text' });
exports.Note = mongoose_1.default.model('Note', noteSchema);
