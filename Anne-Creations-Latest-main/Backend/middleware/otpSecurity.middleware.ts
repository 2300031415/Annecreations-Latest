/**
 * OTP Security Middleware
 * Implements multi-layer validation for SMS OTP requests
 * Following SOLID principles for maintainability
 */

import { Request, Response, NextFunction } from 'express';

import RequestSignature from '../models/requestSignature.model';
import { generateOTPSignature } from '../utils/signatureUtils';

/**
 * Validation result interface
 */
interface ValidationResult {
  success: boolean;
  error?: {
    status: number;
    message: string;
    code: string;
    details?: string;
  };
}

/**
 * OTP Security Service
 * Single Responsibility: Handle OTP signature validation and replay attack prevention
 * Note: Uses timestamp for signature uniqueness, permanently stores all used signatures
 */
class OTPSecurityService {
  /**
   * Validate request signature (HMAC validation with timestamp for uniqueness)
   */
  async validateRequestSignature(req: Request): Promise<ValidationResult> {
    const signature = req.headers['x-signature'] as string;

    // Check required header
    if (!signature) {
      return {
        success: false,
        error: {
          status: 403,
          message: 'Missing authentication signature',
          code: 'MISSING_SIGNATURE',
          details: 'Request must include X-Signature header',
        },
      };
    }

    // Get secret key from environment (same for both web and mobile)
    const secretKey = this.getSecretKey();
    if (!secretKey) {
      console.error('OTP_SECRET_KEY not configured in environment variables');
      return {
        success: false,
        error: {
          status: 500,
          message: 'Server configuration error',
          code: 'MISSING_SECRET_KEY',
        },
      };
    }

    // Generate expected signature from request body using OTP signature utility
    // Use timestamp from request body to ensure signature matches (no timestamp validation)
    const expectedSignature = generateOTPSignature(req.body, secretKey);

    // Validate signature matches
    if (signature !== expectedSignature) {
      console.warn('Invalid signature', {
        path: req.path,
      });

      return {
        success: false,
        error: {
          status: 403,
          message: 'Invalid authentication signature',
          code: 'INVALID_SIGNATURE',
        },
      };
    }

    // Check if signature was already used (replay attack prevention)
    const existingSignature = await RequestSignature.findOne({ signature });

    if (existingSignature) {
      console.warn('Replay attack detected: signature already used', {
        path: req.path,
        signature,
      });

      return {
        success: false,
        error: {
          status: 403,
          message: 'This request has already been processed',
          code: 'SIGNATURE_ALREADY_USED',
        },
      };
    }

    // Store signature to prevent replay attacks
    try {
      await RequestSignature.create({
        signature,
        endpoint: req.path,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error storing signature:', error);
    }

    return { success: true };
  }

  /**
   * Get secret key from environment
   */
  private getSecretKey(): string | undefined {
    return process.env.OTP_SECRET_KEY || '';
  }
}

/**
 * Middleware factory: Validate OTP request security
 *
 * Performs validation:
 * 1. Signature validation (HMAC SHA256 of request body with timestamp)
 * 2. Replay attack prevention with server-side validation
 *    - Each signature can only be used once (permanent storage)
 *    - All used signatures are permanently blocked
 *
 * Required Headers:
 * - X-Signature: HMAC SHA256 hash of request body with timestamp
 *
 * Security Features:
 * - HMAC signature validation (prevents request tampering)
 * - Timestamp-based signature uniqueness (enables OTP resends)
 * - Permanent replay attack prevention using database storage
 * - No signature expiration (maximum security)
 */
export const validateOTPSecurity = () => {
  const securityService = new OTPSecurityService();

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request signature
      const signatureValidation = await securityService.validateRequestSignature(req);
      if (!signatureValidation.success) {
        res.status(signatureValidation.error!.status).json({
          message: signatureValidation.error!.message,
          error: signatureValidation.error!.code,
          details: signatureValidation.error!.details,
        });
        return;
      }

      // Validation passed - proceed to controller
      next();
    } catch (error) {
      console.error('OTP security validation error:', error);
      res.status(500).json({
        message: 'Security validation failed',
        error: 'SECURITY_ERROR',
      });
    }
  };
};

export default validateOTPSecurity;
