import mongoose from 'mongoose';

import { ICouponUsage, ICouponUsageModel } from '../types/models/index';
import { createBaseSchema } from '../utils/baseModel';

const couponUsageSchema = createBaseSchema(
  {
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      required: true,
      validate: {
        validator: function (v: mongoose.Types.ObjectId) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Invalid coupon ID',
      },
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      validate: {
        validator: function (v: mongoose.Types.ObjectId) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Invalid customer ID',
      },
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      validate: {
        validator: function (v: mongoose.Types.ObjectId) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Invalid order ID',
      },
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collectionName: 'couponUsage',
    modelName: 'CouponUsage',
    addCommonFeatures: true,
  }
);

// Indexes for performance optimization
couponUsageSchema.index({ coupon: 1, customer: 1 }); // For customer usage counts
couponUsageSchema.index({ coupon: 1, usedAt: -1 }); // For usage over time queries
couponUsageSchema.index({ customer: 1, usedAt: -1 }); // For customer history
couponUsageSchema.index({ order: 1 }, { unique: true }); // One coupon per order
couponUsageSchema.index({ coupon: 1 }); // For total usage counts
couponUsageSchema.index({ usedAt: -1 }); // For time-based queries
couponUsageSchema.index({ coupon: 1, customer: 1, usedAt: -1 }); // Compound for analytics

// Static methods
couponUsageSchema.statics.getCustomerUsageCount = function (
  couponId: mongoose.Types.ObjectId,
  customerId: mongoose.Types.ObjectId
) {
  return this.countDocuments({ coupon: couponId, customer: customerId });
};

couponUsageSchema.statics.getTotalUsageCount = function (couponId: mongoose.Types.ObjectId) {
  return this.countDocuments({ coupon: couponId });
};

couponUsageSchema.statics.getUsageByCustomer = function (customerId: mongoose.Types.ObjectId) {
  return this.find({ customer: customerId })
    .populate('coupon', 'name code discount type')
    .populate('order', 'orderTotal')
    .sort({ usedAt: -1 });
};

couponUsageSchema.statics.getUsageByCoupon = function (couponId: mongoose.Types.ObjectId) {
  return this.find({ coupon: couponId })
    .populate('customer', 'firstName lastName email')
    .populate('order', 'orderTotal')
    .sort({ usedAt: -1 });
};

export default mongoose.model<ICouponUsage, ICouponUsageModel>('CouponUsage', couponUsageSchema);
