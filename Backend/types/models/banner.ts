import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface IBannerImage {
  _id?: Types.ObjectId;
  image: string;
  status: boolean;
}

export interface IBanner extends IBaseDocument {
  title: string;
  description?: string;
  deviceType: 'mobile' | 'web';
  images: IBannerImage[];
  sortOrder: number;

  // Methods
  hasActiveImages(): boolean;
}

export interface IBannerModel extends Model<IBanner> {
  getBannersWithActiveImages(): Promise<IBanner[]>;
}
