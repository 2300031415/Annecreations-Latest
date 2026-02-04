import mongoose from 'mongoose';

import { IProduct, IProductModel } from '../types/models/index';
import {
  getBaseSchemaOptions,
  addCommonVirtuals,
  addCommonPreSave,
  addBaseIndexes,
} from '../utils/baseModel';

const additionalImagesSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return Boolean(v && v.length > 0);
        },
        message: 'Image path cannot be empty',
      },
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true, strict: false }
);

export const productOptionSchema = new mongoose.Schema({
  option: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductOption',
    required: true,
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
  },
  uploadedFilePath: {
    type: String,
    required: true,
    validate: {
      validator: function (v: string) {
        return Boolean(v && v.length > 0);
      },
      message: 'File path is required for digital products',
    },
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  fileSize: {
    type: Number,
    default: 0,
    min: 0,
  },
  mimeType: {
    type: String,
    default: 'application/octet-stream',
    trim: true,
  },
});

const productSchema = new mongoose.Schema(
  {
    languageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Language',
      required: true,
    },
    productModel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    stitches: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    dimensions: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    colourNeedles: {
      type: String,
      trim: true,
      maxlength: 100,
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
    viewed: {
      type: Number,
      default: 0,
      min: 0,
    },
    salesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    weeklySalesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          return !v || v.length > 0;
        },
        message: 'Image path cannot be empty if provided',
      },
    },
    seo: {
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
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        validate: {
          validator: function (v: mongoose.Types.ObjectId) {
            return mongoose.Types.ObjectId.isValid(v);
          },
          message: 'Invalid category ID',
        },
      },
    ],
    todayDeal: {
      type: Boolean,
      default: false,
    },
    todayDealExpiry: {
      type: Date,
    },
    activeDiscount: {
      type: Boolean,
      default: false,
    },
    additionalImages: [additionalImagesSchema],
    options: [productOptionSchema],
  },
  getBaseSchemaOptions('products')
);

// Indexes for performance and search
productSchema.index({ productModel: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ languageId: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ sortOrder: 1 });

// Full-text search index
productSchema.index({
  productModel: 'text',
  sku: 'text',
  description: 'text',
  'seo.metaKeyword': 'text',
});

// Add common virtuals and indexes from BaseModel
addBaseIndexes(productSchema);
addCommonVirtuals(productSchema);

// Product-specific virtuals
productSchema.virtual('fullName').get(function (this: any) {
  return `${this.productModel} - ${this.sku}`;
});

productSchema.virtual('isAvailable').get(function (this: any) {
  return this.status === true;
});

// Add common pre-save middleware with product-specific fields to trim
addCommonPreSave(productSchema, [
  'productModel',
  'sku',
  'description',
  'stitches',
  'dimensions',
  'colourNeedles',
]);

// Method to get product with populated data
productSchema.methods.getFullProduct = async function () {
  const Product = mongoose.model('Product');
  return await Product.findById(this._id)
    .populate('languageId', 'name code')
    .populate('categories', 'name')
    .populate('options.option', 'name')
    .lean();
};

// Static method to find product by productId and optionId combination
productSchema.statics.findByProductAndOption = async function (
  productId: string | mongoose.Types.ObjectId,
  optionId: string | mongoose.Types.ObjectId
) {
  return await this.findOne({
    _id: productId,
    'options.option': optionId,
  })
    .populate('languageId', 'name code')
    .populate('categories', 'name')
    .populate('options.option', 'name')
    .lean();
};

export default mongoose.model<IProduct, IProductModel>('Product', productSchema);
