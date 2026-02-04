import { Request, Response, NextFunction } from 'express';

/**
 * Security middleware to prevent common attacks
 */

// Prevent NoSQL injection
export const preventNoSqlInjection = (req: Request, res: Response, next: NextFunction): void => {
  const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'object') {
      const sanitized: any = Array.isArray(obj) ? [] : {};

      for (const [key, value] of Object.entries(obj)) {
        // Remove MongoDB operators
        if (key.startsWith('$')) {
          continue;
        }

        if (typeof value === 'object') {
          sanitized[key] = sanitizeObject(value);
        } else if (typeof value === 'string') {
          // Sanitize string values - preserve email characters for email fields
          if (key.toLowerCase().includes('email')) {
            // For email fields, only remove dangerous MongoDB operators
            sanitized[key] = value.replace(/[<>{}[\]&|]/g, '');
          } else {
            // For other fields, remove dots and other potentially dangerous characters
            sanitized[key] = value.replace(/[.$<>{}[\]&|]/g, '');
          }
        } else {
          sanitized[key] = value;
        }
      }

      return sanitized;
    }

    return obj;
  };

  // Sanitize request body and params
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.params) req.params = sanitizeObject(req.params);

  // Note: req.query is read-only in Express 5, so we can't sanitize it directly
  // Query sanitization should be handled at the route level if needed

  next();
};

// Prevent XSS attacks
export const preventXSS = (req: Request, res: Response, next: NextFunction): void => {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'object') {
      const sanitized: any = Array.isArray(obj) ? [] : {};

      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object') {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }

      return sanitized;
    }

    return obj;
  };

  // Sanitize request body
  if (req.body) req.body = sanitizeObject(req.body);

  next();
};

// Prevent parameter pollution
export const preventParameterPollution = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const cleanParams = (params: any): any => {
    if (Array.isArray(params)) {
      return params[0]; // Take first value if array
    }
    return params;
  };

  // Note: req.query is read-only in Express 5, so we can't modify it directly
  // Query parameter pollution prevention should be handled at the route level if needed

  // Clean body parameters
  for (const key in req.body) {
    req.body[key] = cleanParams(req.body[key]);
  }

  next();
};

// Security headers
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'"
  );

  next();
};

// Export all security middleware
export const securityMiddleware = [
  preventNoSqlInjection,
  preventXSS,
  preventParameterPollution,
  securityHeaders,
];
