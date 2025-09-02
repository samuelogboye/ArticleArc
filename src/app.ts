import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config, validateConfig } from './config';
import { connectDatabase } from './config/database';
import { securityMiddleware, apiSecurityMiddleware, rateLimiter, sanitizeInput, additionalSecurityHeaders } from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { specs } from './config/swagger';
import routes from './routes';

validateConfig();

const app = express();

// Disable Express server signature
app.disable('x-powered-by');

app.use(additionalSecurityHeaders);
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

// Swagger API Documentation
const swaggerOptions = {
  customSiteTitle: "ArticleArc API Documentation",
  customfavIcon: "/assets/favicon.ico",
  customCss: `
    .topbar-wrapper .link { content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDIxTDEyIDNNOSAxOUw5IDE5TDE1IDE5TDE1IDE5TTE3LjA3MTEgNi45Mjg5M0wyMC40ODUzIDMuNTE0NzJNOSAyMUg5VjNIOVYyMUg5Wk05LjAwMDAxIDlIMTUuMDAwMVY5SDE5VjE5SDE1VjlIOUg5LjAwMDAxWiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K'); }
    .swagger-ui .topbar { background-color: #2c3e50; }
    .swagger-ui .btn.authorize svg { fill: #fff; }
    .swagger-ui .btn.authorize { background-color: #3498db; border-color: #3498db; }
    .swagger-ui .btn.authorize:hover { background-color: #2980b9; border-color: #2980b9; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    docExpansion: 'list',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    validatorUrl: null, // Disable validator for production
    url: undefined, // Let Swagger UI use the current domain
    dom_id: '#swagger-ui',
    deepLinking: true,
    // presets: [
    //   // @ts-ignore
    //   swaggerUi.SwaggerUIBundle.presets.apis,
    //   // @ts-ignore
    //   swaggerUi.SwaggerUIStandalonePreset
    // ],
    layout: "StandaloneLayout"
  }
};

// Disable security headers for Swagger UI to work properly
app.use('/api-docs', (req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Content-Security-Policy'); 
  res.removeHeader('X-WebKit-CSP');
  next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Root route handler
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ArticleArc API Server',
    version: '1.0.0',
    environment: config.server.nodeEnv,
    documentation: '/api-docs',
    apiBase: '/api/v1',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      articles: '/api/v1/articles', 
      interactions: '/api/v1/interactions',
      users: '/api/v1/users',
    },
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    
    const server = app.listen(config.server.port, '0.0.0.0', () => {
      console.log(`🚀 ArticleArc server running on port ${config.server.port}`);
      console.log(`📦 Environment: ${config.server.nodeEnv}`);
      console.log(`🤖 AI Service: ${config.ai.geminiApiKey ? 'Enabled' : 'Disabled (fallback mode)'}`);
      console.log(`📚 API Documentation: http://localhost:${config.server.port}/api-docs`);
      
      // Additional production debugging info
      if (config.server.nodeEnv === 'production') {
        console.log(`🌐 Production URL: https://articlearcapi.samuelogboye.com`);
        console.log(`📋 Available routes:`);
        console.log(`   - GET  /                  (Root endpoint)`);
        console.log(`   - GET  /api/v1/health     (Health check)`);
        console.log(`   - GET  /api-docs          (API Documentation)`);
        console.log(`   - POST /api/v1/auth/register`);
        console.log(`   - POST /api/v1/auth/login`);
        console.log(`   - GET  /api/v1/articles`);
        console.log(`   - POST /api/v1/articles`);
      }
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${config.server.port} is already in use`);
      } else if (error.code === 'EACCES') {
        console.error(`❌ Permission denied to bind to port ${config.server.port}`);
      } else {
        console.error(`❌ Server error:`, error);
      }
      process.exit(1);
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