"use strict";
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
exports.NoteController = void 0;
const zod_1 = require("zod");
const notes_service_1 = require("../services/notes.service");
const notes_validation_utils_1 = require("../utils/notes.validation.utils");
const response_utils_1 = require("../utils/response.utils");
const errors_utils_1 = require("../utils/errors.utils");
class NoteController {
    static createNote(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedData = notes_validation_utils_1.createNoteSchema.parse(req.body);
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                // Get user ID from request (set by auth middleware)
                const userId = req.user.userId;
                const noteData = Object.assign(Object.assign({}, validatedData), { eventId: validatedData.event });
                const note = yield NoteController.noteService.createNote(noteData, userId);
                return response_utils_1.ResponseUtil.success(res, 201, note, 'Note created successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    static getNotes(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedQuery = notes_validation_utils_1.noteQuerySchema.parse(req.query);
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const notes = yield this.noteService.getNotes(validatedQuery, userId);
                return response_utils_1.ResponseUtil.success(res, 200, notes, 'Notes retrieved successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    // static async getNoteById(req: Request, res: Response, next: NextFunction) {
    //   try {
    //     const { id } = noteIdSchema.parse(req.params);
    //     // Check if user object exists (should be set by auth middleware)
    //     if (!req.user) {
    //       return ResponseUtil.error(res, 401, 'Not authenticated');
    //     }
    //     const userId = (req.user as any).userId;
    //     const note = await this.noteService.getNoteById(id, userId);
    //     if (!note) {
    //       return ResponseUtil.error(res, 404, 'Note not found');
    //     }
    //     return ResponseUtil.success(res, 200, note, 'Note retrieved successfully');
    //   } catch (error) {
    //     if (error instanceof ZodError) {
    //       return ResponseUtil.error(res, 400, error.errors[0].message);
    //     }
    //     next(error);
    //   }
    // }
    static getNoteById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = notes_validation_utils_1.noteIdSchema.parse(req.params);
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                try {
                    const note = yield this.noteService.getNoteById(id, userId);
                    return response_utils_1.ResponseUtil.success(res, 200, note, 'Note retrieved successfully');
                }
                catch (error) {
                    if (error instanceof errors_utils_1.AppError) {
                        return response_utils_1.ResponseUtil.error(res, error.statusCode || 500, error.message);
                    }
                    throw error;
                }
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    static updateNote(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = notes_validation_utils_1.noteIdSchema.parse(req.params);
                const validatedData = notes_validation_utils_1.updateNoteSchema.parse(req.body);
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const updatedNote = yield this.noteService.updateNote(id, validatedData, userId);
                return response_utils_1.ResponseUtil.success(res, 200, updatedNote, 'Note updated successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    static deleteNote(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = notes_validation_utils_1.noteIdSchema.parse(req.params);
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                yield this.noteService.deleteNote(id, userId);
                return response_utils_1.ResponseUtil.success(res, 200, null, 'Note deleted successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    static uploadAttachment(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = notes_validation_utils_1.noteIdSchema.parse(req.params);
                if (!req.file) {
                    return response_utils_1.ResponseUtil.error(res, 400, 'No file uploaded');
                }
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                // Determine file type based on MIME type
                const mimePrefix = req.file.mimetype.split('/')[0];
                const fileType = mimePrefix === 'image' ? 'image' :
                    mimePrefix === 'audio' ? 'audio' :
                        mimePrefix === 'video' ? 'video' : 'document';
                // Create a Buffer from the file
                const fileBuffer = req.file.buffer;
                const fileName = req.file.originalname;
                const caption = req.body.caption || '';
                const updatedNote = yield this.noteService.addMediaAttachment(id, userId, fileBuffer, fileName, fileType, caption);
                return response_utils_1.ResponseUtil.success(res, 200, updatedNote, 'Attachment uploaded successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    static removeAttachment(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = notes_validation_utils_1.noteIdSchema.parse(req.params);
                const { attachmentId } = req.params;
                console.log("here is the attachmentId", attachmentId);
                if (!attachmentId) {
                    return response_utils_1.ResponseUtil.error(res, 400, 'Attachment ID is required');
                }
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const updatedNote = yield this.noteService.removeMediaAttachment(id, attachmentId, userId);
                return response_utils_1.ResponseUtil.success(res, 200, updatedNote, 'Attachment removed successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    static shareNote(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = notes_validation_utils_1.noteIdSchema.parse(req.params);
                const { userId } = req.body;
                if (!userId) {
                    return response_utils_1.ResponseUtil.error(res, 400, 'User ID is required');
                }
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const currentUserId = req.user.userId;
                // const updatedNote = await this.noteService.shareNote(id, userId, currentUserId);
                const updatedNote = yield this.noteService.shareNote(id, [userId], currentUserId);
                return response_utils_1.ResponseUtil.success(res, 200, updatedNote, 'Note shared successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    static unshareNote(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = notes_validation_utils_1.noteIdSchema.parse(req.params);
                const { userId } = req.body;
                if (!userId) {
                    return response_utils_1.ResponseUtil.error(res, 400, 'User ID is required');
                }
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const currentUserId = req.user.userId;
                const updatedNote = yield this.noteService.unshareNote(id, userId, currentUserId);
                return response_utils_1.ResponseUtil.success(res, 200, updatedNote, 'Note unshared successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
}
exports.NoteController = NoteController;
NoteController.noteService = new notes_service_1.NoteService(); //research  moore why this works like this...
