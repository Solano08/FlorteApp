"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
/* eslint-disable no-console */
exports.logger = {
    info: (message, meta) => {
        console.info(`[INFO] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`);
    },
    warn: (message, meta) => {
        console.warn(`[WARN] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`);
    },
    error: (message, meta) => {
        console.error(`[ERROR] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`);
    }
};
