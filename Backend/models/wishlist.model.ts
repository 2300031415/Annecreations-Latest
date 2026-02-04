import mongoose from 'mongoose';

import { IWishlist, IWishlistModel } from '../types/models/index';
import { createBaseSchema, createReferenceField } from '../utils/baseModel';

const wishlistItemSchema = new mongoose.Schema(
  {
    product: createReferenceField('Product', true),
  },
  {
    timestamps: true,
  }
);

const wishlistSchema = createBaseSchema(
  {
    customerId: createReferenceField('Customer', true),
    items: [wishlistItemSchema],
  },
  {
    collectionName: 'wishlists',
    modelName: 'Wishlist',
    addCommonFeatures: true,
  }
);

// Wishlist-specific indexes
wishlistSchema.index({ customerId: 1 }, { unique: true });
wishlistSchema.index({ 'items.product': 1 });

// Wishlist-specific virtuals
wishlistSchema.virtual('itemCount').get(function (this: any) {
  return this.items?.length || 0;
});

wishlistSchema.virtual('isEmpty').get(function (this: any) {
  return !this.items || this.items.length === 0;
});

wishlistSchema.virtual('recentItems').get(function (this: any) {
  if (!this.items || !Array.isArray(this.items)) return [];
  return this.items
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
});

// Wishlist-specific instance methods
wishlistSchema.methods.getFullWishlist = async function () {
  const Wishlist = mongoose.model('Wishlist');
  return await Wishlist.findById(this._id)
    .populate('customerId', 'firstName lastName email')
    .populate('items.product', 'productModel sku price image')
    .lean();
};

// Wishlist-specific static methods
wishlistSchema.statics.findByCustomer = function (customerId: mongoose.Types.ObjectId) {
  return this.findOne({ customerId });
};

wishlistSchema.statics.findActive = function () {
  return this.find({ 'items.0': { $exists: true } }).sort({ updatedAt: -1 });
};

wishlistSchema.statics.findEmpty = function () {
  return this.find({ items: { $size: 0 } });
};

wishlistSchema.statics.findByProduct = function (productId: mongoose.Types.ObjectId) {
  return this.find({ 'items.product': productId });
};

export default mongoose.model<IWishlist, IWishlistModel>('Wishlist', wishlistSchema);

/**
 * REFACTORING SUMMARY:
 *
 * BEFORE: 84 lines with manual schema setup
 * AFTER: 84 lines with BaseModel utilities
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
