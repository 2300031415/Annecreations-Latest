import { Model } from 'mongoose';
import mongoose from 'mongoose';

import { IBaseDocument } from './base';

export interface ICoupon extends IBaseDocument {
  name: string;
  code: string;
  type: 'F' | 'P'; // Fixed or Percentage
  discount: number;
  logged: boolean;
  minAmount: number;
  maxDiscount: number;
  dateStart: Date;
  dateEnd: Date;
  totalUses: number;
  customerUses: number;
  status: boolean;
  autoApply: boolean; // Auto-apply coupon at checkout

  // Virtuals
  discountDisplay: string;
  isValid: boolean;

  // Methods
  getFullCoupon(): Promise<ICoupon>;
  isValidForAmount(amount: number): boolean;
  calculateDiscount(amount: number): number;
  canBeUsed(): Promise<boolean>;
  canBeUsedByCustomer(_customerId: mongoose.Types.ObjectId): Promise<boolean>;
}

export interface ICouponModel extends Model<ICoupon> {
  findByCode(_code: string): Promise<ICoupon | null>;
  findActive(): Promise<ICoupon[]>;
  findValid(): Promise<ICoupon[]>;
  findByType(_type: 'F' | 'P'): Promise<ICoupon[]>;
  findAutoApply(): Promise<ICoupon | null>;
}
