"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const appError_1 = require("../utils/appError");
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            message: 'Datos inválidos',
            errors: err.flatten()
        });
        return;
    }
    const isOperational = err instanceof appError_1.AppError ? err.isOperational : false;
    const statusCode = err instanceof appError_1.AppError ? err.statusCode : 500;
    const message = err.message ?? 'Internal server error';
    logger_1.logger.error(`[${req.method} ${req.path}] ${message}`, {
        stack: err.stack,
        isOperational
    });
    if (res.headersSent) {
        next(err);
        return;
    }
    res.status(statusCode).json({
        success: false,
        message: isOperational ? message : 'Algo salió mal. Intenta nuevamente más tarde.'
    });
};
exports.errorHandler = errorHandler;
