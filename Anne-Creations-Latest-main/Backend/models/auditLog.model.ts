import mongoose from 'mongoose';

import { IAuditLog, IAuditLogModel } from '../types/models/index';
import { createBaseSchema, createReferenceField } from '../utils/baseModel';

const auditLogSchema = createBaseSchema(
  {
    user: createReferenceField('User', false),
    userType: {
      type: String,
      enum: ['admin', 'customer'],
      required: true,
    },
    username: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 255,
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 45,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    entityType: {
      type: String,
      enum: [
        'Product',
        'Customer',
        'Order',
        'Admin',
        'Category',
        'Language',
        'Country',
        'Zone',
        'Wishlist',
        'Cart',
        'SearchLog',
        'UserActivity',
        'OnlineUser',
      ],
      required: true,
    },
    // Direct entity references instead of generic Entity reference
    productId: createReferenceField('Product', false),
    orderId: createReferenceField('Order', false),
    customerId: createReferenceField('Customer', false),
    categoryId: createReferenceField('Category', false),
    adminId: createReferenceField('Admin', false),
    // Generic entity ID for other types
    entityId: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed,
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
    },
    details: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    collectionName: 'auditLogs',
    modelName: 'AuditLog',
    trimFields: ['username', 'email', 'ipAddress', 'action', 'details', 'entityId'],
    addCommonFeatures: true,
  }
);

// AuditLog-specific indexes
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ userType: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1 });
auditLogSchema.index({ productId: 1 });
auditLogSchema.index({ orderId: 1 });
auditLogSchema.index({ customerId: 1 });
auditLogSchema.index({ categoryId: 1 });
auditLogSchema.index({ adminId: 1 });
auditLogSchema.index({ entityId: 1 });
auditLogSchema.index({ ipAddress: 1 });

// AuditLog-specific virtuals
auditLogSchema.virtual('userDisplayName').get(function () {
  return this.username || this.email || 'Unknown User';
});

auditLogSchema.virtual('entityReference').get(function () {
  // Return appropriate entity reference based on entity type
  switch (this.entityType) {
    case 'Product':
      return `Product:${this.productId}`;
    case 'Order':
      return `Order:${this.orderId}`;
    case 'Customer':
      return `Customer:${this.customerId}`;
    case 'Category':
      return `Category:${this.categoryId}`;
    case 'Admin':
      return `Admin:${this.adminId}`;
    default:
      return `${this.entityType}:${this.entityId}`;
  }
});

auditLogSchema.virtual('actionSummary').get(function () {
  return `${this.action} on ${this.entityType}`;
});

// AuditLog-specific instance methods
auditLogSchema.methods.getFullAuditLog = async function () {
  const AuditLog = mongoose.model('AuditLog');
  return await AuditLog.findById(this._id)
    .populate('user')
    .populate('productId')
    .populate('orderId')
    .populate('customerId')
    .populate('categoryId')
    .populate('adminId')
    .lean();
};

// AuditLog-specific static methods
auditLogSchema.statics.findByUser = function (userId: mongoose.Types.ObjectId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

auditLogSchema.statics.findByEntity = function (
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
    case 'Customer':
      query.customerId = entityId;
      break;
    case 'Category':
      query.categoryId = entityId;
      break;
    case 'Admin':
      query.adminId = entityId;
      break;
    default:
      query.entityId = entityId;
  }

  return this.find(query).sort({ createdAt: -1 });
};

auditLogSchema.statics.findByAction = function (action: string) {
  return this.find({ action }).sort({ createdAt: -1 });
};

auditLogSchema.statics.findByDateRange = function (startDate: Date, endDate: Date) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ createdAt: -1 });
};

auditLogSchema.statics.findRecent = function (limit: number = 100) {
  return this.find().sort({ createdAt: -1 }).limit(limit);
};

export default mongoose.model<IAuditLog, IAuditLogModel>('AuditLog', auditLogSchema);
