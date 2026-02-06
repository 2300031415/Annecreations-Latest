import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Language from '../models/language.model';

// Enhanced API Response Interface
export interface ApiResponse<T = unknown> {
  data?: T;
  errors?: unknown;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Business Validation Result
export interface BusinessValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Enhanced Response Helper
export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  data: T,
  pagination?: ApiResponse<T>['pagination']
): void => {
  const response: ApiResponse<T> = {
    data,
    pagination,
  };

  res.status(statusCode).json(response);
};

// Enhanced Error Response Helper
export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown
): void => {
  const response: any = {
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
};

// Enhanced Validation Helper
export const validateObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Enhanced Business Logic Validation
export const validateBusinessRules = {
  // Product validation
  product: {
    validatePrice: (price: number): BusinessValidationResult => {
      const errors: string[] = [];
      if (price < 0) {
        errors.push('Price cannot be negative');
      }
      if (price > 999999.99) {
        errors.push('Price cannot exceed 999,999.99');
      }
      return {
        isValid: errors.length === 0,
        errors,
      };
    },

    validateQuantity: (quantity: number): BusinessValidationResult => {
      const errors: string[] = [];
      if (quantity < 0) {
        errors.push('Quantity cannot be negative');
      }
      if (quantity > 999999) {
        errors.push('Quantity cannot exceed 999,999');
      }
      return {
        isValid: errors.length === 0,
        errors,
      };
    },

    validateSKU: (sku: string): BusinessValidationResult => {
      const errors: string[] = [];
      if (!/^[A-Z0-9-_]{3,64}$/.test(sku)) {
        errors.push(
          'SKU must be 3-64 characters and contain only uppercase letters, numbers, hyphens, and underscores'
        );
      }
      return {
        isValid: errors.length === 0,
        errors,
      };
    },

    validateProductModel: (model: string): BusinessValidationResult => {
      const errors: string[] = [];
      if (model.length < 2) {
        errors.push('Product model must be at least 2 characters');
      }
      if (model.length > 255) {
        errors.push('Product model cannot exceed 255 characters');
      }
      return {
        isValid: errors.length === 0,
        errors,
      };
    },
  },

  // Customer validation
  customer: {
    validateEmail: (email: string): BusinessValidationResult => {
      const errors: string[] = [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Invalid email format');
      }
      if (email.length > 96) {
        errors.push('Email cannot exceed 96 characters');
      }
      return {
        isValid: errors.length === 0,
        errors,
      };
    },

    validateMobile: (mobile: string): BusinessValidationResult => {
      const errors: string[] = [];
      const mobileRegex = /^[+]?[\d\s\-\\(\\)]{10,15}$/;
      if (!mobileRegex.test(mobile)) {
        errors.push('Invalid mobile number format');
      }
      return {
        isValid: errors.length === 0,
        errors,
      };
    },

    validatePassword: (password: string): BusinessValidationResult => {
      const errors: string[] = [];
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
      }
      if (password.length > 40) {
        errors.push('Password cannot exceed 40 characters');
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        errors.push(
          'Password must contain at least one lowercase letter, one uppercase letter, and one number'
        );
      }
      return {
        isValid: errors.length === 0,
        errors,
      };
    },
  },

  // Order validation
  order: {
    validateOrderStatus: (status: string): BusinessValidationResult => {
      const validStatuses = ['pending', 'processing', 'paid', 'cancelled', 'refunded', 'failed'];
      const errors: string[] = [];
      if (!validStatuses.includes(status)) {
        errors.push(`Invalid order status. Must be one of: ${validStatuses.join(', ')}`);
      }
      return {
        isValid: errors.length === 0,
        errors,
      };
    },

    validateOrderTotal: (total: number): BusinessValidationResult => {
      const errors: string[] = [];
      if (total < 0) {
        errors.push('Order total cannot be negative');
      }
      if (total > 999999.99) {
        errors.push('Order total cannot exceed 999,999.99');
      }
      return {
        isValid: errors.length === 0,
        errors,
      };
    },
  },

  // Coupon validation
  coupon: {
    validateCouponCode: (code: string): BusinessValidationResult => {
      const errors: string[] = [];
      if (!/^[A-Z0-9]{3,20}$/.test(code)) {
        errors.push(
          'Coupon code must be 3-20 characters and contain only uppercase letters and numbers'
        );
      }
      return {
        isValid: errors.length === 0,
        errors,
      };
    },

    validateDiscount: (discount: number, type: 'P' | 'F'): BusinessValidationResult => {
      const errors: string[] = [];
      if (discount < 0) {
        errors.push('Discount cannot be negative');
      }
      if (type === 'P' && discount > 100) {
        errors.push('Percentage discount cannot exceed 100%');
      }
      if (type === 'F' && discount > 9999.99) {
        errors.push('Fixed discount cannot exceed 9,999.99');
      }
      return {
        isValid: errors.length === 0,
        errors,
      };
    },
  },
};

