import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface IFileValidationResult {
  isValid: boolean;
  error?: string;
  fileType: string;
  size: number;
}

export interface IFileInfo {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  encoding: string;
  uploadedAt: Date;
  uploadedBy?: Types.ObjectId;
  category: 'image' | 'document' | 'archive' | 'other';
  status: 'active' | 'deleted' | 'archived';
}

export interface IFileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

export interface IFileStorage {
  type: 'local' | 's3' | 'gcs' | 'azure';
  path: string;
  url?: string;
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
}

export interface IFile extends IBaseDocument {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  encoding: string;
  uploadedBy?: Types.ObjectId;
  category: 'image' | 'document' | 'archive' | 'other';
  status: 'active' | 'deleted' | 'archived';
  storage: IFileStorage;
  metadata?: Record<string, any>;
  tags?: string[];
  downloadCount: number;
  lastAccessed?: Date;

  // Methods
  getFileInfo(): Promise<IFileInfo>;
  validateFile(): Promise<IFileValidationResult>;
  incrementDownloadCount(): Promise<void>;
  softDelete(): Promise<void>;
  restore(): Promise<void>;
}

export interface IFileModel extends Model<IFile> {
  findByCategory(_category: string): Promise<IFile[]>;
  findByUploader(_uploaderId: Types.ObjectId): Promise<IFile[]>;
  findByStatus(_status: string): Promise<IFile[]>;
  findByMimeType(_mimeType: string): Promise<IFile[]>;
  getFileStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByCategory: Record<string, number>;
    filesByStatus: Record<string, number>;
  }>;
  cleanupDeletedFiles(_daysToKeep: number): Promise<number>;
}

export interface IFileSettings {
  allowedTypes: string[];
  maxFileSize: number;
  uploadPath: string;
  tempPath: string;
  storage: {
    type: 'local' | 's3' | 'gcs' | 'azure';
    config: Record<string, any>;
  };
  compression: {
    enabled: boolean;
    quality: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  security: {
    scanForViruses: boolean;
    allowedExtensions: string[];
    blockedExtensions: string[];
  };
}
