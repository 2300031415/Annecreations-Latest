import { NextFunction, Request, Response } from 'express';

// middleware/logger.middleware.ts
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = new Date();
  const userAgent = req.get('User-Agent') || '';
  const isWebhook = req.path.includes('/webhook') || userAgent.includes('Razorpay-Webhook');

  // Log webhook requests immediately when they arrive
  if (isWebhook) {
    console.log('\n🔔 WEBHOOK REQUEST RECEIVED:');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Method: ${req.method}`);
    console.log(`   Path: ${req.path}`);
    console.log(`   URL: ${req.originalUrl}`);
    console.log(`   User-Agent: ${userAgent}`);
    console.log(`   Content-Type: ${req.get('Content-Type')}`);
    console.log(`   Has Signature: ${!!req.get('X-Razorpay-Signature')}\n`);
  }

  res.on('finish', () => {
    const duration = new Date().getTime() - start.getTime();

    const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

    // Highlight webhook requests in logs
    if (isWebhook) {
      console.log(`🔔 ${logMessage}`);
    } else {
      console.log(logMessage);
    }
  });

  next();
};
