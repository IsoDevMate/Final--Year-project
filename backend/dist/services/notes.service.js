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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteService = exports.NoteService = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const note_model_1 = require("../models/note.model");
const errors_utils_1 = require("../utils/errors.utils");
const upload_service_1 = require("./upload.service");
class NoteService {
    constructor() {
        this.storageService = new upload_service_1.StorageService();
    }
    createNote(noteData, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const note = new note_model_1.Note(Object.assign(Object.assign({}, noteData), { user: new mongoose_1.Types.ObjectId(userId) }));
                yield note.save();
                return note;
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(error.message, 400);
                }
                throw new errors_utils_1.AppError('Failed to create note', 500);
            }
        });
    }
    getNotes(queryParams, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = 1, limit = 10, eventId, sessionId, searchTerm, tags, isPublic } = queryParams;
                const skip = (page - 1) * limit;
                // Build query filters
                const filter = {};
                // Users can see their own notes and notes shared with them
                filter.$or = [
                    { user: new mongoose_1.Types.ObjectId(userId) },
                    { isPrivate: false },
                    { sharedWith: { $in: [new mongoose_1.Types.ObjectId(userId)] } }
                ];
                if (eventId)
                    filter.event = new mongoose_1.Types.ObjectId(eventId);
                if (sessionId)
                    filter.sessionId = new mongoose_1.Types.ObjectId(sessionId);
                if (tags && tags.length > 0)
                    filter.tags = { $in: tags };
                if (isPublic !== undefined)
                    filter.isPrivate = !isPublic;
                // Text search if searchTerm is provided
                if (searchTerm) {
                    filter.$text = { $search: searchTerm };
                }
                // Execute query with pagination
                const notes = yield note_model_1.Note.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('user', 'firstName lastName email')
                    .populate('event', 'title')
                    .populate('session', 'title');
                // Get total count for pagination
                const total = yield note_model_1.Note.countDocuments(filter);
                return {
                    notes,
                    total,
                    page: Number(page),
                    limit: Number(limit)
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(error.message, 400);
                }
                throw new errors_utils_1.AppError('Failed to retrieve notes', 500);
            }
        });
    }
    getNoteById(noteId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!mongoose_1.Types.ObjectId.isValid(noteId)) {
                    throw new errors_utils_1.AppError('Invalid note ID', 400);
                }
                const note = yield note_model_1.Note.findById(noteId)
                    .populate('user', 'firstName lastName email')
                    .populate('event', 'title')
                    .populate('session', 'title');
                if (!note) {
                    throw new errors_utils_1.AppError('Note not found', 404);
                }
                // Ensure we're comparing string representations of ObjectIds
                const noteUserIdString = note.user instanceof mongoose_1.default.Types.ObjectId
                    ? note.user.toString()
                    : (note.user && typeof note.user === 'object' && '_id' in note.user) ? note.user._id.toString() : String(note.user);
                console.log('Detailed Debug:', {
                    noteId,
                    userId,
                    noteUserIdString,
                    isPrivate: note.isPrivate,
                    exactComparison: noteUserIdString === userId
                });
                const isOwner = noteUserIdString === userId;
                const isSharedWithUser = (_a = note.sharedWith) === null || _a === void 0 ? void 0 : _a.some(id => id.toString() === userId);
                const isPublic = !note.isPrivate;
                if (!(isOwner || isSharedWithUser || isPublic)) {
                    throw new errors_utils_1.AppError('You do not have permission to view this note', 403);
                }
                return note;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to retrieve note', 500);
            }
        });
    }
    updateNote(noteId, updateData, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(noteId)) {
                    throw new errors_utils_1.AppError('Invalid note ID', 400);
                }
                // Find the note first to check ownership
                const note = yield note_model_1.Note.findById(noteId);
                if (!note) {
                    throw new errors_utils_1.AppError('Note not found', 404);
                }
                // Check if user is the owner
                if (note.user.toString() !== userId) {
                    throw new errors_utils_1.AppError('You do not have permission to update this note', 403);
                }
                // Update the note
                const updatedNote = yield note_model_1.Note.findByIdAndUpdate(noteId, { $set: updateData }, { new: true, runValidators: true });
                return updatedNote;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(error.message, 400);
                }
                throw new errors_utils_1.AppError('Failed to update note', 500);
            }
        });
    }
    deleteNote(noteId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(noteId)) {
                    throw new errors_utils_1.AppError('Invalid note ID', 400);
                }
                // Find the note first to check ownership
                const note = yield note_model_1.Note.findById(noteId);
                if (!note) {
                    throw new errors_utils_1.AppError('Note not found', 404);
                }
                // Check if user is the owner
                if (note.user.toString() !== userId) {
                    throw new errors_utils_1.AppError('You do not have permission to delete this note', 403);
                }
                // Delete all attached media files from storage
                if (note.mediaAttachments && note.mediaAttachments.length > 0) {
                    for (const attachment of note.mediaAttachments) {
                        if (attachment.storageRef) {
                            yield this.storageService.deleteFile(attachment.storageRef);
                        }
                    }
                }
                yield note_model_1.Note.findByIdAndDelete(noteId);
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to delete note', 500);
            }
        });
    }
    addMediaAttachment(noteId, userId, file, fileName, fileType, caption) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(noteId)) {
                    throw new errors_utils_1.AppError('Invalid note ID', 400);
                }
                // Find the note first to check ownership
                const note = yield note_model_1.Note.findById(noteId);
                if (!note) {
                    throw new errors_utils_1.AppError('Note not found', 404);
                }
                // Check if user is the owner
                if (note.user.toString() !== userId) {
                    throw new errors_utils_1.AppError('You do not have permission to update this note', 403);
                }
                // Upload file to Firebase Storage
                const uploadedFile = yield this.storageService.uploadFile(file, fileName, userId, fileType);
                // Add attachment to note
                const newAttachment = {
                    type: fileType,
                    url: uploadedFile.url,
                    storageRef: uploadedFile.storageRef,
                    fileName: uploadedFile.fileName,
                    fileSize: uploadedFile.fileSize,
                    caption: caption || '',
                    createdAt: new Date()
                };
                if (!note.mediaAttachments) {
                    note.mediaAttachments = [];
                }
                note.mediaAttachments.push(newAttachment);
                yield note.save();
                return note;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(error.message, 400);
                }
                throw new errors_utils_1.AppError('Failed to add media attachment', 500);
            }
        });
    }
    removeMediaAttachment(noteId, attachmentId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(noteId)) {
                    throw new errors_utils_1.AppError('Invalid note ID', 400);
                }
                // Find the note first to check ownership
                const note = yield note_model_1.Note.findById(noteId);
                if (!note) {
                    throw new errors_utils_1.AppError('Note not found', 404);
                }
                // Check if user is the owner
                if (note.user.toString() !== userId) {
                    throw new errors_utils_1.AppError('You do not have permission to update this note', 403);
                }
                // Check if note has any attachments
                if (!note.mediaAttachments || note.mediaAttachments.length === 0) {
                    throw new errors_utils_1.AppError('No attachments found', 404);
                }
                // Find the attachment
                const attachmentIndex = note.mediaAttachments.findIndex(attachment => { var _a; return ((_a = attachment._id) === null || _a === void 0 ? void 0 : _a.toString()) === attachmentId; });
                if (attachmentIndex === -1) {
                    throw new errors_utils_1.AppError('Attachment not found', 404);
                }
                // Get storage reference before removing from array
                const storageRef = note.mediaAttachments[attachmentIndex].storageRef;
                // Remove attachment from note
                note.mediaAttachments.splice(attachmentIndex, 1);
                yield note.save();
                // Delete file from storage
                if (storageRef) {
                    yield this.storageService.deleteFile(storageRef);
                }
                return note;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to remove media attachment', 500);
            }
        });
    }
    shareNote(noteId, shareWithUserIds, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(noteId)) {
                    throw new errors_utils_1.AppError('Invalid note ID', 400);
                }
                // Find the note first to check ownership
                const note = yield note_model_1.Note.findById(noteId);
                if (!note) {
                    throw new errors_utils_1.AppError('Note not found', 404);
                }
                // Check if user is the owner
                if (note.user.toString() !== userId) {
                    throw new errors_utils_1.AppError('You do not have permission to share this note', 403);
                }
                // Convert string IDs to ObjectIds and validate they exist
                const validUserIds = shareWithUserIds.filter(id => mongoose_1.Types.ObjectId.isValid(id))
                    .map(id => new mongoose_1.Types.ObjectId(id));
                // Update the sharedWith
                if (!note.sharedWith) {
                    note.sharedWith = [];
                }
                note.sharedWith = [...new Set([...note.sharedWith, ...validUserIds])];
                yield note.save();
                return note;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to share note', 500);
            }
        });
    }
    unshareNote(noteId, unshareWithUserIds, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(noteId)) {
                    throw new errors_utils_1.AppError('Invalid note ID', 400);
                }
                // Find the note first to check ownership
                const note = yield note_model_1.Note.findById(noteId);
                if (!note) {
                    throw new errors_utils_1.AppError('Note not found', 404);
                }
                // Check if user is the owner
                if (note.user.toString() !== userId) {
                    throw new errors_utils_1.AppError('You do not have permission to unshare this note', 403);
                }
                // Convert string IDs to ObjectIds and validate they exist
                const validUserIds = unshareWithUserIds.filter(id => mongoose_1.Types.ObjectId.isValid(id))
                    .map(id => new mongoose_1.Types.ObjectId(id));
                // Remove users from sharedWith array
                if (note.sharedWith && note.sharedWith.length > 0) {
                    note.sharedWith = note.sharedWith.filter(userId => !validUserIds.some(id => id.toString() === userId.toString()));
                    yield note.save();
                }
                return note;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to unshare note', 500);
            }
        });
    }
}
exports.NoteService = NoteService;
exports.noteService = new NoteService();
