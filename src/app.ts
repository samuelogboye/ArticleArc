import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config, validateConfig } from './config';
import { connectDatabase } from './config/database';
import { securityMiddleware, rateLimiter, sanitizeInput } from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';

validateConfig();

const app = express();

app.use(securityMiddleware);
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(rateLimiter);
app.use(morgan(config.server.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    
    const server = app.listen(config.server.port, () => {
      console.log(`🚀 ArticleArc server running on port ${config.server.port}`);
      console.log(`📦 Environment: ${config.server.nodeEnv}`);
      console.log(`🤖 AI Service: ${config.ai.geminiApiKey ? 'Enabled' : 'Disabled (fallback mode)'}`);
    });

    const gracefulShutdown = (): void => {
      console.log('\n🔄 Received shutdown signal, closing server gracefully...');
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app };