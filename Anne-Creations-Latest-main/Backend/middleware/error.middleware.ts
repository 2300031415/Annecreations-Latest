// middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  // MongoDB validation errors
  if (err.name === 'ValidationError') {
    const errors: Record<string, string> = {};

    Object.keys(err.errors).forEach(key => {
      errors[key] = err.errors[key].message;
    });

    res.status(400).json({
      message: 'Validation error',
      errors,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      message: 'Invalid token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      message: 'Token expired',
    });
    return;
  }

  // Default error
  res.status(500).json({
    message: err.message || 'Internal server error',
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
};
