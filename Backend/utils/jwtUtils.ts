// utils/jwtUtils.ts
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import BlacklistedToken from '../models/blacklistedToken.model';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refreshchangeme';
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || 'resetchangeme';
const JWT_EMAIL_VERIFICATION_SECRET =
  process.env.JWT_EMAIL_VERIFICATION_SECRET || 'emailverificationchangeme';

interface TokenPayload {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  isAdmin?: boolean;
  deviceType?: string;
  accessId?: string; // Unique identifier for this access session
}

interface ResetPasswordTokenPayload {
  id: string;
  type: 'reset';
}

interface EmailVerificationTokenPayload {
  id: string;
  email: string;
  type: 'email_verification';
}

export const generateTokens = (
  payload: TokenPayload
): { accessToken: string; refreshToken: string } => {
  // Generate unique accessId with timestamp and user ID
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 15);
  const accessId = `${payload.id}_${timestamp}_${randomSuffix}`;

  // Add accessId to payload
  const payloadWithAccessId = { ...payload, accessId };

  const accessToken = jwt.sign(payloadWithAccessId, JWT_SECRET, { expiresIn: '2h' });

  payloadWithAccessId.deviceType = payloadWithAccessId.deviceType || 'web'; // Default to Desktop if not provided
  const refreshTokenExpiry = payloadWithAccessId.deviceType == 'mobile' ? '30d' : '7d';
  const refreshToken = jwt.sign(payloadWithAccessId, JWT_REFRESH_SECRET, {
    expiresIn: refreshTokenExpiry,
  });
  if (payloadWithAccessId.deviceType === 'mobile') {
    payloadWithAccessId.isAdmin = false; // Ensure isAdmin is false for mobile devices
  }
  return { accessToken, refreshToken };
};

export const generateResetPasswordToken = (payload: ResetPasswordTokenPayload): string => {
  return jwt.sign(payload, JWT_RESET_SECRET, { expiresIn: '15m' });
};

export const generateEmailVerificationToken = (payload: EmailVerificationTokenPayload): string => {
  return jwt.sign(payload, JWT_EMAIL_VERIFICATION_SECRET, { expiresIn: '24h' });
};

export const verifyAccessToken = async (token: string): Promise<TokenPayload> => {
  try {
    // Validate token format before verification
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new Error('Invalid token format');
    }

    // Check if token has the expected JWT structure (3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('jwt malformed');
    }

    // Check if token is blacklisted
    const blacklistedToken = await BlacklistedToken.isTokenBlacklisted(token);
    if (blacklistedToken) {
      throw new Error('Token has been revoked');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      throw new Error('Access token expired');
    }
    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error(`jwt ${error.message}`);
    }
    throw error;
  }
};

export const verifyRefreshToken = async (token: string): Promise<TokenPayload> => {
  try {
    // Validate token format before verification
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new Error('Invalid token format');
    }

    // Let JWT library handle the structure validation
    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET) as jwt.JwtPayload;
    } catch (refreshError) {
      try {
        decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
      } catch {
        throw refreshError; // Throw the original refresh error
      }
    }

    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      throw new Error('Refresh token expired');
    }

    // Check if the accessId from the refresh token is blacklisted
    if (decoded.accessId) {
      const blacklistedToken = await BlacklistedToken.isTokenBlacklisted(decoded.accessId);
      if (blacklistedToken) {
        throw new Error('Access session has been revoked');
      }
    }

    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error(`jwt ${error.message}`);
    }
    throw error;
  }
};

export const verifyResetPasswordToken = (token: string): ResetPasswordTokenPayload | null => {
  try {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return null;
    }

    const decoded = jwt.verify(token, JWT_RESET_SECRET) as jwt.JwtPayload;
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return null;
    }
    return decoded as ResetPasswordTokenPayload;
  } catch (error) {
    console.error('Reset password token verification failed:', error);
    return null;
  }
};

export const verifyEmailVerificationToken = (
  token: string
): EmailVerificationTokenPayload | null => {
  try {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return null;
    }

    const decoded = jwt.verify(token, JWT_EMAIL_VERIFICATION_SECRET) as jwt.JwtPayload;
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return null;
    }
    return decoded as EmailVerificationTokenPayload;
  } catch (error) {
    console.error('Email verification token verification failed:', error);
    return null;
  }
};

export const blacklistAccessId = async (
  accessId: string,
  userId: string,
  userType: 'customer' | 'admin',
  reason: 'logout' | 'password_change' | 'security_revoke' | 'admin_revoke' = 'logout'
): Promise<void> => {
  try {
    // Calculate expiration time (2 hours from now for access tokens)
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await BlacklistedToken.blacklistToken({
      token: accessId, // Store accessId as the token
      tokenType: 'access',
      userId,
      userType,
      reason,
      expiresAt,
    });
  } catch (error: any) {
    // If token is already blacklisted (duplicate key error), ignore the error
    if (error.code === 11000 || (error.name === 'MongoServerError' && error.code === 11000)) {
      console.log('AccessId already blacklisted:', accessId);
      return; // Success - token is already blacklisted
    }

    console.error('Error blacklisting accessId:', error);
    // Don't throw error - just log it. Blacklisting failure shouldn't prevent logout
  }
};
