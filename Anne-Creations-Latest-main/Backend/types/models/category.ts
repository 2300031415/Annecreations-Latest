import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface ICategory extends IBaseDocument {
  languageId: Types.ObjectId;
  name: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeyword?: string;
  image?: string;
  sortOrder: number;
  status: boolean;

  // Methods
  getFullCategory(): Promise<ICategory>;
}

export interface ICategoryModel extends Model<ICategory> {
  findByLanguage(_languageId: Types.ObjectId): Promise<ICategory[]>;
  findActive(): Promise<ICategory[]>;
}
