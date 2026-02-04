import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface IRazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id?: string;
  status: string;
  attempts: number;
  notes: Record<string, any>;
  created_at: number;
}

export interface IRazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id?: string;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status?: string;
  captured: boolean;
  description?: string;
  card_id?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  email: string;
  contact: string;
  notes: Record<string, any>;
  fee: number;
  tax: number;
  error_code?: string;
  error_description?: string;
  error_source?: string;
  error_step?: string;
  error_reason?: string;
  acquirer_data?: Record<string, any>;
  created_at: number;
}

export interface IRazorpayRefund {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  notes: Record<string, any>;
  receipt?: string;
  acquirer_data?: Record<string, any>;
  created_at: number;
}

export interface IPaymentVerification {
  orderId: string;
  paymentId: string;
  signature: string;
  isValid: boolean;
  error?: string;
}

export interface IPaymentStatus {
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  method: string;
  timestamp: Date;
  error?: string;
}

export interface IPayment extends IBaseDocument {
  orderId: Types.ObjectId;
  customerId: Types.ObjectId;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  razorpayPaymentId?: string;
  paymentDetails?: Record<string, any>;
  errorDetails?: Record<string, any>;
  completedAt?: Date;
  refundedAt?: Date;

  // Methods
  verifyPayment(): Promise<boolean>;
  processRefund(): Promise<void>;
  getPaymentStatus(): Promise<IPaymentStatus>;
}

export interface IPaymentModel extends Model<IPayment> {
  findByOrder(_orderId: Types.ObjectId): Promise<IPayment | null>;
  findByCustomer(_customerId: Types.ObjectId): Promise<IPayment[]>;
  findByStatus(_status: string): Promise<IPayment[]>;
  getPaymentStats(): Promise<{
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
  }>;
}
