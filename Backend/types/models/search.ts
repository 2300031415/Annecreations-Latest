import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface ISearchQuery {
  query: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface ISearchResult {
  _id: string;
  productModel: string;
  sku: string;
  description?: string;
  image?: string;
  status: boolean;
  categories: any[];
  options: Array<{
    _id: string;
    option: any;
    price: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISearchResponse {
  products: ISearchResult[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  query: string;
  suggestions?: string[];
}

export interface ISearchSuggestion {
  type: 'product' | 'category' | 'tag';
  value: string;
  count: number;
  relevance: number;
}

export interface ISearchFilters {
  status?: boolean;
  categories?: Types.ObjectId[];
  priceRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ISearch extends IBaseDocument {
  query: string;
  customerId?: Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  resultsCount: number;
  searchTime: number;
  filters?: ISearchFilters;
  suggestions?: ISearchSuggestion[];

  // Methods
  getSearchResults(): Promise<ISearchResult[]>;
  getSuggestions(): Promise<ISearchSuggestion[]>;
}

export interface ISearchModel extends Model<ISearch> {
  findByQuery(_query: string): Promise<ISearch[]>;
  findByCustomer(_customerId: Types.ObjectId): Promise<ISearch[]>;
  getPopularSearches(_limit?: number): Promise<ISearch[]>;
  getSearchStats(): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    averageResults: number;
    averageTime: number;
  }>;
}
