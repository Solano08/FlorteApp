/* eslint-disable no-console */
export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.info(`[INFO] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`);
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`);
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`);
  }
};
