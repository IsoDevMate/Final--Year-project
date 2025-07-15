"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_mddleware_1 = require("../middleware/auth.mddleware");
const linkedinsharing_controller_1 = __importDefault(require("../controllers/linkedinsharing.controller"));
const router = express_1.default.Router();
// Middleware to verify token
router.use(auth_mddleware_1.AuthMiddleware.verifyToken);
// Check LinkedIn account status
router.get('/status', linkedinsharing_controller_1.default.checkLinkedInStatus);
// Share a note to LinkedIn
router.post('/share/note/:noteId', linkedinsharing_controller_1.default.shareNote);
// Generic content sharing
router.post('/share/content', linkedinsharing_controller_1.default.shareContent);
// Specific content type sharing routes
router.post('/share/text', linkedinsharing_controller_1.default.shareTextPost);
router.post('/share/image', linkedinsharing_controller_1.default.shareImagePost);
router.post('/share/video', linkedinsharing_controller_1.default.shareVideoPost);
router.post('/share/article', linkedinsharing_controller_1.default.shareArticlePost);
// Get LinkedIn access token
router.post('/access-token', linkedinsharing_controller_1.default.getAccessToken);
exports.default = router;