// Enhanced Query Builder
export const buildQueryFilters = (req: Request): Record<string, unknown> => {
  const filters: any = {};

  // Search filter
  if (req.query.search) {
    const searchTerm = req.query.search as string;
    filters.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { sku: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  // Status filter
  if (req.query.status !== undefined) {
    filters.status = req.query.status === 'true';
  }

  // Category filter
  if (req.query.category && validateObjectId(req.query.category as string)) {
    filters.categories = new mongoose.Types.ObjectId(req.query.category as string);
  }

  // Date range filter
  if (req.query.dateFrom || req.query.dateTo) {
    filters.createdAt = {};
    if (req.query.dateFrom) {
      filters.createdAt.$gte = new Date(req.query.dateFrom as string);
    }
    if (req.query.dateTo) {
      filters.createdAt.$lte = new Date(req.query.dateTo as string);
    }
  }

  return filters;
};

// Enhanced Pagination Helper
export const getPaginationOptions = (req: Request) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(5000, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

// Enhanced Sort Helper
export const getSortOptions = (
  req: Request,
  defaultSort: Record<string, 1 | -1> = { createdAt: -1 }
): Record<string, 1 | -1> => {
  const sortField = (req.query.sortBy as string) || (req.query.sort as string);
  const sortOrderParam = (req.query.sortOrder as string) || (req.query.order as string);
  const sortOrder = sortOrderParam === 'asc' ? 1 : -1;

  if (sortField) {
    // If sortField is explicitly provided, use only that field
    // Remove the same field from defaultSort to avoid conflicts
    const restDefaultSort = { ...defaultSort };
    delete restDefaultSort[sortField];
    return { [sortField]: sortOrder, ...restDefaultSort };
  }

  return defaultSort;
};

// Enhanced Error Handler
export const handleControllerError = (error: any, res: Response, operation: string): void => {
  console.error(`Error in ${operation}:`, error);

  // Handle custom errors with status codes
  if (error.statusCode) {
    sendErrorResponse(res, error.statusCode, error.message);
    return;
  }

  // Handle JWT errors
  if (error.name === 'TokenExpiredError') {
    sendErrorResponse(res, 401, 'Token has expired');
    return;
  }

  if (error.name === 'JsonWebTokenError') {
    sendErrorResponse(res, 401, 'Invalid token');
    return;
  }

  if (error.name === 'NotBeforeError') {
    sendErrorResponse(res, 401, 'Token not active yet');
    return;
  }

  // Handle Mongoose validation errors
  if (error?.name === 'ValidationError') {
    const validationErrors = Object.values(error?.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));
    sendErrorResponse(res, 400, 'Validation failed', validationErrors);
    return;
  }

  // Handle Mongoose cast errors
  if (error.name === 'CastError') {
    sendErrorResponse(res, 400, 'Invalid ID format');
    return;
  }

  // Handle MongoDB duplicate key errors
  if (error.code === 11000 || (error.name === 'MongoServerError' && error.code === 11000)) {
    const field = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'field';
    const value = error.keyValue ? error.keyValue[field] : '';
    sendErrorResponse(
      res,
      409,
      `A record with this ${field} already exists${value ? ': ' + value : ''}`
    );
    return;
  }

  // Handle MongoDB invalid regex errors
  if (error.code === 51091 || (error.name === 'MongoServerError' && error.code === 51091)) {
    sendErrorResponse(res, 400, 'Invalid search query - please check your input');
    return;
  }

  // Handle other MongoDB errors
  if (error.name === 'MongoServerError' || error.name === 'MongoError') {
    console.error('MongoDB Error:', error);
    sendErrorResponse(res, 500, 'Database operation failed');
    return;
  }

  // Handle network errors
  if (error.name === 'MongoNetworkError') {
    console.error('MongoDB Network Error:', error);
    sendErrorResponse(res, 503, 'Database connection failed');
    return;
  }

  // Generic error handler
  sendErrorResponse(
    res,
    500,
    'Internal server error',
    process.env.NODE_ENV === 'development' ? error.message : undefined
  );
};

// Enhanced Authorization Helper
export const checkAuthorization = (req: Request, requiredRole?: 'admin' | 'customer'): boolean => {
  if (requiredRole === 'admin' && !req.admin) {
    return false;
  }
  if (requiredRole === 'customer' && !req.customer) {
    return false;
  }
  return true;
};

// Enhanced Resource Ownership Check
export const checkResourceOwnership = (resourceUserId: string, currentUserId: string): boolean => {
  return resourceUserId === currentUserId;
};

// Enhanced Data Sanitization
export const sanitizeData = (data: any): any => {
  if (typeof data === 'string') {
    return data.trim().replace(/[<>]/g, '');
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }

  return data;
};

/**
 * Escape regex special characters to prevent regex injection
 */
export const escapeRegex = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  // Escape all special regex characters
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Sanitize search input to prevent MongoDB injection
 */
export const sanitizeSearchInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  // Remove MongoDB operators and special characters
  const sanitized = input
    .replace(/[.$]/g, '') // Remove MongoDB operators
    .replace(/[<>]/g, '') // Remove comparison operators
    .replace(/[{}]/g, '') // Remove object operators
    .replace(/[\\[\]]/g, '') // Remove array operators
    .replace(/[&|]/g, '') // Remove logical operators
    .trim();

  return sanitized;
};

/**
 * Create safe search filter for MongoDB queries
 */
export const createSafeSearchFilter = (searchTerm: string, fields: string[]): any => {
  const sanitizedTerm = sanitizeSearchInput(searchTerm);
  if (!sanitizedTerm) return {};

  // Escape regex special characters to prevent regex injection
  const escapedTerm = escapeRegex(sanitizedTerm);

  const searchConditions = fields.map(field => ({
    [field]: { $regex: escapedTerm, $options: 'i' },
  }));

  return { $or: searchConditions };
};

// Enhanced Response Caching Helper
export const setCacheHeaders = (res: Response, maxAge: number = 300): void => {
  // Disable caching in development mode
  if (process.env.NODE_ENV === 'development') {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    return;
  }

  res.set('Cache-Control', `public, max-age=${maxAge}`);
  res.set('ETag', `"${Date.now()}"`);
};

// Enhanced Logging Helper
export const logControllerAction = (req: Request, action: string, details?: any): void => {
  // Skip Next.js SSR requests - they're made by the server during SSR
  // Check for server-side request indicators (user agent contains "node")
  // DON'T skip: OkHttp (mobile apps), Mozilla/Safari (browsers)
  const userAgent = req.get('User-Agent') || '';
  const lowerUserAgent = userAgent.toLowerCase();
  const isServerSideRequest =
    (lowerUserAgent.includes('node') &&
      !lowerUserAgent.includes('mozilla') &&
      !lowerUserAgent.includes('safari') &&
      !lowerUserAgent.includes('okhttp')) ||
    userAgent.includes('node-fetch') ||
    userAgent.includes('Next.js');

  // Skip if it looks like a server-side request without proper authentication
  const isSSRRequest = isServerSideRequest && !req.customer && !req.admin;

  if (isSSRRequest) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('⏭️ Skipping Next.js SSR request from logControllerAction:', {
        userAgent,
        action,
        path: req.path,
      });
    }
    return;
  }

  // Safely extract request data, filtering out sensitive information
  const sanitizeData = (data: any): any => {
    if (!data || typeof data !== 'object') return data;

    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];
    const sanitized = { ...data };

    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    });

    return sanitized;
  };

  const logData = {
    timestamp: new Date().toISOString(),
    action,
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.admin?.id || req.customer?.id,
    userType: req.admin ? 'admin' : req.customer ? 'customer' : 'anonymous',
    // Request data
    body: req.body ? sanitizeData(req.body) : null,
    params: req.params ? sanitizeData(req.params) : null,
    query: req.query ? sanitizeData(req.query) : null,
    headers: req.headers ? sanitizeData(req.headers) : null,
    // Additional request info
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer'),
    // Custom details passed to the function
    details,
  };

  console.log('Controller Action:', JSON.stringify(logData, null, 2));
};

