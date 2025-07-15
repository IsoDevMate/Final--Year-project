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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("./config"));
class DatabaseService {
    constructor() {
        this.connection = null;
        this.connect();
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!config_1.default.mongoUri) {
                    throw new Error('MongoDB URI is not defined in environment variables');
                }
                yield mongoose_1.default.connect(config_1.default.mongoUri);
                this.connection = mongoose_1.default.connection;
                console.log('Connected to MongoDB');
                // Handle connection events
                this.connection.on('error', (err) => {
                    console.error('MongoDB connection error:', err);
                });
                this.connection.on('disconnected', () => {
                    console.log('MongoDB disconnected');
                });
                // Handle application termination
                process.on('SIGINT', () => __awaiter(this, void 0, void 0, function* () {
                    yield this.disconnect();
                    process.exit(0);
                }));
            }
            catch (error) {
                console.error('Failed to connect to MongoDB:', error);
                // Don't exit the process here, let the application handle the error
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connection) {
                yield mongoose_1.default.disconnect();
                console.log('MongoDB connection closed');
            }
        });
    }
    testConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.connection || this.connection.readyState !== 1) {
                    return { success: false, message: 'Database connection is not established' };
                }
                return { success: true, message: 'Database connection is established' };
            }
            catch (error) {
                return { success: false, message: `Database connection error: ${error}` };
            }
        });
    }
    getDatabaseStats() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const result = yield this.testConnection();
                if (!result.success) {
                    throw new Error(result.message);
                }
                // Basic stats check
                return {
                    databaseName: (_a = this.connection) === null || _a === void 0 ? void 0 : _a.name,
                    connectionState: (_b = this.connection) === null || _b === void 0 ? void 0 : _b.readyState,
                    collections: Object.keys(((_c = this.connection) === null || _c === void 0 ? void 0 : _c.collections) || {}).length
                };
            }
            catch (error) {
                console.error('Failed to get database stats:', error);
                throw error;
            }
        });
    }
}
exports.databaseService = new DatabaseService();
