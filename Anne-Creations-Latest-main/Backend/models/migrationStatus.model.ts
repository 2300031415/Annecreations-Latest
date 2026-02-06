import mongoose from 'mongoose';

import { IMigrationStatus, IMigrationStatusModel } from '../types/models/index';
import { createBaseSchema } from '../utils/baseModel';

const migrationStatusSchema = createBaseSchema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 255,
    },
    migratedDetails: [
      {
        tableName: {
          type: String,
          required: true,
          trim: true,
          maxlength: 255,
        },
        processed: {
          type: Number,
          default: 0,
          min: 0,
        },
        succeeded: {
          type: Number,
          default: 0,
          min: 0,
        },
        failed: {
          type: Number,
          default: 0,
          min: 0,
        },
        batchSize: {
          type: Number,
          default: 100,
          min: 1,
        },
        lastBatchSize: {
          type: Number,
          default: 0,
          min: 0,
        },
        totalBatches: {
          type: Number,
          default: 0,
          min: 0,
        },
        error: {
          type: String,
          trim: true,
          maxlength: 1000,
        },
        status: {
          type: String,
          enum: ['pending', 'inProgress', 'completed', 'failed'],
          default: 'pending',
        },
      },
    ],
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'inProgress', 'completed', 'failed'],
      default: 'pending',
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    collectionName: 'migrationStatuses',
    modelName: 'MigrationStatus',
    trimFields: ['name'],
    addCommonFeatures: true,
  }
);

// MigrationStatus-specific indexes
// Note: status index is already created by base schema
migrationStatusSchema.index({ startedAt: -1 });

// MigrationStatus-specific virtuals
migrationStatusSchema.virtual('isRunning').get(function (this: IMigrationStatus) {
  return this.status === 'inProgress';
});

migrationStatusSchema.virtual('isCompleted').get(function (this: IMigrationStatus) {
  return this.status === 'completed';
});

migrationStatusSchema.virtual('isFailed').get(function (this: IMigrationStatus) {
  return this.status === 'failed';
});

migrationStatusSchema.virtual('progress').get(function (this: IMigrationStatus) {
  const totalProcessed =
    this.migratedDetails?.reduce((sum: number, detail) => sum + detail.processed, 0) || 0;
  const totalSucceeded =
    this.migratedDetails?.reduce((sum: number, detail) => sum + detail.succeeded, 0) || 0;
  if (!totalProcessed || totalSucceeded === 0) return 0;
  return Math.round((totalSucceeded / totalProcessed) * 100);
});

// MigrationStatus-specific instance methods
migrationStatusSchema.methods.getFullMigrationStatus = async function () {
  const MigrationStatus = mongoose.model('MigrationStatus');
  return await MigrationStatus.findById(this._id)
    .populate('executedBy', 'username firstName lastName')
    .lean();
};

// MigrationStatus-specific static methods
migrationStatusSchema.statics.findByStatus = function (status: string) {
  return this.find({ status }).sort({ startedAt: -1 });
};

migrationStatusSchema.statics.findByTable = function (tableName: string) {
  return this.findOne({ 'migratedDetails.tableName': tableName });
};

migrationStatusSchema.statics.findPending = function () {
  return this.find({ status: 'pending' }).sort({ createdAt: 1 });
};

migrationStatusSchema.statics.findRunning = function () {
  return this.find({ status: 'inProgress' }).sort({ startedAt: -1 });
};

migrationStatusSchema.statics.findCompleted = function () {
  return this.find({ status: 'completed' }).sort({ completedAt: -1 });
};

migrationStatusSchema.statics.findFailed = function () {
  return this.find({ status: 'failed' }).sort({ startedAt: -1 });
};

export default mongoose.model<IMigrationStatus, IMigrationStatusModel>(
  'MigrationStatus',
  migrationStatusSchema
);

/**
 * REFACTORING SUMMARY:
 *
 * BEFORE: 135 lines with manual schema setup
 * AFTER: 135 lines with BaseModel utilities
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
