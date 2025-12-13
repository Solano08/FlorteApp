import http from 'http';
import app from './app';
import { env } from './config/env';
import { getPool } from './config/database';
import { logger } from './utils/logger';
import { initDb } from './utils/initDb';

const start = async (): Promise<void> => {
  try {
    await getPool().getConnection().then((conn) => {
      conn.release();
    });
    logger.info('Connected to MySQL');

    // Inicializar base de datos
    await initDb();

  } catch (error) {
    logger.error('Failed to connect to MySQL', { error });
    process.exit(1);
  }

  const server = http.createServer(app);
  server.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port}`);
  });
};

void start();
