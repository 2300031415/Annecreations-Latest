import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface IAuditLog extends IBaseDocument {
  user?: Types.ObjectId;
  userType: 'admin' | 'customer';
  username?: string;
  email?: string;
  ipAddress?: string;
  action: string;
  entityType:
    | 'Product'
    | 'Customer'
    | 'Order'
    | 'Admin'
    | 'Category'
    | 'Language'
    | 'Country'
    | 'Zone'
    | 'Wishlist'
    | 'Cart'
    | 'SearchLog'
    | 'UserActivity'
    | 'OnlineUser';
  // Direct entity references instead of generic Entity reference
  productId?: Types.ObjectId;
  orderId?: Types.ObjectId;
  customerId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  adminId?: Types.ObjectId;
  // Generic entity ID for other types
  entityId?: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  details?: string;

  // Virtuals
  userDisplayName: string;
  entityReference: string;
  actionSummary: string;

  // Methods
  getFullAuditLog(): Promise<IAuditLog>;
}

export interface IAuditLogModel extends Model<IAuditLog> {
  findByUser(_userId: Types.ObjectId): Promise<IAuditLog[]>;
  findByEntity(_entityType: string, _entityId: Types.ObjectId | string): Promise<IAuditLog[]>;
  findByAction(_action: string): Promise<IAuditLog[]>;
  findByDateRange(_startDate: Date, _endDate: Date): Promise<IAuditLog[]>;
  findRecent(_limit?: number): Promise<IAuditLog[]>;
}
