/**
 * Browser ID utilities
 * Generates unique identifiers for tracking user browsers/devices
 */

import crypto from 'crypto';

import { Request } from 'express';

// Custom header constants for client source detection
export const CLIENT_SOURCE_HEADER = 'X-Client-Source';
export const CLIENT_SOURCE_MOBILE = 'mobile';
export const CLIENT_SOURCE_WEB = 'web';

/**
 * Generate a unique browser ID based on user agent and other browser characteristics
 * This creates a consistent ID for the same browser/device combination
 * Format: browser_<hash>
 * Example: browser_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 */
export const generateBrowserId = (userAgent: string, additionalData?: string): string => {
  // Combine user agent with additional data for uniqueness
  const combinedData = `${userAgent}${additionalData || ''}`;

  // Create a hash of the combined data
  const hash = crypto.createHash('sha256').update(combinedData).digest('hex');

  // Take first 32 characters and format as browser ID
  return `browser_${hash.substring(0, 32)}`;
};

/**
 * Generate a device fingerprint for additional uniqueness
 *
 * IMPORTANT: This is used differently for guests vs. logged-in users:
 *
 * For logged-in users:
 * - Combined with customerId, so doesn't need to be globally unique
 * - Just needs to be device-specific for same user
 *
 * For guests:
 * - CRITICAL: Must be as unique as possible to avoid collisions
 * - Uses IP + timestamp + random if no cookie exists
 * - NOW INCLUDES DOMAIN CONTEXT for website-specific tracking
 */
export const generateDeviceFingerprint = (req: Request): string => {
  // Get domain context for website-specific tracking
  const host = req.get('host') || req.get('x-forwarded-host') || '';
  const origin = req.get('origin') || '';
  const referer = req.get('referer') || '';

  // Extract domain from various sources
  let domain = '';
  if (host) {
    domain = host.split(':')[0]; // Remove port if present
  } else if (origin) {
    try {
      domain = new URL(origin).hostname;
    } catch {
      domain = origin;
    }
  } else if (referer) {
    try {
      domain = new URL(referer).hostname;
    } catch {
      domain = referer;
    }
  }

  const components = [
    // WEBSITE CONTEXT - Critical for multi-website tracking
    domain, // This ensures different websites get different browser IDs

    // Network identifiers (more comprehensive)
    req.connection?.remoteAddress || req.socket?.remoteAddress || '',
    req.headers['x-forwarded-for'] || '',
    req.headers['x-real-ip'] || '',
    req.ip || '', // Express IP

    // Browser/Device identifiers (enhanced for device uniqueness)
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.headers['accept'] || '',
    req.headers['dnt'] || '', // Do Not Track
    req.headers['upgrade-insecure-requests'] || '',

    // Browser client hints (more specific device info)
    req.headers['sec-ch-ua'] || '',
    req.headers['sec-ch-ua-platform'] || '',
    req.headers['sec-ch-ua-mobile'] || '',
    req.headers['sec-ch-ua-arch'] || '',
    req.headers['sec-ch-ua-model'] || '',
    req.headers['sec-ch-ua-platform-version'] || '',
    req.headers['sec-ch-ua-full-version'] || '',

    // Additional headers for uniqueness
    req.headers['sec-fetch-site'] || '',
    req.headers['sec-fetch-mode'] || '',
    req.headers['sec-fetch-dest'] || '',
    req.headers['sec-fetch-user'] || '',

    // Connection info (enhanced)
    String(req.socket?.remotePort || ''),
    String(req.socket?.localPort || ''),
    String(req.connection?.bytesRead || ''),
    String(req.connection?.bytesWritten || ''),

    // Screen resolution and viewport (if available via headers)
    req.headers['viewport-width'] || '',
    req.headers['device-memory'] || '',
    req.headers['rtt'] || '', // Round trip time

    // Additional device characteristics
    req.headers['x-device-id'] || '',
    req.headers['x-device-type'] || '',
    req.headers['x-app-version'] || '',

    // Timestamp component for additional uniqueness (changes per second)
    // This helps prevent collisions for simultaneous guests
    String(Math.floor(Date.now() / 1000)), // Unix timestamp in seconds
  ];

  const fingerprint = components.join('|');
  const hash = crypto.createHash('sha256').update(fingerprint).digest('hex');

  // Debug logging (remove in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Device Fingerprint Debug:', {
      domain,
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...',
      ip: req.ip || req.connection?.remoteAddress,
      fingerprintLength: fingerprint.length,
      hash: hash.substring(0, 8) + '...',
      componentsCount: components.length,
      components: components.slice(0, 5), // Show first 5 components for debugging
      timestamp: new Date().toISOString(),
    });
  }

  return hash;
};

