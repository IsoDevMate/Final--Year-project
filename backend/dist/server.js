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
const routes_1 = __importDefault(require("./routes/routes"));
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const db_1 = require("./config/db");
const passport_1 = require("./config/passport");
const passport_2 = __importDefault(require("passport"));
const config_1 = __importDefault(require("./config/config"));
const node_cron_1 = __importDefault(require("node-cron"));
const compression_1 = __importDefault(require("compression"));
const eventcleanup_service_1 = require("./services/eventcleanup.service");
const paymentchecker_utils_1 = require("./utils/paymentchecker.utils");
const logger_middleware_1 = require("./middleware/logger.middleware");
const corsOptions = {
    origin: "*"
};
//memory optimizations
app.use((0, compression_1.default)());
app.use((req, res, next) => {
    const startMem = process.memoryUsage().heapUsed;
    res.on('finish', () => {
        const endMem = process.memoryUsage().heapUsed;
        const memoryDiff = endMem - startMem;
        if (memoryDiff > 5 * 1024 * 1024) { // Log if route consumed more than 5MB
            console.log(`Memory intensive route: ${req.method} ${req.path} - Used ${(memoryDiff / 1024 / 1024).toFixed(2)} MB`);
        }
    });
    next();
});
paymentchecker_utils_1.paymentChecker.start();
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    paymentchecker_utils_1.paymentChecker.stop();
    // Other cleanup code...
    process.exit(0);
});
// cleanup every 10 minutes
const scheduleCleanup = () => {
    node_cron_1.default.schedule('0 */6 * * *', () => {
        eventcleanup_service_1.EventCleanupService.cleanupPastEvents()
            .catch(err => console.error('Error during event cleanup:', err));
    });
};
scheduleCleanup();
function manageMemory() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const rss = memUsage.rss / 1024 / 1024;
    console.log(`Memory Status: HeapUsed: ${heapUsedMB.toFixed(2)}MB, HeapTotal: ${heapTotalMB.toFixed(2)}MB, RSS: ${rss.toFixed(2)}MB`);
    // If memory usage gets high, try to clean up
    if (heapUsedMB > 500) {
        console.log('Memory usage high, attempting cleanup...');
        try {
            if (typeof global.gc === 'function') {
                global.gc();
            }
            else {
                console.log('Manual garbage collection not available. Run with --expose-gc flag');
            }
            console.log('Garbage collection triggered');
        }
        catch (e) {
            console.log('Manual garbage collection not available. Run with --expose-gc flag');
        }
    }
}
node_cron_1.default.schedule('*/1 * * * *', () => {
    manageMemory();
});
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
function gracefulShutdown() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Graceful shutdown initiated...');
        yield db_1.databaseService.disconnect();
        console.log('Graceful shutdown complete');
        process.exit(0);
    });
}
app.use((0, cors_1.default)(corsOptions));
app.use(logger_middleware_1.loggerMiddleware); // Add comprehensive logging middleware BEFORE JSON parsing
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
(0, passport_1.setupPassport)();
app.use(passport_2.default.initialize());
app.use('/', routes_1.default);
//middlewares
app.use((err, req, res, next) => {
    if (err.status === 401) {
        res.status(401).json({
            statusCode: 401,
            message: 'Unauthorized',
        });
    }
    next(err);
});
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🚀 Starting server with enhanced logging...");
            const connectionStatus = yield db_1.databaseService.testConnection();
            console.log("here is the connectionstatus message", connectionStatus.message);
            if (!connectionStatus.success) {
                console.log("Waiting for database connection...");
            }
            else {
                try {
                    const stats = yield db_1.databaseService.getDatabaseStats();
                    console.log('Database Stats:', stats);
                }
                catch (error) {
                    console.error("Failed to get database stats:", error);
                }
            }
            const PORT = parseInt(String(config_1.default.port || "3000"), 10);
            app.listen(PORT, '0.0.0.0', () => {
                console.log(`Server running on port ${PORT}`);
            })
                .on('error', (error) => {
                console.log(`Error is : ${error}`);
            });
            // Schedule a cron job to keep the server alive
            node_cron_1.default.schedule('*/1 * * * *', () => {
                console.log('...');
            });
            manageMemory();
        }
        catch (error) {
            console.error("Failed to start server:", error);
            process.exit(1);
        }
    });
}
startServer();
