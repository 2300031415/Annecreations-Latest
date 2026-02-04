import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import OnlineUser from '../models/onlineUser.model';
import UserActivity from '../models/userActivity.model';
import { getOrCreateBrowserId, getClientSource } from '../utils/sessionUtils';

dotenv.config();

interface UserData {
  userId?: string | null;
  username?: string | null;
  email?: string | null;
  user?: Record<string, unknown>;
  userType?: 'customer' | 'admin' | 'guest';
}

/**
 * Extract client IP from request
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
const getClientIp = (req: Request): string => {
  // Get IP considering proxies (like Cloudflare, Nginx, etc.)
  const ip =
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    '';

  // If multiple IPs in x-forwarded-for, get the first one (client IP)
  return Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
};

/**
 * Helper functions to identify non-page URLs
 */
const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();

  // Check for image file extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const hasImageExt = imageExtensions.some(ext => lowerUrl.includes(ext));

  // Check for image-related paths
  const hasImagePath =
    lowerUrl.includes('/image/') || lowerUrl.includes('/images/') || lowerUrl.includes('/img/');

  // Check for _image pattern (e.g., BH436_image.jpg)
  const hasImagePattern = lowerUrl.includes('_image') || lowerUrl.includes('_img');

  return hasImageExt || hasImagePath || hasImagePattern;
};

const isApiUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes('/api/admin') || lowerUrl.includes('/image/') || lowerUrl.includes('/static/')
  );
};

const isAssetUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes('/assets/') ||
    lowerUrl.includes('/css/') ||
    lowerUrl.includes('/js/') ||
    lowerUrl.includes('/fonts/') ||
    lowerUrl.includes('/vendor/')
  );
};

const isValidReferrer = (url: string): boolean => {
  if (!url) return false;
  return Boolean(!isImageUrl(url) && !isApiUrl(url) && !isAssetUrl(url));
};

/**
 * Get clean referrer from request (web or mobile)
 * @param {Object} req - Express request object
 * @returns {string} - Clean referrer URL or empty string
 */
const getCleanReferrer = (req: Request): string => {
  // Get referrer from multiple sources
  const refererHeader = req.headers.referer || req.headers.referrer;
  const httpReferrer = Array.isArray(refererHeader) ? refererHeader[0] : refererHeader || '';
  const uiReferrer = (req.headers['x-ui-referrer'] as string) || '';

  // Priority: UI referrer (mobile) > HTTP referrer (web) > empty
  if (isValidReferrer(uiReferrer)) {
    return uiReferrer;
  }

  if (isValidReferrer(httpReferrer)) {
    return httpReferrer;
  }

  return '';
};

/**
 * Create or update online user record
 * @param {Object} req - Express request object
 * @param {Object} userData - User data including ID, type, username
 * @returns {Promise<Object>} - Online user record
 */
