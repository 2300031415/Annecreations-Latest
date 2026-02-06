import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface ISalesRevenue {
  period: string;
  startDate: Date;
  endDate: Date;
  totalSales: number;
  totalRevenue: number;
}

export interface INewOrder {
  orderId: string;
  customer: string;
  total: number;
  status: string;
  createdAt: Date;
}

export interface INewOrdersResponse {
  period: string;
  startDate: Date;
  endDate: Date;
  totalOrders: number;
  orders: INewOrder[];
}

export interface ICustomerStats {
  period: string;
  startDate: Date;
  endDate: Date;
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  customersByDate: Array<{
    date: string;
    count: number;
  }>;
}

export interface IProductStats {
  period: string;
  startDate: Date;
  endDate: Date;
  totalProducts: number;
  activeProducts: number;
  totalViews: number;
  averageViews: number;
  topProducts: Array<{
    productId: Types.ObjectId;
    productModel: string;
    views: number;
    category: string;
  }>;
}

export interface IActivityStats {
  period: string;
  startDate: Date;
  endDate: Date;
  totalActivities: number;
  uniqueUsers: number;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  activitiesByDate: Array<{
    date: string;
    count: number;
  }>;
}

export interface IDashboardOverview {
  sales: ISalesRevenue;
  orders: INewOrdersResponse;
  customers: ICustomerStats;
  products: IProductStats;
  activities: IActivityStats;
  generatedAt: Date;
}

export interface IDashboard extends IBaseDocument {
  type: 'overview' | 'sales' | 'orders' | 'customers' | 'products' | 'activities';
  data: Record<string, any>;
  period: {
    start: Date;
    end: Date;
  };
  generatedAt: Date;

  // Methods
  getDashboardData(): Promise<Record<string, any>>;
  updateDashboard(): Promise<void>;
}

export interface IDashboardModel extends Model<IDashboard> {
  findByType(_type: string): Promise<IDashboard[]>;
  findByDateRange(_startDate: Date, _endDate: Date): Promise<IDashboard[]>;
  getLatestDashboard(_type: string): Promise<IDashboard | null>;
  generateDashboard(_type: string, _startDate: Date, _endDate: Date): Promise<IDashboard>;
}
