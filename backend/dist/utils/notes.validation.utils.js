"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteShareSchema = exports.mediaAttachmentRemovalSchema = exports.mediaAttachmentUploadSchema = exports.noteQuerySchema = exports.updateNoteSchema = exports.createNoteSchema = exports.noteIdSchema = void 0;
const zod_1 = require("zod");
const mongoose_1 = require("mongoose");
const isValidObjectId = (id) => {
    return mongoose_1.Types.ObjectId.isValid(id);
};
// Media attachment validation schema
const mediaAttachmentSchema = zod_1.z.object({
    type: zod_1.z.enum(['image', 'audio', 'video', 'document']),
    url: zod_1.z.string().url('Invalid URL format'),
    fileName: zod_1.z.string().optional(),
    fileSize: zod_1.z.number().optional(),
    storageRef: zod_1.z.string().optional(),
    caption: zod_1.z.string().optional(),
});
// Note ID validation schema
exports.noteIdSchema = zod_1.z.object({
    id: zod_1.z.string().refine(isValidObjectId, {
        message: 'Invalid note ID format'
    })
});
// Create note validation schema
exports.createNoteSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
    content: zod_1.z.string().min(1, 'Content is required'),
    event: zod_1.z.string().refine(isValidObjectId, {
        message: 'Invalid event ID format'
    }),
    session: zod_1.z.string().refine(isValidObjectId, {
        message: 'Invalid session ID format'
    }).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isPrivate: zod_1.z.boolean().optional().default(true),
});
// Update note validation schema
exports.updateNoteSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters').optional(),
    content: zod_1.z.string().min(1, 'Content is required').optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isPrivate: zod_1.z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
});
// Query parameters validation schema
exports.noteQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    limit: zod_1.z.coerce.number().int().positive().optional().default(10),
    event: zod_1.z.string().refine(isValidObjectId, {
        message: 'Invalid event ID format'
    }).optional(),
    session: zod_1.z.string().refine(isValidObjectId, {
        message: 'Invalid session ID format'
    }).optional(),
    searchTerm: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isPrivate: zod_1.z.boolean().optional(),
});
// Media attachment validation schema
exports.mediaAttachmentUploadSchema = zod_1.z.object({
    noteId: zod_1.z.string().refine(isValidObjectId, {
        message: 'Invalid note ID format'
    }),
    fileType: zod_1.z.enum(['image', 'audio', 'video', 'document']),
    caption: zod_1.z.string().optional(),
});
// Media attachment removal validation schema
exports.mediaAttachmentRemovalSchema = zod_1.z.object({
    attachmentId: zod_1.z.string().refine(isValidObjectId, {
        message: 'Invalid attachment ID format'
    }),
});
// Note sharing validation schema
exports.noteShareSchema = zod_1.z.object({
    userIds: zod_1.z.array(zod_1.z.string().refine(isValidObjectId, {
        message: 'Invalid user ID format'
    })).min(1, 'At least one user ID is required'),
});
