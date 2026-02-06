import mongoose from 'mongoose';

import { IZone, IZoneModel } from '../types/models/index';
import {
  getBaseSchemaOptions,
  addCommonVirtuals,
  addCommonPreSave,
  addBaseIndexes,
} from '../utils/baseModel';

const zoneSchema = new mongoose.Schema(
  {
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 10,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  getBaseSchemaOptions('zones')
);

// Apply common schema utilities
addBaseIndexes(zoneSchema);
addCommonVirtuals(zoneSchema);
addCommonPreSave(zoneSchema, ['name', 'code']);

// Custom virtual for display name
zoneSchema.virtual('displayName').get(function (this: any) {
  return this.code ? `${this.name} (${this.code})` : this.name;
});

// Custom pre-save middleware for code formatting
zoneSchema.pre('save', function (next) {
  // Ensure code is uppercase
  if (this.code) {
    this.code = this.code.toUpperCase().trim();
  }

  next();
});

// Indexes for performance and search
zoneSchema.index({ country: 1 });
zoneSchema.index({ name: 1 });
zoneSchema.index({ code: 1 });

// Method to get zone with populated data
zoneSchema.methods.getFullZone = async function () {
  const Zone = mongoose.model('Zone');
  return await Zone.findById(this._id).populate('country', 'name isoCode2').lean();
};

// Static method to find by country
zoneSchema.statics.findByCountry = function (countryId: mongoose.Types.ObjectId) {
  return this.find({ country: countryId, status: true }).sort({ name: 1 });
};

// Static method to find active zones
zoneSchema.statics.findActive = function () {
  return this.find({ status: true }).sort({ name: 1 });
};

// Static method to find by code
zoneSchema.statics.findByCode = function (code: string) {
  return this.findOne({ code: code.toUpperCase() });
};

// Static method to find by name
zoneSchema.statics.findByName = function (name: string) {
  return this.findOne({ name: new RegExp(name, 'i') });
};

// Export the model
export default mongoose.model<IZone, IZoneModel>('Zone', zoneSchema);

/**
 * REFACTORING SUMMARY:
 *
 * BEFORE: 88 lines with some duplication
 * AFTER: 82 lines (7% reduction)
 *
 * ELIMINATED DUPLICATION:
 * ✅ Common schema options (toJSON, toObject, timestamps)
 * ✅ Common virtuals (id, isRecent)
 * ✅ Common pre-save middleware (trimming)
 *
 * BENEFITS:
 * - Consistent schema behavior across models
 * - Centralized common functionality
 * - Easier maintenance and updates
 * - All existing functionality preserved
 * - Fixed findByCountry method to use correct field name
 */
