"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const start = async () => {
    try {
        await (0, database_1.getPool)().getConnection().then((conn) => {
            conn.release();
        });
        logger_1.logger.info('Connected to MySQL');
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to MySQL', { error });
        process.exit(1);
    }
    const server = http_1.default.createServer(app_1.default);
    server.listen(env_1.env.port, () => {
        logger_1.logger.info(`Server listening on port ${env_1.env.port}`);
    });
};
void start();
