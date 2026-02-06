import mongoose from 'mongoose';

import { IUserActivity, IUserActivityModel } from '../types/models/index';
import { createBaseSchema, createReferenceField } from '../utils/baseModel';

const userActivitySchema = createBaseSchema(
  {
    customer: createReferenceField('Customer', false), // Only for logged-in customers
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    entityType: {
      type: String,
      enum: [
        'Product',
        'Order',
        'Customer',
        'Category',
        'Cart',
        'Wishlist',
        'Search',
        'Auth',
        'Other',
      ],
      trim: true,
      maxlength: 50,
    },
    // Direct entity references instead of generic Entity reference
    productId: createReferenceField('Product', false),
    orderId: createReferenceField('Order', false),
    categoryId: createReferenceField('Category', false),
    // Generic entity ID for other types
    entityId: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    activityData: {
      type: mongoose.Schema.Types.Mixed,
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
    browserId: {
      type: String,
      trim: true,
      maxlength: 100,
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
  },
  {
    collectionName: 'userActivities',
    modelName: 'UserActivity',
    trimFields: ['action', 'entityType', 'ipAddress', 'userAgent', 'browserId', 'entityId'],
    addCommonFeatures: true,
  }
);

// UserActivity-specific indexes
userActivitySchema.index({ customer: 1 });
userActivitySchema.index({ action: 1 });
userActivitySchema.index({ entityType: 1 });
userActivitySchema.index({ productId: 1 });
userActivitySchema.index({ orderId: 1 });
userActivitySchema.index({ categoryId: 1 });
userActivitySchema.index({ entityId: 1 });
userActivitySchema.index({ browserId: 1 });
userActivitySchema.index({ lastActivity: -1 });
userActivitySchema.index({ source: 1 });

// UserActivity-specific virtuals
userActivitySchema.virtual('isRecent').get(function () {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return this.createdAt > oneHourAgo;
});

// UserActivity-specific instance methods
userActivitySchema.methods.getFullUserActivity = async function () {
  const UserActivity = mongoose.model('UserActivity');
  return await UserActivity.findById(this._id)
    .populate('customer', 'firstName lastName email')
    .lean();
};

// UserActivity-specific static methods
userActivitySchema.statics.findByCustomer = function (customerId: mongoose.Types.ObjectId) {
  return this.find({ customer: customerId }).sort({ lastActivity: -1 });
};

userActivitySchema.statics.findByBrowserId = function (browserId: string) {
  return this.find({ browserId }).sort({ lastActivity: -1 });
};

userActivitySchema.statics.findByAction = function (action: string) {
  return this.find({ action }).sort({ lastActivity: -1 });
};

userActivitySchema.statics.findByEntity = function (
  entityType: string,
  entityId: mongoose.Types.ObjectId | string
) {
  const query: Record<string, unknown> = { entityType };

  // Use appropriate field based on entity type
  switch (entityType) {
    case 'Product':
      query.productId = entityId;
      break;
    case 'Order':
      query.orderId = entityId;
      break;
    case 'Category':
      query.categoryId = entityId;
      break;
    default:
      query.entityId = entityId;
  }

  return this.find(query).sort({ lastActivity: -1 });
};

userActivitySchema.statics.findByDateRange = function (startDate: Date, endDate: Date) {
  return this.find({ lastActivity: { $gte: startDate, $lte: endDate } }).sort({ lastActivity: -1 });
};

userActivitySchema.statics.findRecent = function (limit: number = 50) {
  return this.find().sort({ lastActivity: -1 }).limit(limit);
};

userActivitySchema.statics.getCustomerStats = async function (customerId: mongoose.Types.ObjectId) {
  const activities = await this.find({ customer: customerId }).sort({ lastActivity: -1 });
  const totalActivities = activities.length;
  const lastActivity = activities.length > 0 ? activities[0].lastActivity : null;

  return { totalActivities, lastActivity };
};

export default mongoose.model<IUserActivity, IUserActivityModel>(
  'UserActivity',
  userActivitySchema
);
