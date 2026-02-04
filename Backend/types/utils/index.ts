import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';

// ===== FILE UTILITIES INTERFACES =====
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: string;
  size?: number;
}

export interface FileStats {
  size: number;
  sizeMB: number;
  created: Date;
  modified: Date;
  isFile: boolean;
  isDirectory: boolean;
}

export interface FileUploadResult {
  success: boolean;
  path?: string;
  error?: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// ===== MULTER CONFIG INTERFACES =====
export interface MulterOptions {
  allowedTypes: string[];
  maxFiles?: number;
  maxSizeMB?: number;
  fieldLimits?: Record<string, number>;
  fileSizeLimit?: number;
}

export interface MulterErrorHandler {
  (_error: Error | MulterError, _req: Request, _res: Response, _next: NextFunction): void;
}

export interface FileValidationMiddleware {
  (
    _allowedTypes: string[],
    _maxSize: number
  ): (_req: Request, _res: Response, _next: NextFunction) => void;
}

// ===== EMAIL SERVICE INTERFACES =====
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailServiceConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// ===== DATABASE BACKUP INTERFACES =====
export interface BackupMetadata {
  timestamp: string;
  database: string;
  collections: string[];
  createdBy: string;
  version?: string;
}

export interface BackupInfo {
  name: string;
  path: string;
  created: string | Date;
  database?: string;
  size: number;
  metadata?: BackupMetadata;
}

export interface BackupOptions {
  collections?: string[];
  compression?: boolean;
  includeMetadata?: boolean;
  customName?: string;
}

export interface RestoreOptions {
  dropExisting?: boolean;
  validateOnly?: boolean;
  collections?: string[];
}

// ===== JWT UTILITIES INTERFACES =====
export interface JWTPayload {
  userId: string;
  userType: 'admin' | 'customer';
  email?: string;
  username?: string;
  iat?: number;
  exp?: number;
}

// ===== SEARCH INTERFACES =====
export interface SearchFilters {
  category?: string;
  price?: {
    min?: number;
    max?: number;
  };
  status?: boolean;
  language?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}

// ===== API RESPONSE INTERFACES =====
export interface ApiResponse<T = unknown> {
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
