// middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';

// Basic rate limiter for all routes
export const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000, // 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests, please try again later',
  },
});

// Stricter limit for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Allow 10 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts, please try again later',
  },
});

// Customer-specific rate limiters
export const customerListLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests for customer list',
  },
});

export const customerLoginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // 5 attempts per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts, please try again later',
  },
});

export const customerRegistrationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 3 registrations per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many registration attempts, please try again later',
  },
});

export const passwordResetLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // 3 attempts per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many password reset attempts, please try again later',
  },
});

export const otpRequestLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 OTP requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many OTP requests. Please wait before requesting another OTP.',
  },
});

export const customerCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 creations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many customer creation attempts',
  },
});

// Order-specific rate limiters
export const orderCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 orders per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many order creation attempts',
  },
});

export const orderListLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests for order list',
  },
});

// Product-specific rate limiters
export const productListLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests for product list',
  },
});

export const productCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 creations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many product creation attempts',
  },
});
