import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { logger } from './logger';
import { db } from './db';
import { generalRateLimit } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/error';
import { swaggerSpec } from './swagger';

// Import routers
import { authRouter } from './routes/auth';
import { itemsRouter } from './routes/items';
import { recipesRouter } from './routes/recipes';
import { scanRouter } from './routes/scan';

const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images from Supabase
}));

// CORS configuration
app.use(cors({
  origin: config.cors.frontendOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging
app.use(pinoHttp({
  logger,
  genReqId: () => crypto.randomUUID(),
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
}));

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply general rate limiting
app.use(generalRateLimit);

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Al Dente API Documentation',
}));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current health status of the API and its dependencies
 *     tags: [Utility]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health', async (_req, res) => {
  try {
    const dbHealthy = await db.healthCheck();
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.node.env,
      database: dbHealthy ? 'connected' : 'disconnected',
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// API routes
app.use('/auth', authRouter);
app.use('/items', itemsRouter);
app.use('/recipes', recipesRouter);
app.use('/scan', scanRouter);

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API information endpoint
 *     description: Returns information about the API including available endpoints
 *     tags: [Utility]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/APIInfoResponse'
 */
app.get('/api', (_req, res) => {
  res.json({
    name: 'Al Dente API',
    description: 'Pantry tracking and AI-powered recipe generation REST API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /auth/signup': 'Create new user account',
        'POST /auth/login': 'Authenticate user',
      },
      items: {
        'GET /items': 'List pantry items with pagination and search',
        'POST /items': 'Create new pantry item',
        'GET /items/:id': 'Get specific pantry item',
        'PUT /items/:id': 'Update pantry item',
        'DELETE /items/:id': 'Delete pantry item',
      },
      recipes: {
        'GET /recipes': 'List user recipes with pagination',
        'POST /recipes/generate': 'Generate AI recipes using pantry items',
        'POST /recipes': 'Create custom recipe',
        'GET /recipes/:id': 'Get specific recipe',
        'DELETE /recipes/:id': 'Delete recipe',
      },
      scan: {
        'POST /scan/upload': 'Upload and analyze food image',
      },
      utility: {
        'GET /health': 'Service health check',
        'GET /api': 'API documentation',
      },
    },
  });
});

// 404 handler for unknown routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught exception', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.fatal('Unhandled promise rejection', { reason, promise });
  process.exit(1);
});

const PORT = config.server.port;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Al Dente API server running on port ${PORT}`);
  logger.info(`Environment: ${config.node.env}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API info: http://localhost:${PORT}/api`);
  logger.info(`📚 API documentation: http://localhost:${PORT}/api-docs`);
});

export { app, server };