const trackOnlineUser = async (
  req: Request,
  userData: UserData = {}
): Promise<Record<string, unknown> | null> => {
  // Debug: Log function entry
  if (process.env.NODE_ENV !== 'production') {
    console.log('🚀 trackOnlineUser called:', {
      path: req.path,
      method: req.method,
      userType: userData.userType || 'guest',
      userId: userData.userId?.toString().substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
    });
  }

  // Skip webhook requests - no user tracking needed
  const userAgent = req.headers['user-agent'] || '';
  const isWebhook =
    userAgent.includes('Razorpay-Webhook') ||
    userAgent.includes('webhook') ||
    userAgent.includes('bot') ||
    userAgent.includes('crawler');

  if (isWebhook) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('⏭️ Skipping webhook request');
    }
    return null;
  }

  // Skip Next.js SSR requests - they're made by the server during SSR
  // Check for server-side request indicators (user agent contains "node")
  // DON'T skip: OkHttp (mobile apps), Mozilla/Safari (browsers)
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
      console.log('⏭️ Skipping Next.js SSR request:', {
        userAgent,
        path: req.path,
      });
    }
    return null;
  }

  // Skip admin users - they are not tracked
  if (userData.userType === 'admin') {
    if (process.env.NODE_ENV !== 'production') {
      console.log('⏭️ Skipping admin user');
    }
    return null;
  }

  // Get or create browser ID (server-side, includes customer ID for stability)
  const browserId = getOrCreateBrowserId(req, userData.userId || undefined);

  // Note: We no longer need to extract lastAccessedPage as it's derived from sessionHistory

  const source = getClientSource(req); // Use new client source detection
  const userType = userData.userType || 'guest';
  const customerId =
    userType === 'customer' && userData.userId
      ? new mongoose.Types.ObjectId(userData.userId)
      : null;

  try {
    const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    // Skip tracking for Next.js Image proxy or direct image requests
    // Next.js Image component uses _next/image?url=...
    const isNextImageProxy = req.originalUrl.includes('/_next/image');
    const isDirectImageRequest = isImageUrl(currentUrl);
    const isImageApiEndpoint = currentUrl.includes('/api/') && !isImageUrl(currentUrl);

    if (isNextImageProxy || (isDirectImageRequest && !isImageApiEndpoint)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          '⏭️ Skipping Next.js image proxy or direct image request:',
          currentUrl.substring(0, 100)
        );
      }
      return null;
    }

    const ip = getClientIp(req);

    const isLoggedIn = userType === 'customer' && customerId;

    // Capture and clean referrer from multiple sources
    const currentReferrer = getCleanReferrer(req);

    // Note: pageUrl stores the clean referrer (where user came from)
    // For web: uses HTTP referrer header (filtered for valid page URLs)
    // For mobile: uses x-ui-referrer custom header (filtered for valid page URLs)
    // Filters out: image URLs, API URLs, static assets

    // Debug logging for referrer tracking (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      const refererHeader = req.headers.referer || req.headers.referrer;
      const httpReferrer = Array.isArray(refererHeader) ? refererHeader[0] : refererHeader || '';
      const uiReferrer = (req.headers['x-ui-referrer'] as string) || '';

      console.log('Referrer Tracking Debug:', {
        currentUrl: currentUrl.substring(0, 100) + '...',
        httpReferrer: (httpReferrer || '').substring(0, 100) + '...',
        uiReferrer: (uiReferrer || '').substring(0, 100) + '...',
        currentReferrer: (currentReferrer || '').substring(0, 100) + '...',
        userType,
        browserId: browserId.substring(0, 16) + '...',
        hasValidReferrer: !!currentReferrer,
      });
    }

    // Handle dynamic IP issue and guest-to-customer conversion
    let existingUser = null;
    let existingGuestSession = null;

    // Search by browserId alone since it's unique
    const results = await OnlineUser.find({ browserId }).limit(1);

    // Debug: Log search details
    if (process.env.NODE_ENV !== 'production') {
      console.log('Search by browserId:', {
        browserId: browserId.substring(0, 16) + '...',
        userType,
        customerId: customerId?.toString().substring(0, 8) + '...',
        foundRecords: results.length,
      });
    }

    // Process search results - since browserId is unique, we'll have at most 1 record
    if (results.length > 0) {
      const record = results[0];
      if (record.userType === 'customer') {
        existingUser = record;
      } else if (record.userType === 'guest') {
        existingGuestSession = record;
      }
    }

    // Don't store image URLs in session history - use a placeholder instead
    const sanitizedUrl = isImageUrl(currentUrl) ? '[Image Request]' : currentUrl;

    const sessionEntry = {
      url: sanitizedUrl, // Store the current URL (sanitized if image)
      referrer: currentReferrer,
      browsingPhase: isLoggedIn ? 'customer' : 'guest',
      // MongoDB will automatically add createdAt and updatedAt timestamps
    };

    if (existingUser) {
      // Check if current URL or referrer is different from last session history entry
      const lastSessionEntry =
        existingUser.sessionHistory?.[existingUser.sessionHistory.length - 1];
      const isSameReferrer = lastSessionEntry && lastSessionEntry.referrer === currentReferrer;
      const shouldAddNewEntry = !isSameReferrer;

      // Update existing user with new session data
      // NOTE: Do NOT update browserId - it's unique and causes constraint violations
      const updateData: any = {
        ipAddress: ip,
        userAgent,
        source,
        pageUrl: currentReferrer,
        lastActivity: new Date(),
      };

      // Add session history and count page views if URL or referrer is different
      if (shouldAddNewEntry) {
        updateData.$inc = {
          totalPageViews: 1,
          customerPageViews: 1,
        };
        updateData.$push = { sessionHistory: sessionEntry };
      }

      // Update IP history only if it's different from the last IP
      const lastIPEntry = existingUser.ipHistory?.[existingUser.ipHistory.length - 1];
      const isSameIP = lastIPEntry && lastIPEntry.ip === ip;

      if (!isSameIP) {
        updateData.$push = {
          ...updateData.$push,
          ipHistory: {
            ip,
            // createdAt and updatedAt will be set automatically by MongoDB
          },
        };
      }

      // Set login time if this is a login
      if (req.path.includes('/login') && req.method === 'POST') {
        updateData.$set = {
          ...updateData.$set,
          loginTime: new Date(),
        };
      }

      return await OnlineUser.findByIdAndUpdate(existingUser._id, updateData, {
        new: true,
        runValidators: true,
      });
    } else if (existingGuestSession && userType === 'guest') {
      // Handle existing guest session for guest user (multiple API calls)
      console.log('🔄 Updating existing guest session:', {
        _id: existingGuestSession._id.toString().substring(0, 8) + '...',
        browserId: browserId.substring(0, 16) + '...',
      });

      // Check if current URL or referrer is different from last session history entry
      const lastSessionEntry =
        existingGuestSession.sessionHistory?.[existingGuestSession.sessionHistory.length - 1];
      const isSameReferrer = lastSessionEntry && lastSessionEntry.referrer === currentReferrer;
      const shouldAddNewEntry = !isSameReferrer;

      // NOTE: Do NOT update browserId for existing guest - it's unique
      const updateData: any = {
        ipAddress: ip,
        userAgent,
        source,
        pageUrl: currentReferrer,
        lastActivity: new Date(),
      };

      // Add session history and count page views if URL or referrer is different
      if (shouldAddNewEntry) {
        updateData.$inc = {
          totalPageViews: 1,
          guestPageViews: 1,
        };
        updateData.$push = { sessionHistory: sessionEntry };
      }

      // Update IP history only if it's different from the last IP
      const lastIPEntry =
        existingGuestSession.ipHistory?.[existingGuestSession.ipHistory.length - 1];
      const isSameIP = lastIPEntry && lastIPEntry.ip === ip;

      if (!isSameIP) {
        updateData.$push = {
          ...updateData.$push,
          ipHistory: {
            ip,
            // createdAt and updatedAt will be set automatically by MongoDB
          },
        };
      }

      return await OnlineUser.findByIdAndUpdate(existingGuestSession._id, updateData, {
        new: true,
        runValidators: true,
      });
    } else if (existingGuestSession && userType === 'customer') {
      // Convert guest session to customer session
      // Merge guest browsing history with customer login
      const loginTime = new Date();

      // CRITICAL: Delete any OTHER customer sessions for this customer
      // This prevents multiple sessions for the same customer on different devices
      await OnlineUser.deleteMany({
        customer: customerId,
        userType: 'customer',
        _id: { $ne: existingGuestSession._id }, // Don't delete the current session
      });

      // Check if current URL or referrer is different from last session history entry
      const lastSessionEntry =
        existingGuestSession.sessionHistory?.[existingGuestSession.sessionHistory.length - 1];
      const isSameReferrer = lastSessionEntry && lastSessionEntry.referrer === currentReferrer;
      const shouldAddNewEntry = !isSameReferrer;

      // STEP 1: End the guest phase (separate update to avoid operator conflicts)
      const guestPhaseIndex = existingGuestSession.sessionPhases?.findIndex(
        (phase: any) => phase.phase === 'guest' && !phase.endTime
      );

      if (guestPhaseIndex !== undefined && guestPhaseIndex >= 0) {
        await OnlineUser.findByIdAndUpdate(
          existingGuestSession._id,
          {
            $set: {
              [`sessionPhases.${guestPhaseIndex}.endTime`]: loginTime,
            },
          },
          { new: false, runValidators: false }
        );
      }

      // STEP 2: Convert to customer and add new phase (separate update)
      const updateData: any = {
        userType: 'customer',
        customer: customerId,
        // NOTE: Do NOT update browserId - it's already set and unique
        ipAddress: ip,
        userAgent,
        source,
        pageUrl: currentReferrer,
        lastActivity: new Date(),
        loginTime: loginTime, // Set login time for conversion
      };

      // Build $push operations
      updateData.$push = {
        sessionPhases: {
          phase: 'customer',
          startTime: loginTime,
          pageViews: shouldAddNewEntry ? 1 : 0,
        },
      };

      // Add session history and count page views if URL or referrer is different
      if (shouldAddNewEntry) {
        updateData.$inc = {
          totalPageViews: 1,
          customerPageViews: 1,
        };
        updateData.$push.sessionHistory = sessionEntry;
      }

      // Update IP history only if it's different from the last IP
      const lastIPEntry =
        existingGuestSession.ipHistory?.[existingGuestSession.ipHistory.length - 1];
      const isSameIP = lastIPEntry && lastIPEntry.ip === ip;

      if (!isSameIP) {
        updateData.$push.ipHistory = {
          ip,
          // createdAt and updatedAt will be set automatically by MongoDB
        };
      }

      return await OnlineUser.findByIdAndUpdate(existingGuestSession._id, updateData, {
        new: true,
        runValidators: true,
      });
    } else {
      // Create new user record (either guest or customer)
      const isLoggedIn = userType === 'customer' && customerId;

      // Debug: Log that we're creating a new user
      if (process.env.NODE_ENV !== 'production') {
        console.log('🆕 Creating new user record - no existing user found:', {
          browserId: browserId.substring(0, 16) + '...',
          userType,
          isLoggedIn,
          customerId: customerId?.toString().substring(0, 8) + '...',
          totalOnlineUsersBefore: await OnlineUser.countDocuments({}),
        });
      }

      // CRITICAL: If creating a customer session, delete any existing sessions for this customer
      // This prevents duplicate customer sessions across devices
      if (isLoggedIn && customerId) {
        const deletedCount = await OnlineUser.deleteMany({
          customer: customerId,
          userType: 'customer',
        });

        if (process.env.NODE_ENV !== 'production') {
          console.log('🗑️ Deleted existing customer sessions:', {
            deletedCount: deletedCount.deletedCount,
            customerId: customerId.toString().substring(0, 8) + '...',
          });
        }
      }

      const newUserData: any = {
        browserId,
        userType,
        customer: customerId,
        ipAddress: ip,
        userAgent,
        source,
        lastActivity: new Date(),
        pageUrl: currentReferrer,
        totalPageViews: 1,
        guestPageViews: isLoggedIn ? 0 : 1,
        customerPageViews: isLoggedIn ? 1 : 0,
        sessionHistory: [sessionEntry],
        sessionPhases: [
          {
            phase: isLoggedIn ? 'customer' : 'guest',
            startTime: new Date(),
            pageViews: 1,
          },
        ],
        ipHistory: [
          {
            ip,
            // createdAt and updatedAt will be set automatically by MongoDB
          },
        ],
      };

      // Set login time if this is a login
      if (req.path.includes('/login') && req.method === 'POST' && userType === 'customer') {
        newUserData.loginTime = new Date();
      }

      // Debug logging for new user creation (remove in production)
      if (process.env.NODE_ENV !== 'production') {
        console.log('Creating new online user:', {
          browserId: browserId.substring(0, 16) + '...',
          userType,
          customerId: customerId?.toString().substring(0, 8) + '...',
          ip: ip,
          userAgent: userAgent.substring(0, 50) + '...',
          reason: 'No existing user found',
        });
      }

      try {
        const newUser = await OnlineUser.create(newUserData);

        // ALWAYS log guest user creation for debugging
        console.log('✅ OnlineUser created:', {
          _id: newUser._id.toString().substring(0, 8) + '...',
          userType: newUser.userType,
          browserId: browserId.substring(0, 16) + '...',
        });

        // Debug logging for successful creation (remove in production)
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Successfully created new online user:', {
            _id: newUser._id.toString().substring(0, 8) + '...',
            browserId: browserId.substring(0, 16) + '...',
            userType,
            totalOnlineUsersAfter: await OnlineUser.countDocuments({}),
          });
        }

        return newUser as any;
      } catch (createError) {
        // ALWAYS log creation errors
        console.error('❌ Error creating new online user:', {
          error: createError instanceof Error ? createError.message : String(createError),
          browserId: browserId.substring(0, 16) + '...',
          userType,
        });

        // Debug logging for creation error (detailed, remove in production)
        if (process.env.NODE_ENV !== 'production') {
          console.error('❌ Detailed error creating new online user:', {
            error: createError instanceof Error ? createError.message : String(createError),
            browserId: browserId.substring(0, 16) + '...',
            userType,
            errorCode: createError instanceof Error ? (createError as any).code : 'unknown',
            errorName: createError instanceof Error ? createError.name : 'unknown',
            stack: createError instanceof Error ? createError.stack?.substring(0, 200) : 'no stack',
            newUserDataKeys: Object.keys(newUserData),
          });
        }
        return null;
      }
    }
  } catch (error) {
    // Debug logging for general error (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      console.error('General error in trackOnlineUser:', {
        error: error instanceof Error ? error.message : String(error),
        browserId: browserId?.substring(0, 16) + '...',
        userType,
      });
    }
    return null;
  }
};

