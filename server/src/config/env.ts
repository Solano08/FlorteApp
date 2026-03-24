import dotenv from 'dotenv';

dotenv.config();

// Railway usa MYSQLHOST, MYSQLUSER, etc.; también RAILWAY_PRIVATE_DOMAIN cuando se conecta MySQL
const getDbHost = () =>
  process.env.DB_HOST ??
  process.env.MYSQLHOST ??
  process.env.MYSQL_HOST ??
  process.env.RAILWAY_PRIVATE_DOMAIN ??
  'localhost';
const getDbPort = () =>
  parseInt(process.env.DB_PORT ?? process.env.MYSQLPORT ?? process.env.MYSQL_PORT ?? '3306', 10);
const getDbUser = () => process.env.DB_USER ?? process.env.MYSQLUSER ?? process.env.MYSQL_USER ?? 'root';
const getDbPassword = () =>
  process.env.DB_PASSWORD ?? process.env.MYSQLPASSWORD ?? process.env.MYSQL_PASSWORD ?? '';
const getDbName = () =>
  process.env.DB_NAME ?? process.env.MYSQLDATABASE ?? process.env.MYSQL_DATABASE ?? 'florte_app';

const requiredEnv = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET'
];

const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.warn(`[env] Missing environment variables: ${missing.join(', ')}`);
}

// CORS exige solo protocolo+host+puerto, sin rutas. Normalizamos para evitar /login, /register, etc.
const toOrigin = (url: string): string => {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return trimmed;
  }
};

// CLIENT_URL puede ser una URL o varias separadas por coma (ej: https://app.vercel.app,https://app-xxx.vercel.app)
const parseClientUrls = (): string | string[] => {
  const raw = process.env.CLIENT_URL ?? 'http://localhost:5173';
  if (raw.includes(',')) {
    return raw.split(',').map(toOrigin).filter(Boolean);
  }
  return toOrigin(raw);
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  clientUrl: parseClientUrls(),
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
  },
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM?.trim() || process.env.SMTP_USER || ''
  }
};

/** Primera URL del cliente (para enlaces en correos cuando CLIENT_URL es una lista). */
export const getPrimaryClientUrl = (): string => {
  const u = env.clientUrl;
  return Array.isArray(u) ? u[0] : u;
};
