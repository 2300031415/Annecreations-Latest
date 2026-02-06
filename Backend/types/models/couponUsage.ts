import { Model } from 'mongoose';
import mongoose from 'mongoose';

import { IBaseDocument } from './base';

export interface ICouponUsage extends IBaseDocument {
  coupon: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  discountAmount: number;
  orderTotal: number;
  usedAt: Date;
}

export interface ICouponUsageModel extends Model<ICouponUsage> {
  getCustomerUsageCount(
    _couponId: mongoose.Types.ObjectId,
    _customerId: mongoose.Types.ObjectId
  ): Promise<number>;
  getTotalUsageCount(_couponId: mongoose.Types.ObjectId): Promise<number>;
  getUsageByCustomer(_customerId: mongoose.Types.ObjectId): Promise<ICouponUsage[]>;
  getUsageByCoupon(_couponId: mongoose.Types.ObjectId): Promise<ICouponUsage[]>;
}
