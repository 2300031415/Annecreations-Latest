/**
 * Client Source Detection Middleware
 * Adds client source information to request object based on custom header
 */

import { Request, Response, NextFunction } from 'express';

import {
  getClientSourceFromHeader,
  CLIENT_SOURCE_HEADER,
  CLIENT_SOURCE_MOBILE,
  CLIENT_SOURCE_WEB,
} from '../utils/sessionUtils';

/**
 * Middleware to detect and set client source information
 * Checks for X-Client-Source header and sets request properties
 */
export const clientSourceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Get client source from custom header
  const clientSource = getClientSourceFromHeader(req);

  if (clientSource) {
    // Set client source information
    req.clientSource = clientSource;

    // Log for debugging (optional)
    console.log(`Client source detected: ${clientSource} for ${req.method} ${req.path}`);
  } else {
    // No custom header found, will fall back to user agent detection
    console.log(
      `No X-Client-Source header found for ${req.method} ${req.path}, will use fallback detection`
    );
  }

  next();
};

/**
 * Middleware to validate client source header
 * Returns 400 error if invalid header value is provided
 */
export const validateClientSourceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientSourceHeader = req.get(CLIENT_SOURCE_HEADER);

  if (clientSourceHeader && !getClientSourceFromHeader(req)) {
    res.status(400).json({
      message: 'Invalid X-Client-Source header value',
      error: 'INVALID_CLIENT_SOURCE',
      details: `Expected 'mobile' or 'web', got: ${clientSourceHeader}`,
      validValues: [CLIENT_SOURCE_MOBILE, CLIENT_SOURCE_WEB],
    });
    return;
  }

  next();
};

export default {
  clientSourceMiddleware,
  validateClientSourceMiddleware,
};
