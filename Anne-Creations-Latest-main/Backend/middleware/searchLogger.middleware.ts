import { Request, Response, NextFunction } from 'express';

import SearchLog from '../models/searchLog.model';

import { getClientIp } from './activityTracker.middleware';

/**
 * Middleware to log search queries
 */
export const searchLogger = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Save original end method
  const originalEnd = res.end;

  // Replace end method
  res.end = function (chunk?: any, encoding?: any, cb?: any) {
    // Call original end first to finish the response
    const result = originalEnd.call(this, chunk, encoding, cb);

    // Process search logging asynchronously
    (async () => {
      try {
        // Only process if it's a search request and successful
        if (!req.path.includes('/search') || res.statusCode !== 200) {
          return;
        }

        // Extract search query and parameters
        const query = req.query.query || '';

        // Skip logging empty queries
        if (!query || (typeof query === 'string' && !query.trim())) {
          return;
        }

        // Get result count if available
        let resultsCount = 0;
        try {
          const resBody = (res as any)._body;
          if (resBody && typeof resBody === 'string') {
            const jsonBody = JSON.parse(resBody);
            resultsCount = jsonBody.pagination?.total || 0;
          }
        } catch (e) {
          // Silently catch parsing errors
        }

        // Gather user data
        let userId = null;
        let userType = 'guest';

        if (req.customer) {
          userId = req.customer.id;
          userType = 'customer';
        } else if (req.admin) {
          userId = req.admin.id;
          userType = 'admin';
        }

        const sessionId = req.cookies?.sessionId || null;
        const ip = getClientIp(req);

        // Create search log entry
        const searchLog = new SearchLog({
          userId: userId,
          userType: userType,
          sessionId: sessionId,
          ipAddress: ip,
          query,
          filters: {
            category: req.query.category || null,
            priceMin: req.query.priceMin,
            priceMax: req.query.priceMax,
            sort: req.query.sort || 'relevance',
            page: parseInt(req.query.page as string) || 1,
          },
          resultsCount: resultsCount,
        });

        await searchLog.save();
      } catch (error) {
        console.error('Error logging search:', error);
        // Don't affect the response if logging fails
      }
    })();

    return result;
  };

  next();
};
