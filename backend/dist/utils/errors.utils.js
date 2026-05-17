"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMongooseErrors = exports.formatValidationErrors = exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
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
// Utility function to format validation errors
const formatValidationErrors = (errors) => {
    console.log('Formatting Zod validation errors:', errors);
    const formatted = errors.map(error => {
        const field = error.path ? error.path.join('.') : 'unknown field';
        return `${field}: ${error.message}`;
    }).join(', ');
    console.log('Formatted validation errors:', formatted);
    return formatted;
};
exports.formatValidationErrors = formatValidationErrors;
// Utility function to format Mongoose validation errors
const formatMongooseErrors = (validationError) => {
    console.log('Formatting Mongoose validation errors:', validationError);
    const errorMessages = Object.keys(validationError.errors).map(key => {
        const error = validationError.errors[key];
        return `${key}: ${error.message}`;
    });
    const formatted = errorMessages.join(', ');
    console.log('Formatted Mongoose errors:', formatted);
    return formatted;
};
exports.formatMongooseErrors = formatMongooseErrors;
