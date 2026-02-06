import mongoose from 'mongoose';

import { ICountry, ICountryModel } from '../types/models/index';
import {
  getBaseSchemaOptions,
  addCommonVirtuals,
  addCommonPreSave,
  addBaseIndexes,
} from '../utils/baseModel';

const countrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    isoCode2: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 2,
    },
    isoCode3: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 3,
    },
    addressFormat: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    postcodeRequired: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  getBaseSchemaOptions('countries')
);

// Apply common schema utilities
addBaseIndexes(countrySchema);
addCommonVirtuals(countrySchema);
addCommonPreSave(countrySchema, ['name', 'isoCode2', 'isoCode3']);

// Custom virtual for display name
countrySchema.virtual('displayName').get(function (this: any) {
  return `${this.name} (${this.isoCode2})`;
});

// Custom pre-save middleware for ISO code formatting
countrySchema.pre('save', function (next) {
  // Ensure ISO codes are uppercase
  if (this.isoCode2) {
    this.isoCode2 = this.isoCode2.toUpperCase().trim();
  }

  if (this.isoCode3) {
    this.isoCode3 = this.isoCode3.toUpperCase().trim();
  }

  next();
});

// Indexes for performance and search
countrySchema.index({ name: 1 });
countrySchema.index({ isoCode2: 1 });
countrySchema.index({ isoCode3: 1 });

// Method to get country with populated data
countrySchema.methods.getFullCountry = async function () {
  const Country = mongoose.model('Country');
  return await Country.findById(this._id).lean();
};

// Static method to find by ISO code
countrySchema.statics.findByIsoCode = function (isoCode: string) {
  const code = isoCode.toUpperCase();
  return this.findOne({
    $or: [{ isoCode2: code }, { isoCode3: code }],
  });
};

// Static method to find active countries
countrySchema.statics.findActive = function () {
  return this.find({ status: true }).sort({ name: 1 });
};

// Static method to find by name
countrySchema.statics.findByName = function (name: string) {
  return this.findOne({ name: new RegExp(name, 'i') });
};

// Export the model
export default mongoose.model<ICountry, ICountryModel>('Country', countrySchema);