/**
 * Extract or generate browser ID from request (SERVER-SIDE ONLY)
 *
 * Strategy for unique device tracking:
 * 1. For logged-in users (web/mobile): browserId = hash(customerId + deviceFingerprint + timestamp)
 *    - Includes timestamp to prevent overlaps
 *    - Solves mobile app issue (login is mandatory)
 *
 * 2. For guests (web only): browserId = hash(deviceFingerprint + timestamp + random)
 *    - Based on device characteristics + DOMAIN CONTEXT + timestamp + random
 *    - Stored in cookie for persistence
 *    - MULTI-WEBSITE SUPPORT: Different domains = different browser IDs
 *
 * Cookie is SECONDARY - the hash is PRIMARY identifier
 * Cookie just helps with performance (avoid regenerating hash)
 *
 * MULTI-WEBSITE BEHAVIOR:
 * - website1.com → browser_abc123... (unique for this domain + timestamp)
 * - website2.com → browser_def456... (unique for this domain + timestamp)
 * - Same device, different websites = different online user records
 * - Timestamp ensures no overlaps even for identical devices
 *
 * @param req - Express request object
 * @param customerId - Customer ID if logged in
 * @returns browserId string
 */
export const getOrCreateBrowserId = (req: Request, customerId?: string): string => {
  const userAgent = req.headers['user-agent'] || '';

  // CRITICAL: Check if browserId was already generated in this request
  // This prevents multiple middleware/handlers from generating different IDs
  if ((req as any)._generatedBrowserId) {
    // Already generated in this request - return cached value
    // Cookie was already set by first caller
    return (req as any)._generatedBrowserId;
  }

  // STRATEGY 1: For logged-in users (mobile & web)
  // Check if browserId cookie already exists first to avoid creating multiple cookies
  if (customerId) {
    // Check for existing cookie first
    let browserId = req.cookies?.browserId;

    // Only generate new browserId if one doesn't exist or is invalid
    if (!browserId || !isValidBrowserId(browserId)) {
      // Get stable device fingerprint
      const fingerprint = generateDeviceFingerprint(req);

      // Add timestamp component for uniqueness (only when creating NEW browserId)
      const timestamp = Date.now().toString();

      // Create browserId from customer + device + timestamp
      // This ensures uniqueness even for same customer + device
      const stableData = `customer:${customerId}:${fingerprint}:${timestamp}`;
      browserId = generateBrowserId(userAgent, stableData);

      // Debug logging (remove in production)
      if (process.env.NODE_ENV !== 'production') {
        console.log('Customer Browser ID Debug (NEW):', {
          customerId,
          userAgent: userAgent.substring(0, 50) + '...',
          fingerprint: fingerprint.substring(0, 8) + '...',
          timestamp,
          browserId: browserId.substring(0, 16) + '...',
          note: 'Generated new browserId - no existing cookie or invalid',
        });
      }

      // Set cookie for performance optimization (avoid recalculating hash)
      // ONLY set if not already set in this request
      if (req.res && !(req as any)._browserIdCookieSet) {
        // Clear any existing browserId cookies first to prevent duplicates
        req.res.clearCookie('browserId', { path: '/' });

        req.res.cookie('browserId', browserId, {
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
          httpOnly: false, // Allow JavaScript access for consistency
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });

        // Mark that cookie has been set for this request
        (req as any)._browserIdCookieSet = true;
      }
    } else {
      // Debug logging for existing cookie
      if (process.env.NODE_ENV !== 'production') {
        console.log('Customer Browser ID Debug (EXISTING):', {
          customerId,
          browserId: browserId.substring(0, 16) + '...',
          note: 'Using existing browserId from cookie',
        });
      }
    }

    // Cache the browserId on the request object for this request lifecycle
    (req as any)._generatedBrowserId = browserId;
    return browserId;
  }

  // STRATEGY 2: For guests (web only)
  // Cookie is PRIMARY - fingerprint is fallback
  // This avoids collision issues with fingerprint-only approach

  // Check cookie first (most reliable for guests)
  let browserId = req.cookies?.browserId;

  // IMPORTANT: Race condition mitigation for parallel requests
  // If multiple requests fire simultaneously (e.g., analytics/start + checkout/start),
  // they might all see no cookie and generate different IDs.
  // The clearCookie + cookie setting helps, but the frontend should ideally
  // call /api/analytics/start FIRST before other API calls.

  if (!browserId) {
    // Cookie doesn't exist - generate new browserId
    // Use fingerprint + timestamp + random component for uniqueness
    const fingerprint = generateDeviceFingerprint(req);

    // Add timestamp and random component to prevent collisions
    // This ensures even identical devices get different browserIds
    const timestamp = Date.now().toString();
    const randomComponent = crypto.randomBytes(8).toString('hex');
    const guestData = `guest:${fingerprint}:${timestamp}:${randomComponent}`;
    browserId = generateBrowserId(userAgent, guestData);

    // Debug logging (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Guest Browser ID Debug (NEW):', {
        userAgent: userAgent.substring(0, 50) + '...',
        fingerprint: fingerprint.substring(0, 8) + '...',
        timestamp,
        randomComponent,
        browserId: browserId.substring(0, 16) + '...',
        note: 'Generated new browserId - no existing cookie',
      });
    }

    // Set cookie - this becomes the source of truth for this guest
    // ONLY set if not already set in this request
    if (req.res && !(req as any)._browserIdCookieSet) {
      // Clear any existing browserId cookies first to prevent duplicates
      req.res.clearCookie('browserId', { path: '/' });

      req.res.cookie('browserId', browserId, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: false, // Allow JavaScript access for consistency
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });

      // Mark that cookie has been set for this request
      (req as any)._browserIdCookieSet = true;
    }
  } else {
    // Debug logging for existing cookie (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Guest Browser ID Debug (EXISTING):', {
        browserId: browserId.substring(0, 16) + '...',
        userAgent: userAgent.substring(0, 50) + '...',
        note: 'Using existing cookie browserId',
      });
    }
  }

  // Cache the browserId on the request object for this request lifecycle
  (req as any)._generatedBrowserId = browserId;
  return browserId;
};

