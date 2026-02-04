import mongoose from 'mongoose';

import { IOption, IOptionModel } from '../types/models/index';
import {
  getBaseSchemaOptions,
  addCommonVirtuals,
  addCommonPreSave,
  addBaseIndexes,
} from '../utils/baseModel';

const productOptionSchema = new mongoose.Schema(
  {
    languageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Language',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  getBaseSchemaOptions('productOptions')
);

// Apply common schema utilities
addBaseIndexes(productOptionSchema);
addCommonVirtuals(productOptionSchema);
addCommonPreSave(productOptionSchema, ['name']);

// Custom virtual for display name
productOptionSchema.virtual('displayName').get(function (this: any) {
  return this.name;
});

// Indexes for performance and search
productOptionSchema.index({ name: 1 });
productOptionSchema.index({ sortOrder: 1 });
productOptionSchema.index({ name: 'text' });

// Method to get product option with populated data
productOptionSchema.methods.getFullProductOption = async function () {
  const ProductOption = mongoose.model('ProductOption');
  return await ProductOption.findById(this._id).populate('languageId', 'name code').lean();
};

// Static method to find active options
productOptionSchema.statics.findActive = function () {
  return this.find({ status: true }).sort({ sortOrder: 1 });
};

// Static method to find by name
productOptionSchema.statics.findByName = function (name: string) {
  return this.findOne({ name: new RegExp(name, 'i') });
};

// Static method to find by type
productOptionSchema.statics.findByType = function (type: string) {
  return this.find({ type, status: true }).sort({ sortOrder: 1 });
};

// Export the model
export default mongoose.model<IOption, IOptionModel>('ProductOption', productOptionSchema);