/**
 * Get default language ID (English) or fallback to first active language
 */
export const getDefaultLanguageId = async (): Promise<string | null> => {
  try {
    // First try to find English language by code
    const enGbLanguage = await Language.findByCode('en-gb');
    if (enGbLanguage) {
      return enGbLanguage._id.toString();
    }

    // Fallback to English by name
    const englishLanguage = await Language.findOne({
      name: { $regex: /^english$/i },
      status: true,
    });
    if (englishLanguage) {
      return englishLanguage._id.toString();
    }

    // Fallback to first active language
    const firstLanguage = await Language.findOne({ status: true });
    if (firstLanguage) {
      return firstLanguage._id.toString();
    }

    return null;
  } catch (error) {
    console.error('Error getting default language:', error);
    return null;
  }
};

/**
 * Ensure languageId is set, using default if not provided
 */
export const ensureLanguageId = async (languageId?: string): Promise<string> => {
  if (languageId && mongoose.Types.ObjectId.isValid(languageId)) {
    return languageId;
  }

  const defaultLanguageId = await getDefaultLanguageId();
  if (!defaultLanguageId) {
    throw new Error(
      'No default language found. Please ensure at least one language is configured in the system.'
    );
  }

  return defaultLanguageId;
};

/**
 * Get appropriate frontend URL based on request source
 */
export const getFrontendUrl = (): string => {
  const frontendUrl = process.env.frontEndUrl || 'https://annecreationshb.com';
  return frontendUrl;
};

/**
 * Get the application name from environment variables
 * @returns Application name
 */
export const getAppName = (): string => {
  return process.env.APP_NAME || 'annecreations';
};

export default {
  sendResponse,
  sendErrorResponse,
  validateObjectId,
  validateBusinessRules,
  buildQueryFilters,
  getPaginationOptions,
  getSortOptions,
  handleControllerError,
  checkAuthorization,
  checkResourceOwnership,
  sanitizeData,
  sanitizeSearchInput,
  escapeRegex,
  createSafeSearchFilter,
  setCacheHeaders,
  logControllerAction,
  getDefaultLanguageId,
  ensureLanguageId,
  getFrontendUrl,
  getAppName,
};