/**
 * Validate browser ID format
 */
export const isValidBrowserId = (browserId: string): boolean => {
  const browserIdPattern = /^browser_[a-f0-9]{32}$/i;
  return browserIdPattern.test(browserId);
};

/**
 * Get client source from custom header
 * @param req - Express request object
 * @returns 'mobile' | 'web' | null
 */
export const getClientSourceFromHeader = (req: Request): 'mobile' | 'web' | null => {
  const headerValue = req.headers?.[CLIENT_SOURCE_HEADER.toLowerCase()];
  const clientSource = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (
    clientSource?.toLowerCase() === CLIENT_SOURCE_MOBILE ||
    clientSource?.toLowerCase() === CLIENT_SOURCE_WEB
  ) {
    return clientSource.toLowerCase() as 'mobile' | 'web';
  }

  return null;
};

/**
 * Validate client source header value
 * @param value - Header value to validate
 * @returns boolean
 */
export const isValidClientSource = (value: string): boolean => {
  const normalizedValue = value?.toLowerCase();
  return normalizedValue === CLIENT_SOURCE_MOBILE || normalizedValue === CLIENT_SOURCE_WEB;
};

/**
 * Get client source with intelligent fallback detection
 * This is the most robust method - uses header first, then User-Agent analysis
 * @param req - Express request object
 * @returns 'mobile' | 'web'
 */
export const getClientSource = (req: Request): 'mobile' | 'web' => {
  // First try custom header
  const clientSource = getClientSourceFromHeader(req);
  if (clientSource) {
    return clientSource;
  }

  // Fallback to user agent detection
  const userAgent = req.get('User-Agent') || '';
  const origin = req.get('Origin');
  const referer = req.get('Referer');

  // Check for mobile app indicators (OkHttp is used by Android apps)
  const isMobileApp =
    userAgent.toLowerCase().includes('okhttp') ||
    (userAgent.includes('Android') && !userAgent.includes('wv') && !userAgent.includes('Mozilla'));

  if (isMobileApp) {
    return CLIENT_SOURCE_MOBILE;
  }

  // Check for web browser indicators
  const isWebBrowser =
    userAgent.includes('Mozilla') ||
    userAgent.includes('Chrome') ||
    userAgent.includes('Safari') ||
    userAgent.includes('Firefox') ||
    userAgent.includes('Edge') ||
    userAgent.includes('Opera') ||
    (userAgent.includes('Android') && userAgent.includes('wv')) ||
    (userAgent.includes('iPhone') && userAgent.includes('Mobile')) ||
    origin ||
    referer;

  return isWebBrowser ? CLIENT_SOURCE_WEB : CLIENT_SOURCE_MOBILE;
};
