/**
 * Request Signature Utilities
 * Helper functions for HMAC-based authentication
 */

import crypto from 'crypto';

/**
 * Create payload string from request data
 * Consistent format for signature generation
 *
 * @param data - Request body data
 * @returns Serialized payload string (e.g., "key1=value1&key2=value2")
 */
export const createPayload = (data) => {
  // Sort keys for consistent ordering
  const sortedKeys = Object.keys(data).sort();
  const parts = sortedKeys.map(key => `${key}=${data[key]}`);
  return parts.join('&');
};

/**
 * Generate HMAC SHA256 signature
 *
 * @param payload - Payload string to sign
 * @param secretKey - Secret key for HMAC
 * @returns Hex-encoded signature
 */
export const generateSignature = (payload, secretKey )=> {
  return crypto.createHmac('sha256', secretKey).update(payload).digest('hex');
};

/**
 * Generate signature for OTP requests with timestamp validation
 * Server validates signature freshness using embedded timestamp
 *
 * @param data - Request body data
 * @param secretKey - Secret key from environment (OTP_SECRET_KEY)
 * @param timestamp - Optional timestamp (defaults to current time)
 * @returns HMAC SHA256 signature
 *
 * @example
 * const data = { mobile: '+1234567890' };
 * const secretKey = process.env.OTP_SECRET_KEY;
 * const signature = generateOTPSignature(data, secretKey);
 * // Use signature in X-Signature header
 */
export const generateOTPSignature = (
  data,
  secretKey,
  timestamp,
) => {
  const ts = timestamp || Date.now();
  const payload = createPayload({ ...data, timestamp: ts });
  return generateSignature(payload, secretKey);
};

export default {
  createPayload,
  generateSignature,
  generateOTPSignature,
};
