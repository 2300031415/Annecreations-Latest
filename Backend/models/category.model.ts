import mongoose from 'mongoose';

import { ICategory, ICategoryModel } from '../types/models/index';
import { createBaseSchema, createReferenceField } from '../utils/baseModel';

const categorySchema = createBaseSchema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    metaKeyword: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    image: {
      type: String,
      trim: true,
      maxlength: 500,
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
    languageId: createReferenceField('Language', true),
  },
  {
    collectionName: 'categories',
    modelName: 'Category',
    trimFields: ['name', 'description', 'metaTitle', 'metaDescription', 'metaKeyword'],
    addCommonFeatures: true,
  }
);

// Category-specific indexes
categorySchema.index({ languageId: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ name: 'text', description: 'text' });

// Category-specific static methods
categorySchema.statics.findByLanguage = function (languageId: mongoose.Types.ObjectId) {
  return this.find({ languageId, status: true }).sort({ sortOrder: 1 });
};

// Category-specific instance methods
categorySchema.methods.getFullCategory = async function () {
  const Category = mongoose.model('Category');
  return await Category.findById(this._id).populate('languageId', 'name code').lean();
};

export default mongoose.model<ICategory, ICategoryModel>('Category', categorySchema);
