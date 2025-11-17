"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePool = exports.getConnection = exports.getPool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const env_1 = require("./env");
let pool;
const getPool = () => {
    if (!pool) {
        pool = promise_1.default.createPool({
            host: env_1.env.db.host,
            port: env_1.env.db.port,
            user: env_1.env.db.user,
            password: env_1.env.db.password,
            database: env_1.env.db.database,
            waitForConnections: true,
            connectionLimit: env_1.env.db.connectionLimit,
            namedPlaceholders: true
        });
    }
    return pool;
};
exports.getPool = getPool;
const getConnection = async () => {
    return await (0, exports.getPool)().getConnection();
};
exports.getConnection = getConnection;
const closePool = async () => {
    if (pool) {
        await pool.end();
    }
};
exports.closePool = closePool;
