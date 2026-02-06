import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface ISearchLog extends IBaseDocument {
  query: string;
  customerId?: Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  resultsCount: number;
  searchTime: number;
  filters?: Record<string, unknown>;

  // Methods
  getFullSearchLog(): Promise<ISearchLog>;
}

export interface ISearchLogModel extends Model<ISearchLog> {
  findByCustomer(_customerId: Types.ObjectId): Promise<ISearchLog[]>;
  findByDateRange(_startDate: Date, _endDate: Date): Promise<ISearchLog[]>;
  getSearchStats(): Promise<{ totalSearches: number; averageResults: number; averageTime: number }>;
}
