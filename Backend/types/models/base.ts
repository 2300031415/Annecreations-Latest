import { Document, Types } from 'mongoose';

// ===== BASE INTERFACES =====
export interface IBaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ===== COMMON INTERFACES =====
export interface IAdditionalImage extends IBaseDocument {
  image: string;
  sortOrder: number;
}

export interface IProductItem {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  options: IProductOption[];
  subtotal: number;
}

export interface IProductOption extends IBaseDocument {
  option: Types.ObjectId;
  price: number;
  uploadedFilePath: string;
  downloadCount?: number;
  fileSize?: number;
  mimeType?: string;
}
