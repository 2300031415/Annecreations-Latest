// app.ts - TypeScript version, Express 5-ready, fully typed
import { createServer } from 'http';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { connectMongoDB } from './config/db';
// Middleware
import { handleWebhook } from './controllers/checkout.controller';
import { activityTracker } from './middleware/activityTracker.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { logFileAccess, customImageHandler } from './middleware/imageServer.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { apiLimiter } from './middleware/rate-limit.middleware';
import { searchLogger } from './middleware/searchLogger.middleware';
// import { securityMiddleware } from './middleware/security.middleware'; // Disabled due to aggressive sanitization
// Routes
import adminRoutes from './routes/admin.routes';
import analyticsRoutes from './routes/analytics.routes';
import backupRoutes from './routes/backup.routes';
import bannerRoutes from './routes/banner.routes';
import cartRoutes from './routes/cart.routes';
import categoryRoutes from './routes/category.routes';
import checkoutRoutes from './routes/checkout.routes';
import contactRoutes from './routes/contact.routes';
import countryRoutes from './routes/country.routes';
import couponRoutes from './routes/coupon.routes';
import customerRoutes from './routes/customer.routes';
import dashboardRoutes from './routes/dashboard.routes';
import downloadRoutes from './routes/download.routes';
import migrationRoutes from './routes/migration.routes';
import orderRoutes from './routes/order.routes';
import popupRoutes from './routes/popup.routes';
import productRoutes from './routes/product.routes';
import reviewRoutes from './routes/review.routes';
import roleRoutes from './routes/role.routes';
import searchRoutes from './routes/search.routes';
import systemRoutes from './routes/system.routes';
import wishlistRoutes from './routes/wishlist.routes';
import zoneRoutes from './routes/zone.routes';
import swaggerSpec from './swagger';
import { validateEnvironmentVariables } from './utils/envValidation';

// === ENV ===
dotenv.config();

// Validate environment variables
validateEnvironmentVariables();

// === APP INIT ===
const app = express();
app.set('trust proxy', 1);

// === SECURITY ===
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  })
);

const allowedOrigins = process.env.allowedOrigins?.split(',') || [];

// === CORS ===
app.use(
  cors({
    origin: [...allowedOrigins],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400,
  })
);

// === COMPRESSION ===
app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['content-type']?.startsWith('image/')) return false;
      return compression.filter(req, res);
    },
  })
);

// === WEBHOOK ROUTE (BEFORE BODY PARSING) ===
// Webhook route with raw body parsing - MUST be registered before express.json() middleware
// This ensures the raw body is available for signature verification
app.post(
  '/api/checkout/webhook',
  (req, res, next) => {
    console.log('=== WEBHOOK ENDPOINT HIT ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('User-Agent:', req.get('User-Agent'));
    console.log('X-Razorpay-Signature:', req.get('X-Razorpay-Signature'));
    console.log('Body type:', typeof req.body);
    console.log('Body is Buffer:', Buffer.isBuffer(req.body));
    console.log('==============================');
    next();
  },
  express.raw({ type: 'application/json' }),
  handleWebhook
);

// === COMMON MIDDLEWARE (before body parsing) ===
app.use(cookieParser());
app.use(requestLogger);

// === BODY PARSING ===
// Apply JSON and URL-encoded body parsing to all other routes
app.use(
  express.json({
    limit: '10mb',
    verify: (req: Request, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// === MIDDLEWARE (after body parsing) ===
// Apply security middleware
// app.use(securityMiddleware); // Disabled due to aggressive sanitization removing dots and other valid characters

// Apply API rate limiter to all routes except images
// app.use((req, res, next) => {
//   if (req.path.startsWith('/image')) {
//     return next(); // Skip rate limiting for image requests
//   }
//   apiLimiter(req, res, next);
// });

// === IMAGE HANDLING ===
// Log image requests (no rate limiting for static assets)
app.use('/image', logFileAccess);

// Serve images from catalog directory using static middleware
// app.use('/image', imageServerMiddleware);
// Serve images from catalog directory using static middleware
app.use('/image', customImageHandler);

// === SWAGGER ===
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AnneCreations REST API Documentation',
  })
);
app.use(activityTracker);
app.use(searchLogger);

// Authentication & User Management
app.use('/api/admin', adminRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/roles', roleRoutes);

// Core E-commerce Features
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/popups', popupRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
import walletRoutes from './routes/wallet.routes';
app.use('/api/wallet', walletRoutes);

// Other checkout routes with JSON parsing
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/downloads', downloadRoutes);

// Contact & Support
app.use('/api/contact', contactRoutes);

// Custom Design Requests
import designRequestRoutes from './routes/designRequest.routes';
app.use('/api/design-requests', designRequestRoutes);

// AI Assistant
import aiRoutes from './routes/ai.routes';
app.use('/api/ai', aiRoutes);

// Search & Discovery
app.use('/api/search', searchRoutes);

// Location & Geography
app.use('/api/countries', countryRoutes);
app.use('/api/zones', zoneRoutes);

// Promotions & Marketing
app.use('/api/coupons', couponRoutes);

// Analytics & Reporting
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// System & Administration
app.use('/api/backup', backupRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', systemRoutes);

// === ERROR HANDLING ===
app.use(notFoundHandler);
app.use(errorHandler);

// === SERVER START ===
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
let server: ReturnType<typeof createServer>;

import { SchedulerService } from './services/scheduler.service';

connectMongoDB()
  .then(async () => {
    console.log('✅ MongoDB connected');

    // Initialize scheduled tasks
    SchedulerService.init();

    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 All services initialized and ready`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📈 Metrics: http://localhost:${PORT}/api/metrics`);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

const gracefulShutdown = (signal: NodeJS.Signals) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(err => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

export default app;
