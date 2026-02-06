import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface IDownloadRequest {
  productId: string;
  optionId: string;
  customerId: string;
}

export interface IDownloadVerification {
  isValid: boolean;
  hasPurchased: boolean;
  orderId?: string;
  purchaseDate?: Date;
  error?: string;
}

export interface IDownloadFile {
  productId: Types.ObjectId;
  optionId: Types.ObjectId;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadCount: number;
  lastDownloaded?: Date;
}

export interface IDownloadResponse {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  message: string;
  downloadUrl?: string;
}

export interface IDownloadStats {
  totalDownloads: number;
  uniqueUsers: number;
  downloadsByProduct: Array<{
    productId: Types.ObjectId;
    productModel: string;
    downloads: number;
  }>;
  downloadsByDate: Array<{
    date: string;
    count: number;
  }>;
}

export interface IDownload extends IBaseDocument {
  customerId: Types.ObjectId;
  productId: Types.ObjectId;
  optionId: Types.ObjectId;
  orderId: Types.ObjectId;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadCount: number;
  lastDownloaded?: Date;
  ipAddress?: string;
  userAgent?: string;

  // Methods
  incrementDownloadCount(): Promise<void>;
  getDownloadInfo(): Promise<IDownloadFile>;
  validateAccess(_customerId: Types.ObjectId): Promise<boolean>;
}

export interface IDownloadModel extends Model<IDownload> {
  findByCustomer(_customerId: Types.ObjectId): Promise<IDownload[]>;
  findByProduct(_productId: Types.ObjectId): Promise<IDownload[]>;
  findByOrder(_orderId: Types.ObjectId): Promise<IDownload[]>;
  getDownloadStats(_startDate?: Date, _endDate?: Date): Promise<IDownloadStats>;
  getTopDownloads(_limit?: number): Promise<IDownload[]>;
}
