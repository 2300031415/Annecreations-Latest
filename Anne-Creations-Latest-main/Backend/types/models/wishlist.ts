import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface IWishlistItem {
  product: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWishlistProduct {
  _id: string;
  productModel: string;
  sku: string;
  description: string;
  stitches: number;
  dimensions: string;
  colourNeedles: number;
  sortOrder: number;
  status: boolean;
  viewed: number;
  image: string;
  seo: string;
  categories: any[];
  additionalImages: any[];
  options: Array<{
    _id: string;
    option: any;
    price: number;
  }>;
  languageId: any;
  createdAt: Date;
  updatedAt: Date;
  dateAdded: Date;
}

export interface IWishlistResponse {
  count: number;
  products: IWishlistProduct[];
}

export interface IWishlist extends IBaseDocument {
  customerId: Types.ObjectId;
  items: IWishlistItem[];

  // Virtuals
  itemCount: number;
  isEmpty: boolean;
  recentItems: IWishlistItem[];

  // Methods
  getFullWishlist(): Promise<IWishlist>;
}

export interface IWishlistModel extends Model<IWishlist> {
  findByCustomer(_customerId: Types.ObjectId): Promise<IWishlist | null>;
  findActive(): Promise<IWishlist[]>;
  findEmpty(): Promise<IWishlist[]>;
  findByProduct(_productId: Types.ObjectId): Promise<IWishlist[]>;
}
