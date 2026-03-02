import dotenv from 'dotenv';

dotenv.config();

// Railway usa MYSQLHOST, MYSQLUSER, etc.; el servidor espera DB_*
const getDbHost = () => process.env.DB_HOST ?? process.env.MYSQLHOST ?? 'localhost';
const getDbPort = () => parseInt(process.env.DB_PORT ?? process.env.MYSQLPORT ?? '3306', 10);
const getDbUser = () => process.env.DB_USER ?? process.env.MYSQLUSER ?? 'root';
const getDbPassword = () => process.env.DB_PASSWORD ?? process.env.MYSQLPASSWORD ?? '';
const getDbName = () => process.env.DB_NAME ?? process.env.MYSQLDATABASE ?? 'florte_app';

const requiredEnv = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET'
];

const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.warn(`[env] Missing environment variables: ${missing.join(', ')}`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
  db: {
    host: getDbHost(),
    port: getDbPort(),
    user: getDbUser(),
    password: getDbPassword(),
    database: getDbName(),
    connectionLimit: parseInt(process.env.DB_POOL_SIZE ?? '10', 10)
  },
  storage: {
    cdnBaseUrl: process.env.CDN_BASE_URL ?? ''
  }
};