/**
 * Log user activity
 * @param {Object} req - Express request object
 * @param {string} activityType - Type of activity
 * @param {Object} activityData - Additional activity data
 * @param {Object} userData - User data
 * @param {Object} locationData - Geolocation data
 * @returns {Promise<Object>} - User activity record
 */
// Helper function to determine entity type and ID from activity data
const getEntityInfo = (activityType: string, activityData: Record<string, unknown>) => {
  const entityInfo: {
    entityType?: string;
    productId?: string;
    orderId?: string;
    categoryId?: string;
    entityId?: string;
  } = {};

  switch (activityType) {
    case 'view_product':
    case 'add_to_cart':
      if (activityData.productId) {
        entityInfo.entityType = 'Product';
        entityInfo.productId = activityData.productId.toString();
      }
      break;
    case 'order':
      if (activityData.orderId) {
        entityInfo.entityType = 'Order';
        entityInfo.orderId = activityData.orderId.toString();
      }
      break;
    case 'search':
      entityInfo.entityType = 'Search';
      entityInfo.entityId = activityData.query?.toString() || 'unknown';
      break;
    case 'login':
    case 'logout':
    case 'register':
      entityInfo.entityType = 'Auth';
      entityInfo.entityId = activityType;
      break;
    case 'checkout':
      entityInfo.entityType = 'Cart';
      entityInfo.entityId = 'checkout';
      break;
    default:
      entityInfo.entityType = 'Other';
      entityInfo.entityId = activityType;
  }

  return entityInfo;
};

