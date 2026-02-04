import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import { FileValidationResult } from '../types/utils/index';

export const allowedImageTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
];

export const allowedOptionFileTypes = [
  'application/zip',
  'application/x-zip-compressed',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// MIME type detection based on file extension
export const getMimeTypeFromExtension = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.zip': 'application/zip',
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };

  return mimeTypes[ext] || 'application/octet-stream';
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const maxFileSizes = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  archive: 50 * 1024 * 1024, // 50MB
};

export const validateFile = (
  file: Express.Multer.File,
  allowedTypes: string[],
  maxSize: number
): FileValidationResult => {
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
      fileType: file.mimetype,
      size: file.size,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.mimetype.toLowerCase())) {
    return {
      isValid: false,
      error: `File type ${file.mimetype} is not allowed`,
      fileType: file.mimetype,
      size: file.size,
    };
  }

  return {
    isValid: true,
    fileType: file.mimetype,
    size: file.size,
  };
};

export const deleteFileIfExists = (filePath: string): boolean => {
  if (!filePath) return false;

  const fullPath = path.join(process.cwd(), filePath);
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️ Deleted file: ${fullPath}`);
      return true;
    }
  } catch (err) {
    console.error(`❌ Error deleting file ${fullPath}:`, err);
  }
  return false;
};

export const deleteDirectoryIfExists = (dirPath: string): boolean => {
  if (!dirPath) return false;

  const fullPath = path.join(process.cwd(), dirPath);
  try {
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`🗑️ Deleted directory: ${fullPath}`);
      return true;
    }
  } catch (err) {
    console.error(`❌ Error deleting directory ${fullPath}:`, err);
  }
  return false;
};

export const saveFileToDisk = (file: Express.Multer.File, publicPath: string): string => {
  ensureDirectoryExists(publicPath);

  const filename = generateFileName(file.originalname);
  const fullPath = path.join(process.cwd(), publicPath, filename);

  try {
    fs.writeFileSync(fullPath, file.buffer);
    console.log(`✅ File saved: ${fullPath}`);
    return path.posix.join(publicPath, filename); // always forward slashes
  } catch (error) {
    console.error(`❌ Error saving file: ${error}`);
    throw new Error(`Failed to save file: ${error}`);
  }
};

export const generateFileName = (
  originalName: string,
  prefix?: string,
  suffix?: string
): string => {
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);

  let filename = base;
  if (prefix) filename = `${prefix}_${filename}`;
  if (suffix) filename = `${filename}_${suffix}`;

  return `${filename}_${timestamp}_${random}${ext}`;
};

export const getFileHash = (file: Express.Multer.File): string => {
  return crypto.createHash('md5').update(file.buffer).digest('hex');
};

export const isImageFile = (mimetype: string): boolean => {
  return allowedImageTypes.includes(mimetype.toLowerCase());
};

export const isDocumentFile = (mimetype: string): boolean => {
  return allowedOptionFileTypes.includes(mimetype.toLowerCase());
};

export const getFileSizeInMB = (bytes: number): number => {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
};

export const ensureDirectoryExists = (dirPath: string): void => {
  const fullPath = path.join(process.cwd(), dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
};

export const getFileStats = (filePath: string) => {
  const fullPath = path.join(process.cwd(), filePath);
  try {
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      };
    }
    return { exists: false };
  } catch (error) {
    console.error(`❌ Error getting file stats for ${fullPath}:`, error);
    return { exists: false, error };
  }
};
