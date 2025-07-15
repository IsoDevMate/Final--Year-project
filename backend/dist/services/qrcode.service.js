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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRCodeService = void 0;
const QRCode = __importStar(require("qrcode"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config/config"));
const errors_utils_1 = require("../utils/errors.utils");
const upload_service_1 = require("./upload.service");
class QRCodeService {
    constructor() {
        this.storageService = new upload_service_1.StorageService();
    }
    /**
     * Generate a JWT token with event and user information
     */
    generateTokenForEventAttendee(eventId, userId) {
        try {
            // Create payload with limited but necessary info
            const payload = {
                eventId,
                user: {
                    id: userId,
                    //...othere user properties
                },
                type: 'event-registration',
                createdAt: new Date().toISOString(),
            };
            // Sign with QR code specific secret from config
            return jsonwebtoken_1.default.sign(payload, config_1.default.jwt.qrCodeSecret, {
                expiresIn: config_1.default.jwt.accessTokenExpiration
            });
        }
        catch (error) {
            if (error instanceof Error) {
                throw new errors_utils_1.AppError(`Error generating QR token: ${error.message}`, 500);
            }
            throw new errors_utils_1.AppError('Error generating QR token', 500);
        }
    }
    /**
     * Generate QR code as data URL from a token
     */
    generateQRCode(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Generate QR code as buffer
                const qrCodeBuffer = yield QRCode.toBuffer(token);
                // Create a unique filename
                const fileName = `qrcode-${Date.now()}.png`;
                // Upload to Firebase Storage using your existing StorageService
                const uploadResult = yield this.storageService.uploadFile(qrCodeBuffer, fileName, 'system', 'image');
                // Return the public URL
                return uploadResult.url;
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(`Error generating QR code: ${error.message}`, 500);
                }
                throw new errors_utils_1.AppError('Error generating QR code', 500);
            }
        });
    }
    /**
     * Verify a QR code token
     */
    verifyToken(token) {
        try {
            if (!config_1.default.jwt.qrCodeSecret) {
                throw new errors_utils_1.AppError('QR code secret is not defined', 500);
            }
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.qrCodeSecret);
            // Ensure this is an event registration token
            if (decoded.type !== 'event-registration') {
                return null;
            }
            return {
                eventId: decoded.eventId,
                userId: decoded.userId
            };
        }
        catch (error) {
            return null;
        }
    }
}
exports.QRCodeService = QRCodeService;
