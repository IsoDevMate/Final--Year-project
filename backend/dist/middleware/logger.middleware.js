"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerMiddleware = void 0;
const loggerMiddleware = (req, res, next) => {
    console.log('🔧 Logger middleware called!'); // Debug line
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    // Log incoming request
    console.log(`[${requestId}] ${req.method} ${req.originalUrl} - Started`);
    console.log(`[${requestId}] Headers:`, {
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'Bearer ***' : 'None',
        'user-agent': req.headers['user-agent']
    });
    // Log body if available
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`[${requestId}] Request body:`, JSON.stringify(req.body, null, 2));
    }
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk, encoding, cb) {
        const duration = Date.now() - startTime;
        console.log(`[${requestId}] ${req.method} ${req.originalUrl} - Completed in ${duration}ms - Status: ${res.statusCode}`);
        if (res.statusCode >= 400) {
            console.log(`[${requestId}] Error response:`, chunk === null || chunk === void 0 ? void 0 : chunk.toString());
        }
        return originalEnd.call(this, chunk, encoding, cb);
    };
    next();
};
exports.loggerMiddleware = loggerMiddleware;
