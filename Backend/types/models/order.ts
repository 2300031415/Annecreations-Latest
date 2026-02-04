import { Model, Types } from 'mongoose';

import { IBaseDocument, IProductItem } from './base';

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded' | 'failed' | 'authorized';

export interface IOrderTotal {
  code: 'total' | 'subtotal' | 'couponDiscount';
  value: number;
  sortOrder: number;
}

export interface IOrderHistory {
  orderStatus: OrderStatus;
  comment: string;
  notify: boolean;
  createdAt?: Date;
}

export interface IOrder extends IBaseDocument {
  customer?: Types.ObjectId;
  paymentFirstName: string;
  paymentLastName: string;
  paymentCompany?: string;
  paymentAddress1: string;
  paymentAddress2?: string;
  paymentCity: string;
  paymentPostcode: string;
  paymentCountry: string;
  paymentZone?: string;
  paymentAddressFormat?: string;
  paymentMethod: string;
  paymentCode: string;
  orderTotal: number;
  orderStatus: OrderStatus;
  languageId?: Types.ObjectId;
  ipAddress?: string;
  forwardedIp?: string;
  userAgent?: string;
  acceptLanguageId?: string;
  source?: 'mobile' | 'web';
  products: IProductItem[];
  totals: IOrderTotal[];
  history: IOrderHistory[];
  coupon: Types.ObjectId;
  razorpayOrderId?: string;
  orderNumber?: string;

  // Virtuals
  customerFullName: string;
  isDownloadable: boolean;

  // Methods
  getFullOrder(): Promise<IOrder>;
}

export interface IOrderModel extends Model<IOrder> {
  findByStatus(_status: OrderStatus): Promise<IOrder[]>;
  findByCustomer(_customerId: Types.ObjectId): Promise<IOrder[]>;
  findByOrderNumber(_orderNumber: string): Promise<IOrder | null>;
}
