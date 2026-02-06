// models/coupon.model.js
import mongoose from 'mongoose';

import { ICoupon, ICouponModel } from '../types/models/index';
import { createBaseSchema, commonFields } from '../utils/baseModel';
import { ValidationPatterns } from '../utils/validationHelpers';

const couponSchema = createBaseSchema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 50,
      validate: {
        validator: function (v: string) {
          return ValidationPatterns.COUPON_CODE.test(v);
        },
        message: 'Invalid coupon code format',
      },
    },
    type: {
      type: String,
      enum: ['F', 'P'], // Fixed or Percentage
      default: 'P',
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (v: number) {
          if (this.type === 'P') {
            return v >= 0 && v <= 100; // Percentage: 0-100%
          }
          return v >= 0; // Fixed: any positive amount
        },
        message: 'Invalid discount value',
      },
    },
    logged: {
      type: Boolean,
      default: false,
    },
    minAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dateStart: {
      type: Date,
      default: Date.now,
    },
    dateEnd: {
      type: Date,
    },
    totalUses: {
      type: Number,
      default: 1,
      min: 0,
    },
    customerUses: {
      type: Number,
      default: 1,
      min: 0,
    },
    autoApply: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: commonFields.status,
    languageId: commonFields.languageId,
  },
  {
    collectionName: 'coupons',
    modelName: 'Coupon',
    trimFields: ['name', 'code'],
    addCommonFeatures: true,
  }
);

// Schema-level validation for date fields
couponSchema.pre('validate', function (next) {
  if (this.dateStart && this.dateEnd && this.dateEnd <= this.dateStart) {
    const error = new Error('End date must be after start date');
    (error as any).name = 'ValidationError';
    (error as any).path = 'dateEnd';
    return next(error);
  }
  next();
});

// Coupon-specific indexes for performance optimization
// Note: code index is already created by unique: true in schema definition
// Note: status and createdAt indexes are already created by base schema
couponSchema.index({ status: 1, dateStart: 1, dateEnd: 1 }); // Active coupon queries
couponSchema.index({ dateStart: 1 });
couponSchema.index({ dateEnd: 1 });
couponSchema.index({ type: 1 });
couponSchema.index({ languageId: 1 });
couponSchema.index({ autoApply: 1, status: 1 }); // Auto-apply coupon queries

// Coupon-specific virtuals
couponSchema.virtual('discountDisplay').get(function () {
  return this.type === 'P' ? `${this.discount}%` : `₹ ${this.discount}`;
});

couponSchema.virtual('isValid').get(function () {
  const now = new Date();
  return this.status && this.dateStart <= now && (!this.dateEnd || this.dateEnd >= now);
});

couponSchema.virtual('isExpired').get(function () {
  const now = new Date();
  return this.dateEnd && this.dateEnd < now;
});

// Coupon-specific static methods
couponSchema.statics.findValid = function () {
  const now = new Date();
  return this.find({
    status: true,
    dateStart: { $lte: now },
    $or: [{ dateEnd: { $exists: false } }, { dateEnd: { $gte: now } }],
  });
};

couponSchema.statics.findByCode = function (code: string) {
  return this.findOne({ code: code.toUpperCase() });
};

couponSchema.statics.findByType = function (type: 'F' | 'P') {
  return this.find({ type, status: true });
};

couponSchema.statics.findByLanguage = function (languageId: mongoose.Types.ObjectId) {
  return this.find({ languageId, status: true });
};

couponSchema.statics.findAutoApply = function () {
  const now = new Date();
  return this.findOne({
    autoApply: true,
    status: true,
    dateStart: { $lte: now },
    $or: [{ dateEnd: { $exists: false } }, { dateEnd: { $gte: now } }],
  }).lean();
};

// Coupon-specific instance methods
couponSchema.methods.isValidForAmount = function (amount: number) {
  return amount >= this.minAmount;
};

couponSchema.methods.calculateDiscount = function (amount: number) {
  if (!this.isValidForAmount(amount)) {
    return 0;
  }

  let discount = 0;
  if (this.type === 'P') {
    discount = (amount * this.discount) / 100;
  } else {
    discount = this.discount;
  }

  // Apply max discount limit if set
  if (this.maxDiscount > 0 && discount > this.maxDiscount) {
    discount = this.maxDiscount;
  }

  return Math.min(discount, amount); // Discount cannot exceed amount
};

couponSchema.methods.canBeUsed = async function () {
  if (!this.isValid) return false;

  // Check if total usage limit is reached
  const CouponUsage = mongoose.model('CouponUsage') as any;
  const totalUsage = await CouponUsage.getTotalUsageCount(this._id);

  return this.totalUses === 0 || totalUsage < this.totalUses;
};

couponSchema.methods.canBeUsedByCustomer = async function (customerId: mongoose.Types.ObjectId) {
  if (!this.isValid) return false;

  const CouponUsage = mongoose.model('CouponUsage') as any;

  // Check total usage limit
  const totalUsage = await CouponUsage.getTotalUsageCount(this._id);
  if (this.totalUses > 0 && totalUsage >= this.totalUses) {
    return false;
  }

  // Check per-customer usage limit
  const customerUsage = await CouponUsage.getCustomerUsageCount(this._id, customerId);
  return this.customerUses === 0 || customerUsage < this.customerUses;
};

export default mongoose.model<ICoupon, ICouponModel>('Coupon', couponSchema);
