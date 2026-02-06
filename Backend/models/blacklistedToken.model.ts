import mongoose from 'mongoose';

import { IBlacklistedToken, IBlacklistedTokenModel } from '../types/models/index';
import { createBaseSchema } from '../utils/baseModel';

const blacklistedTokenSchema = createBaseSchema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 1000,
    },
    tokenType: {
      type: String,
      enum: ['access', 'refresh'],
      required: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    userType: {
      type: String,
      enum: ['customer', 'admin'],
      required: true,
    },
    reason: {
      type: String,
      enum: ['logout', 'password_change', 'security_revoke', 'admin_revoke'],
      default: 'logout',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    collectionName: 'blacklistedTokens',
    modelName: 'BlacklistedToken',
    trimFields: ['token', 'userId'],
    addCommonFeatures: true,
  }
);

// BlacklistedToken-specific indexes
// Note: token index is already created by unique: true in schema definition
blacklistedTokenSchema.index({ userId: 1 });
blacklistedTokenSchema.index({ userType: 1 });
blacklistedTokenSchema.index({ tokenType: 1 });
// TTL index for automatic cleanup of expired tokens
blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// BlacklistedToken-specific static methods
blacklistedTokenSchema.statics.isTokenBlacklisted = function (token: string) {
  return this.findOne({ token });
};

blacklistedTokenSchema.statics.blacklistToken = function (tokenData: {
  token: string;
  tokenType: 'access' | 'refresh';
  userId: string;
  userType: 'customer' | 'admin';
  reason?: 'logout' | 'password_change' | 'security_revoke' | 'admin_revoke';
  expiresAt: Date;
}) {
  return this.create(tokenData);
};

blacklistedTokenSchema.statics.blacklistUserTokens = function (
  userId: string,
  userType: 'customer' | 'admin',
  reason: string = 'logout'
) {
  // This would be used for security revokes - blacklist all tokens for a user
  // Implementation would depend on how you want to handle this
  return this.updateMany(
    { userId, userType },
    {
      $set: {
        reason,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    }
  );
};

blacklistedTokenSchema.statics.cleanupExpiredTokens = function () {
  return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

export default mongoose.model<IBlacklistedToken, IBlacklistedTokenModel>(
  'BlacklistedToken',
  blacklistedTokenSchema
);
