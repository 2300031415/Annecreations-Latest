import { Model, Types } from 'mongoose';

import { IBaseDocument, IAdditionalImage, IProductOption } from './base';

export interface IProductSEO {
  metaTitle?: string;
  metaDescription?: string;
  metaKeyword?: string;
}

export interface IProduct extends IBaseDocument {
  languageId: Types.ObjectId;
  productModel: string;
  sku: string;
  description?: string;
  stitches: string;
  dimensions: string;
  colourNeedles: string;
  sortOrder: number;
  status: boolean;
  viewed: number;
  salesCount: number;
  weeklySalesCount: number;
  isBestSeller: boolean;
  image?: string;
  seo?: IProductSEO;
  categories: Types.ObjectId[];
  todayDeal: boolean;
  todayDealExpiry?: Date;
  activeDiscount: boolean;
  additionalImages: IAdditionalImage[];
  options: IProductOption[];
  averageRating?: number;
  reviewCount?: number;

  // Virtuals
  fullName: string;
  isAvailable: boolean;

  // Methods
  getFullProduct(): Promise<IProduct>;
}

export interface IProductModel extends Model<IProduct> {
  findByProductAndOption(
    _productId: Types.ObjectId,
    _optionId: Types.ObjectId
  ): Promise<IProduct | null>;
}
