import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface IUserActivity extends IBaseDocument {
  customer?: Types.ObjectId; // Only for logged-in customers
  action: string;
  entityType?:
    | 'Product'
    | 'Order'
    | 'Customer'
    | 'Category'
    | 'Cart'
    | 'Wishlist'
    | 'Search'
    | 'Auth'
    | 'Other';
  // Direct entity references instead of generic Entity reference
  productId?: Types.ObjectId;
  orderId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  // Generic entity ID for other types
  entityId?: string;
  activityData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  browserId?: string;
  source: 'web' | 'mobile';
  lastActivity: Date;

  // Virtuals
  isRecent: boolean;

  // Methods
  getFullUserActivity(): Promise<IUserActivity>;
}

export interface IUserActivityModel extends Model<IUserActivity> {
  findByCustomer(_customerId: Types.ObjectId): Promise<IUserActivity[]>;
  findByBrowserId(_browserId: string): Promise<IUserActivity[]>;
  findByAction(_action: string): Promise<IUserActivity[]>;
  findByEntity(_entityType: string, _entityId: Types.ObjectId | string): Promise<IUserActivity[]>;
  findByDateRange(_startDate: Date, _endDate: Date): Promise<IUserActivity[]>;
  findRecent(_limit?: number): Promise<IUserActivity[]>;
  getCustomerStats(
    _customerId: Types.ObjectId
  ): Promise<{ totalActivities: number; lastActivity: Date }>;
}
