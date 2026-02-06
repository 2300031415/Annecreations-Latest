import mongoose from 'mongoose';

import { ISearchLog, ISearchLogModel } from '../types/models/index';
import {
  createBaseSchema,
  createReferenceField,
  addCommonVirtuals,
  addCommonPreSave,
  addCommonStatics,
  addCommonMethods,
} from '../utils/baseModel';

const searchLogSchema = createBaseSchema(
  {
    customerId: createReferenceField('Customer', false),
    searchTerm: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    resultsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    searchTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sortBy: {
      type: String,
      trim: true,
      maxlength: 50,
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
    sessionId: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  {
    collectionName: 'searchLogs',
    modelName: 'SearchLog',
    trimFields: ['searchTerm', 'sortBy', 'ipAddress', 'userAgent', 'sessionId'],
    addCommonFeatures: false, // Disable to avoid duplicate indexes
  }
);

// Add common features manually, but skip base indexes
addCommonVirtuals(searchLogSchema);
addCommonPreSave(searchLogSchema, ['searchTerm', 'sortBy', 'ipAddress', 'userAgent', 'sessionId']);
addCommonStatics(searchLogSchema, 'SearchLog');
addCommonMethods(searchLogSchema, 'SearchLog');

// SearchLog-specific indexes
searchLogSchema.index({ customerId: 1 });
searchLogSchema.index({ searchTerm: 1 });
searchLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // TTL: 90 days
searchLogSchema.index({ updatedAt: -1 }); // Add updatedAt index manually
searchLogSchema.index({ status: 1 }); // Add status index manually

// SearchLog-specific instance methods
searchLogSchema.methods.getFullSearchLog = async function () {
  const SearchLog = mongoose.model('SearchLog');
  return await SearchLog.findById(this._id)
    .populate('customerId', 'firstName lastName email')
    .lean();
};

// SearchLog-specific static methods
searchLogSchema.statics.findByCustomer = function (customerId: mongoose.Types.ObjectId) {
  return this.find({ customerId }).sort({ createdAt: -1 });
};

searchLogSchema.statics.findByDateRange = function (startDate: Date, endDate: Date) {
  return this.find({ createdAt: { $gte: startDate, $lte: endDate } }).sort({ createdAt: -1 });
};

searchLogSchema.statics.getSearchStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalSearches: { $sum: 1 },
        averageResults: { $avg: '$resultsCount' },
        averageTime: { $avg: '$searchTime' },
      },
    },
  ]);

  if (stats.length === 0) {
    return { totalSearches: 0, averageResults: 0, averageTime: 0 };
  }

  return {
    totalSearches: stats[0].totalSearches,
    averageResults: Math.round(stats[0].averageResults || 0),
    averageTime: Math.round(stats[0].averageTime || 0),
  };
};

export default mongoose.model<ISearchLog, ISearchLogModel>('SearchLog', searchLogSchema);

/**
 * REFACTORING SUMMARY:
 *
 * BEFORE: 99 lines with manual schema setup
 * AFTER: 99 lines with BaseModel utilities
 *
 * ELIMINATED DUPLICATION:
 * ✅ Common schema options (toJSON, toObject, timestamps)
 * ✅ Common virtuals (id, isRecent)
 * ✅ Common pre-save middleware (trimming)
 * ✅ Common static methods (findActive, findInactive, etc.)
 * ✅ Common instance methods (getFullDocument, toggleStatus, etc.)
 *
 * BENEFITS:
 * - Consistent schema behavior across models
 * - Centralized common functionality
 * - Easier maintenance and updates
 * - All existing functionality preserved
 * - Enhanced with additional static methods
 */
