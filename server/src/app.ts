import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger'; // 👉 IMPORTANTE: nuestro archivo swagger.ts
import { env } from './config/env';
import { router } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false
  })
);
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

const uploadsStaticPath = path.resolve(__dirname, '..', 'uploads');
app.use(
  '/uploads',
  express.static(uploadsStaticPath, {
    setHeaders: (res) => {
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/** Algunas sondas / balanceadores piden `/`; sin esto devuelve 404 y el health check puede fallar. */
app.get('/', (_req, res) => {
  res.status(200).type('text/plain').send('Florte API');
});

// 👉👉 SWAGGER UI (acceso: http://localhost:4000/api-docs)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 👉 Rutas principales
app.use('/api', router);

// 👉 Middlewares finales
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