const logActivity = async (
  req: Request,
  activityType: string,
  activityData: Record<string, unknown> = {},
  userData: UserData = {}
) => {
  // Track activities for both customers and guests
  // For guests, we'll use browserId as the identifier
  if (userData.userType !== 'customer' && userData.userType !== 'guest') {
    return null;
  }

  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';
  const source = getClientSource(req);
  const browserId = getOrCreateBrowserId(req);
  const entityInfo = getEntityInfo(activityType, activityData);

  try {
    const activityRecord: any = {
      action: activityType,
      activityData: activityData,
      ipAddress: ip,
      userAgent,
      browserId,
      source,
      lastActivity: new Date(),
      ...entityInfo,
    };

    // Only set customer field for logged-in customers
    if (userData.userType === 'customer' && userData.userId) {
      activityRecord.customer = new mongoose.Types.ObjectId(userData.userId);
    }

    const activity = new UserActivity(activityRecord);

    await activity.save();
    return activity;
  } catch {
    return null;
  }
};

/**
 * Main activity tracking middleware
 */
export const activityTracker = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip tracking for certain paths
  const skipPaths = ['/api-docs', '/favicon.ico', '/static', '/assets', '/health', '/admin'];

  const shouldSkip = skipPaths.some(path => req.path.startsWith(path));
  if (shouldSkip) {
    return next();
  }

  // Skip tracking for admin routes (path contains /admin/)
  if (req.path.includes('/admin')) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('⏭️ Skipping admin route:', req.path);
    }
    return next();
  }

  // Skip tracking if referrer contains admin
  const referer = req.headers.referer || req.headers.referrer;
  const referrerStr = Array.isArray(referer) ? referer[0] : referer || '';
  if (referrerStr.toLowerCase().includes('/admin')) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('⏭️ Skipping request with admin referrer:', req.path);
    }
    return next();
  }

  // Skip tracking for webhook user agents
  const userAgent = req.headers['user-agent'] || '';
  const isWebhook =
    userAgent.includes('Razorpay-Webhook') ||
    userAgent.includes('webhook') ||
    userAgent.includes('bot') ||
    userAgent.includes('crawler');

  if (isWebhook) {
    // Log webhook requests for monitoring (without detailed tracking)
    console.log('Webhook request received:', {
      userAgent,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    return next();
  }

  // Save original end method to capture response data
  const originalEnd = res.end;

  try {
    // Get user data
    let userData: UserData = {
      userId: null,
      userType: 'guest',
      username: null,
      email: null,
    };

    // Check if admin is logged in - SKIP tracking for admins
    if (req.admin) {
      userData = {
        userId: req.admin.id,
        userType: 'admin',
        username: req.admin.username || req.admin.name,
        email: req.admin.email,
      };

      // Note: Admin users are NOT tracked in online users system
      // Skip trackOnlineUser call for admins - they don't need session tracking
      if (process.env.NODE_ENV !== 'production') {
        console.log('⏭️ Skipping admin user tracking in activityTracker middleware');
      }
    } else if (req.customer) {
      // Check if customer is logged in
      userData = {
        userId: req.customer.id,
        userType: 'customer',
        username: req.customer.name,
        email: req.customer?.email,
      };

      // Track online user for customers
      await trackOnlineUser(req, userData);
    } else {
      // Set as guest user for tracking
      userData = {
        userId: null,
        userType: 'guest',
        username: null,
        email: null,
      };

      // Track online user for guests
      if (process.env.NODE_ENV !== 'production') {
        console.log('👤 Tracking guest user in activityTracker middleware');
      }
      await trackOnlineUser(req, userData);
    }

    req.deviceType = 'Unknown'; // Device type not tracked in current model

    // Intercept response to log activity after request is complete
    res.end = function (
      chunk?: unknown,
      encoding?: BufferEncoding | (() => void),
      cb?: () => void
    ) {
      // Call the original end method first
      const result = originalEnd.call(this, chunk, encoding as BufferEncoding, cb);

      // Determine activity type based on request
      let activityType = 'other';
      const activityData: Record<string, unknown> = {
        method: req.method,
        path: req.path,
        status: res.statusCode,
      };

      // Login activity - Special handling to capture user info from response
      if (req.path.includes('/login') && req.method === 'POST' && res.statusCode === 200) {
        activityType = 'login';

        // Try to extract user info from response body
        try {
          const resBody = (res as { _body?: string })._body;

          if (resBody && typeof resBody === 'string') {
            const jsonBody = JSON.parse(resBody);

            // Check if customer login or admin login
            if (jsonBody.customer) {
              // Update userData with details from response for customer login
              userData = {
                userId: jsonBody.customer.id,
                userType: 'customer',
                username: jsonBody.customer.name,
                email: jsonBody.customer?.email,
              };

              // Add login details to activity data
              activityData.userId = jsonBody.customer.id;
              activityData.email = jsonBody.customer?.email;

              // Update online user using the enhanced tracking function
              // This will handle guest-to-customer conversion automatically
              trackOnlineUser(req, userData).catch(() => {});
            } else if (jsonBody.admin) {
              // Update userData with details from response for admin login
              userData = {
                userId: jsonBody.admin.id,
                userType: 'admin',
                username: jsonBody.admin.username,
                email: jsonBody.admin.email,
              };

              // Add login details to activity data
              activityData.user = jsonBody.admin.id;
              activityData.email = jsonBody.admin.email;

              // Admin users are not tracked in online users
              // No update needed
            }
          }
        } catch {
          // Silently catch parsing errors
        }
      }
      // Logout activity
      else if (req.path.includes('/logout') && res.statusCode === 200) {
        activityType = 'logout';
      }
      // Product view
      else if (req.path.match(/\/products\/\d+/) && req.method === 'GET') {
        activityType = 'view_product';
        activityData.productId = parseInt(req.path.split('/').pop() || '0');
      }
      // Search
      else if (req.path.includes('/search') && req.method === 'GET') {
        activityType = 'search';
        activityData.query = req.query.query || '';
        activityData.filters = { ...req.query };
      }
      // Add to cart
      else if (req.path.includes('/cart/add') && req.method === 'POST') {
        activityType = 'add_to_cart';
        activityData.productId = req.body.productId;
        activityData.options = req.body.options;
      }
      // Checkout
      else if (req.path.includes('/checkout') && req.method === 'POST') {
        activityType = 'checkout';
      }
      // Order
      else if (
        req.path.includes('/checkout/complete') &&
        req.method === 'POST' &&
        res.statusCode === 200
      ) {
        activityType = 'order';
        // Try to extract order_id from response
        try {
          const resBody = (res as { _body?: string })._body;
          if (resBody && typeof resBody === 'string') {
            const jsonBody = JSON.parse(resBody);
            if (jsonBody.orderId) {
              activityData.orderId = jsonBody.orderId;
            }
          }
        } catch {
          // Silently catch parsing errors
        }
      }
      // Registration
      else if (req.path.includes('/register') && req.method === 'POST' && res.statusCode === 201) {
        activityType = 'register';
        // Try to extract user info from response body
        try {
          const resBody = (res as { _body?: string })._body;
          if (resBody && typeof resBody === 'string') {
            const jsonBody = JSON.parse(resBody);
            if (jsonBody.customer) {
              // Update userData with details from response
              userData = {
                userId: jsonBody.customer.id,
                userType: 'customer',
                username: jsonBody.customer.name,
                email: jsonBody.customer?.email,
              };

              // Add registration details to activity data
              activityData.userId = jsonBody.customer.id;
              activityData.email = jsonBody.customer?.email;

              // Update online user using the enhanced tracking function
              // This will handle guest-to-customer conversion automatically
              trackOnlineUser(req, userData).catch(() => {});
            }
          }
        } catch {
          // Silently catch parsing errors
        }
      }

      // Log the activity asynchronously
      logActivity(req, activityType, activityData, userData).catch(() => {});

      return result;
    };
  } catch (error) {
    // Continue with the request even if tracking fails, but log the error
    console.error('❌ Activity tracker middleware error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }

  next();
};

// Export methods for direct use in controllers
export { trackOnlineUser, logActivity, getClientIp };
