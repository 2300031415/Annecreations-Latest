import { Document } from 'mongoose';

export interface IBlacklistedToken extends Document {
  token: string;
  tokenType: 'access' | 'refresh';
  userId: string;
  userType: 'customer' | 'admin';
  reason: 'logout' | 'password_change' | 'security_revoke' | 'admin_revoke';
  expiresAt: Date;

  // Base model fields
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface IBlacklistedTokenModel extends Document {
  isTokenBlacklisted(_token: string): Promise<IBlacklistedToken | null>;
  blacklistToken(_tokenData: {
    token: string;
    tokenType: 'access' | 'refresh';
    userId: string;
    userType: 'customer' | 'admin';
    reason?: 'logout' | 'password_change' | 'security_revoke' | 'admin_revoke';
    expiresAt: Date;
  }): Promise<IBlacklistedToken>;
  blacklistUserTokens(
    _userId: string,
    _userType: 'customer' | 'admin',
    _reason?: string
  ): Promise<any>;
  cleanupExpiredTokens(): Promise<any>;
}
