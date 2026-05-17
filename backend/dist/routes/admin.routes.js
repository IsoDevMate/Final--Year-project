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
const express_1 = require("express");
const auth_mddleware_1 = require("../middleware/auth.mddleware");
const user_model_1 = require("../models/user.model");
const event_model_1 = require("../models/event.model");
const note_model_1 = require("../models/note.model");
const mpesapayment_model_1 = require("../models/mpesapayment.model");
const token_model_1 = require("../models/token.model");
const response_utils_1 = require("../utils/response.utils");
const upload_service_1 = require("../services/upload.service");
const router = (0, express_1.Router)();
// All admin routes require auth + admin role
router.use(auth_mddleware_1.AuthMiddleware.verifyToken, auth_mddleware_1.AuthMiddleware.hasRole([user_model_1.UserRole.ADMIN]));
// Test Firebase storage connectivity (admin only)
router.get('/test-storage', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const storage = new upload_service_1.StorageService();
        const testBuffer = Buffer.from('eventbase-storage-test');
        const result = yield storage.uploadFile(testBuffer, 'test.txt', 'admin-test', 'document');
        yield storage.deleteFile(result.storageRef);
        return response_utils_1.ResponseUtil.success(res, 200, { bucket: result.url.split('/')[3] }, 'Firebase storage is connected and working');
    }
    catch (e) {
        return response_utils_1.ResponseUtil.error(res, 500, `Storage test failed: ${e.message}`);
    }
}));
// GET all users
router.get('/users', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_model_1.User.find({}).select('-password').lean();
        return response_utils_1.ResponseUtil.success(res, 200, users, 'Users fetched successfully');
    }
    catch (e) {
        next(e);
    }
}));
// GET single user
router.get('/users/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.User.findById(req.params.id).select('-password').lean();
        if (!user)
            return response_utils_1.ResponseUtil.error(res, 404, 'User not found');
        return response_utils_1.ResponseUtil.success(res, 200, user, 'User fetched successfully');
    }
    catch (e) {
        next(e);
    }
}));
// PUT update user (role, etc.)
router.put('/users/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role, firstName, lastName, email, isVerified } = req.body;
        const updated = yield user_model_1.User.findByIdAndUpdate(req.params.id, Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (role && { role })), (firstName && { firstName })), (lastName && { lastName })), (email && { email })), (isVerified !== undefined && { isVerified })), { new: true }).select('-password');
        if (!updated)
            return response_utils_1.ResponseUtil.error(res, 404, 'User not found');
        return response_utils_1.ResponseUtil.success(res, 200, updated, 'User updated successfully');
    }
    catch (e) {
        next(e);
    }
}));
// DELETE user with cascade
router.delete('/users/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const target = yield user_model_1.User.findById(req.params.id);
        if (!target)
            return response_utils_1.ResponseUtil.error(res, 404, 'User not found');
        if (target.role === user_model_1.UserRole.ORGANIZER) {
            yield event_model_1.Event.deleteMany({ organizer: target._id });
        }
        else {
            yield event_model_1.Event.updateMany({ attendees: target._id }, { $pull: { attendees: target._id } });
        }
        yield note_model_1.Note.deleteMany({ user: target._id });
        yield mpesapayment_model_1.MpesaPayment.deleteMany({ userId: target._id });
        yield token_model_1.Token.deleteMany({ userId: target._id });
        yield user_model_1.User.findByIdAndDelete(req.params.id);
        return response_utils_1.ResponseUtil.success(res, 200, null, 'User deleted successfully');
    }
    catch (e) {
        next(e);
    }
}));
// GET all events (admin view)
router.get('/events', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const events = yield event_model_1.Event.find({}).populate('organizer', 'firstName lastName email').lean();
        return response_utils_1.ResponseUtil.success(res, 200, events, 'Events fetched successfully');
    }
    catch (e) {
        next(e);
    }
}));
// DELETE any event
router.delete('/events/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleted = yield event_model_1.Event.findByIdAndDelete(req.params.id);
        if (!deleted)
            return response_utils_1.ResponseUtil.error(res, 404, 'Event not found');
        return response_utils_1.ResponseUtil.success(res, 200, null, 'Event deleted successfully');
    }
    catch (e) {
        next(e);
    }
}));
// GET dashboard stats
router.get('/stats', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [totalUsers, totalEvents, totalOrganizers, totalAttendees] = yield Promise.all([
            user_model_1.User.countDocuments(),
            event_model_1.Event.countDocuments(),
            user_model_1.User.countDocuments({ role: user_model_1.UserRole.ORGANIZER }),
            user_model_1.User.countDocuments({ role: user_model_1.UserRole.ATTENDEE }),
        ]);
        return response_utils_1.ResponseUtil.success(res, 200, { totalUsers, totalEvents, totalOrganizers, totalAttendees }, 'Stats fetched');
    }
    catch (e) {
        next(e);
    }
}));
exports.default = router;
