import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface ISessionHistory {
  url?: string;
  referrer?: string;
  browsingPhase: 'guest' | 'customer';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISessionPhase {
  phase: 'guest' | 'customer';
  startTime: Date;
  endTime?: Date;
  pageViews: number;
}

export interface IIPHistory {
  ip: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOnlineUser extends IBaseDocument {
  userType: 'customer' | 'guest';
  customer?: Types.ObjectId;
  browserId: string;
  ipAddress: string;
  userAgent?: string;
  source: 'web' | 'mobile';
  lastActivity: Date;
  pageUrl?: string;

  // Enhanced tracking fields
  sessionHistory: ISessionHistory[];
  loginTime?: Date;
  totalPageViews: number;
  guestPageViews: number;
  customerPageViews: number;
  sessionPhases: ISessionPhase[];
  ipHistory: IIPHistory[];
}

export interface IOnlineUserModel extends Model<IOnlineUser> {
  findByBrowserId(_browserId: string): Promise<IOnlineUser | null>;
  findByCustomer(_customerId: Types.ObjectId): Promise<IOnlineUser | null>;
}
