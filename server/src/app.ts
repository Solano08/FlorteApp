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
    credentials: true
  })
);

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 👉👉 SWAGGER UI (acceso: http://localhost:4000/api-docs)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 👉 Rutas principales
app.use('/api', router);

// 👉 Middlewares finales
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
