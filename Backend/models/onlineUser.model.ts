import mongoose from 'mongoose';

import { IOnlineUser, IOnlineUserModel } from '../types/models/index';
import { createBaseSchema, createReferenceField } from '../utils/baseModel';

const onlineUserSchema = createBaseSchema(
  {
    customer: createReferenceField('Customer', false),
    userType: {
      type: String,
      enum: ['customer', 'guest'],
      default: 'guest',
    },
    browserId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 45,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    source: {
      type: String,
      enum: ['web', 'mobile'],
      default: 'web',
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    pageUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // Enhanced tracking fields
    sessionHistory: [
      {
        url: {
          type: String,
          trim: true,
          maxlength: 1000,
        },
        referrer: {
          type: String,
          trim: true,
          maxlength: 1000,
        },
        browsingPhase: {
          type: String,
          enum: ['guest', 'customer'],
          default: 'guest',
        },
      },
    ],
    loginTime: {
      type: Date,
      default: null,
    },
    totalPageViews: {
      type: Number,
      default: 0,
    },
    // Track browsing phases
    guestPageViews: {
      type: Number,
      default: 0,
    },
    customerPageViews: {
      type: Number,
      default: 0,
    },
    // Track session phases
    sessionPhases: [
      {
        phase: {
          type: String,
          enum: ['guest', 'customer'],
          required: true,
        },
        startTime: {
          type: Date,
          required: true,
        },
        endTime: {
          type: Date,
          default: null,
        },
        pageViews: {
          type: Number,
          default: 0,
        },
      },
    ],
    // For handling dynamic IPs - store all IPs used by this user
    ipHistory: [
      {
        ip: {
          type: String,
          trim: true,
          maxlength: 45,
        },
      },
    ],
  },
  {
    collectionName: 'onlineUsers',
    modelName: 'OnlineUser',
    trimFields: ['browserId', 'ipAddress', 'userAgent', 'pageUrl'],
    addCommonFeatures: true,
  }
);

// OnlineUser-specific indexes
onlineUserSchema.index({ customer: 1 });
onlineUserSchema.index({ userType: 1 });

onlineUserSchema.index({ lastActivity: -1 });
// TTL index for automatic cleanup of inactive users (30 minutes)
onlineUserSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 1800 });

// OnlineUser-specific static methods (only keep what's actually used)
onlineUserSchema.statics.findByBrowserId = function (browserId: string) {
  return this.findOne({ browserId });
};

onlineUserSchema.statics.findByCustomer = function (customerId: mongoose.Types.ObjectId) {
  return this.findOne({ customer: customerId });
};

export default mongoose.model<IOnlineUser, IOnlineUserModel>('OnlineUser', onlineUserSchema);
