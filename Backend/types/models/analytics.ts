import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface IAnalyticsResponse<T = any> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  analytics?: Record<string, any>;
}

export interface IOnlineUserAnalytics {
  activeUsers: number;
  totalOnline: number;
  totalUsers: number;
}

export interface IUserActivityAnalytics {
  totalActivities: number;
  uniqueUsers: number;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  activityByDate: Array<{
    date: string;
    count: number;
  }>;
}

export interface ISearchAnalytics {
  totalSearches: number;
  uniqueSearchers: number;
  averageResults: number;
  averageTime: number;
  topQueries: Array<{
    query: string;
    count: number;
    averageResults: number;
  }>;
  searchesByDate: Array<{
    date: string;
    count: number;
  }>;
}

export interface IOrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  revenueByDate: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

export interface IProductAnalytics {
  totalProducts: number;
  activeProducts: number;
  totalViews: number;
  averageViews: number;
  topViewedProducts: Array<{
    productId: Types.ObjectId;
    productModel: string;
    views: number;
  }>;
  viewsByDate: Array<{
    date: string;
    views: number;
  }>;
}

export interface IAnalytics extends IBaseDocument {
  type: 'user_activity' | 'search' | 'order' | 'product' | 'online_users';
  data: Record<string, any>;
  period: {
    start: Date;
    end: Date;
  };
  generatedAt: Date;

  // Methods
  getAnalyticsData(): Promise<Record<string, any>>;
  updateAnalytics(): Promise<void>;
}

export interface IAnalyticsModel extends Model<IAnalytics> {
  findByType(_type: string): Promise<IAnalytics[]>;
  findByDateRange(_startDate: Date, _endDate: Date): Promise<IAnalytics[]>;
  getLatestAnalytics(_type: string): Promise<IAnalytics | null>;
  generateAnalytics(_type: string, _startDate: Date, _endDate: Date): Promise<IAnalytics>;
}
