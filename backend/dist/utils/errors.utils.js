"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
const response_utils_1 = require("./response.utils");
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    if (err instanceof AppError) {
        return response_utils_1.ResponseUtil.error(res, err.statusCode, err.message);
    }
    return response_utils_1.ResponseUtil.error(res, 500, 'Internal server error');
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    return response_utils_1.ResponseUtil.error(res, 404, `Route ${req.originalUrl} not found`);
};
exports.notFoundHandler = notFoundHandler;
