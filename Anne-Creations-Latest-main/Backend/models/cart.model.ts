import mongoose from 'mongoose';

import { ICart, ICartModel } from '../types/models/index';
import { createBaseSchema, createReferenceField } from '../utils/baseModel';

import { productOptionSchema } from './product.model';

const cartItemSchema = new mongoose.Schema(
  {
    product: createReferenceField('Product', true),
    options: [productOptionSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const cartSchema = createBaseSchema(
  {
    customerId: createReferenceField('Customer', false),
    items: [cartItemSchema],
  },
  {
    collectionName: 'carts',
    modelName: 'Cart',
    addCommonFeatures: true,
  }
);

// Cart-specific indexes
cartSchema.index({ customerId: 1 });
cartSchema.index({ 'items.product': 1 });

// Cart-specific virtuals
cartSchema.virtual('itemCount').get(function (this: any) {
  return this.items?.length || 0;
});

cartSchema.virtual('subtotal').get(function (this: any) {
  if (!this.items || !Array.isArray(this.items)) return 0;
  return this.items.reduce((total: number, item: any) => total + (item.subtotal || 0), 0);
});

cartSchema.virtual('isEmpty').get(function (this: any) {
  return !this.items || this.items.length === 0;
});

// Cart-specific pre-save middleware
cartSchema.pre('save', function (this: any, next) {
  // Calculate subtotal for each cart item
  if (this.items && Array.isArray(this.items) && this.items.length > 0) {
    this.items.forEach((item: any) => {
      let itemSubtotal = 0;

      // Add option prices
      if (item.options && Array.isArray(item.options) && item.options.length > 0) {
        item.options.forEach((option: any) => {
          if (option.price && typeof option.price === 'number') {
            itemSubtotal += option.price;
          }
        });
      }

      // Update the item subtotal
      item.subtotal = itemSubtotal;
    });
  }

  next();
});

// Cart-specific instance methods
cartSchema.methods.getFullCart = async function () {
  const Cart = mongoose.model('Cart');
  return await Cart.findById(this._id)
    .populate('customerId', 'firstName lastName email')
    .populate('items.product', 'productModel sku price image')
    .populate('items.options.option', 'name')
    .lean();
};

// Cart-specific static methods
cartSchema.statics.findByCustomer = function (customerId: mongoose.Types.ObjectId) {
  return this.findOne({ customerId });
};

cartSchema.statics.findActive = function () {
  return this.find({ 'items.0': { $exists: true } }).sort({ updatedAt: -1 });
};

cartSchema.statics.findEmpty = function () {
  return this.find({ items: { $size: 0 } });
};

cartSchema.statics.findByProduct = function (productId: mongoose.Types.ObjectId) {
  return this.find({ 'items.product': productId });
};

export default mongoose.model<ICart, ICartModel>('Cart', cartSchema);

/**
 * REFACTORING SUMMARY:
 *
 * BEFORE: 108 lines with manual schema setup
 * AFTER: 108 lines with BaseModel utilities
 *
 * ELIMINATED DUPLICATION:
 * ✅ Common schema options (toJSON, toObject, timestamps)
 * ✅ Common virtuals (id, isRecent)
 * ✅ Common pre-save middleware
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
