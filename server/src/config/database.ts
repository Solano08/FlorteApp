import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { env } from './env';

let pool: Pool;

export const getPool = (): Pool => {
  if (!pool) {
    pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      waitForConnections: true,
      connectionLimit: env.db.connectionLimit,
      namedPlaceholders: true
    });
  }

  return pool;
};

export const getConnection = async (): Promise<PoolConnection> => {
  return await getPool().getConnection();
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
  }
};
