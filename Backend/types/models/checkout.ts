import { Model, Types } from 'mongoose';

import { IBaseDocument, IProductItem } from './base';

export interface ICheckoutData {
  cartId: string;
  customer: Types.ObjectId;
  products: Array<{
    product: any;
    options: Array<{
      option: any;
      price: number;
    }>;
    subtotal: number;
  }>;
  totalAmount: number;
  itemCount: number;
}

export interface IPaymentDetails {
  orderId: string;
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
}

export interface ICheckoutResponse {
  message: string;
  checkout: {
    _id: string;
    orderStatus: string;
    totalAmount: number;
    paymentMethod: string;
    paymentCode: string;
    products: Array<{
      product: any;
      options: Array<{
        option: any;
        price: number;
      }>;
      subtotal: number;
    }>;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface ICheckoutCompletion {
  orderId: string;
  comment?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export interface ICheckout extends IBaseDocument {
  customerId: Types.ObjectId;
  cartId: Types.ObjectId;
  products: IProductItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paymentDetails?: IPaymentDetails;
  expiresAt: Date;

  // Methods
  getCheckoutData(): Promise<ICheckoutData>;
  validateCheckout(): Promise<boolean>;
  completeCheckout(): Promise<void>;
}

export interface ICheckoutModel extends Model<ICheckout> {
  findByCustomer(_customerId: Types.ObjectId): Promise<ICheckout[]>;
  findByStatus(_status: string): Promise<ICheckout[]>;
  findExpired(): Promise<ICheckout[]>;
  cleanupExpired(): Promise<number>;
}
