"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtil = void 0;
class ResponseUtil {
    static success(res, statusCode, data, message) {
        const response = {
            statusCode,
            success: true,
            data,
            message,
        };
        return res.status(statusCode).json(response);
    }
    static error(res, statusCode, message) {
        const response = {
            statusCode,
            success: false,
            error: message,
        };
        return res.status(statusCode).json(response);
    }
}
exports.ResponseUtil = ResponseUtil;
