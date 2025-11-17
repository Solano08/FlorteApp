"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requiredEnv = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME'
];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`[env] Missing environment variables: ${missing.join(', ')}`);
}
exports.env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '4000', 10),
    clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
    jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
    db: {
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '3306', 10),
        user: process.env.DB_USER ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_NAME ?? 'florte_app',
        connectionLimit: parseInt(process.env.DB_POOL_SIZE ?? '10', 10)
    },
    storage: {
        cdnBaseUrl: process.env.CDN_BASE_URL ?? ''
    }
};
