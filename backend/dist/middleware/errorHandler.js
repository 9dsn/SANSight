"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const httpError_1 = require("../utils/httpError");
const logger_1 = require("../utils/logger");
const errorHandler = (error, _req, res, _next) => {
    if (error instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: "Validation failed",
            details: error.flatten()
        });
    }
    if (error instanceof httpError_1.HttpError) {
        return res.status(error.statusCode).json({
            error: error.message,
            details: error.details
        });
    }
    logger_1.logger.error({ error }, "Unhandled request error");
    return res.status(500).json({
        error: "Internal server error"
    });
};
exports.errorHandler = errorHandler;
