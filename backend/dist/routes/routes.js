"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const event_routes_1 = __importDefault(require("./event.routes"));
const notes_routes_1 = __importDefault(require("./notes.routes"));
const session_routes_1 = __importDefault(require("./session.routes"));
const subscription_routes_1 = __importDefault(require("./subscription.routes"));
const linkedinsharing_routes_1 = __importDefault(require("./linkedinsharing.routes"));
const mpesa_routes_1 = __importDefault(require("./mpesa.routes"));
const report_routes_1 = __importDefault(require("./report.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const router = (0, express_1.Router)();
// API version prefix
const API_PREFIX = '/api/v1';
// Test endpoint to verify logging
router.get('/test-logging', (req, res) => {
    console.log('🧪 Test logging endpoint hit!');
    res.json({ message: 'Logging test successful', timestamp: new Date().toISOString() });
});
// Authentication routes
router.use(`${API_PREFIX}/auth`, auth_routes_1.default);
router.use(`${API_PREFIX}/events`, event_routes_1.default);
router.use(`${API_PREFIX}/payments`, subscription_routes_1.default);
router.use(`${API_PREFIX}/notes`, notes_routes_1.default);
router.use(`${API_PREFIX}/sessions`, session_routes_1.default);
router.use(`${API_PREFIX}/linkedin`, linkedinsharing_routes_1.default);
router.use(`${API_PREFIX}/mpesa`, mpesa_routes_1.default);
router.use(`${API_PREFIX}/reports`, report_routes_1.default);
router.use(`${API_PREFIX}/admin`, admin_routes_1.default);
exports.default = router;
