import { NextFunction, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';

import { MulterOptions } from '../types/utils/index';

import { validateFile, allowedImageTypes, allowedOptionFileTypes } from './fileUtils';

export const createMulterUploader = ({
  allowedTypes,
  maxFiles = 5,
  maxSizeMB = 10,
  fieldLimits,
}: MulterOptions) => {
  const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    try {
      // Check file type
      if (!allowedTypes.includes(file.mimetype.toLowerCase())) {
        return cb(
          new multer.MulterError('LIMIT_UNEXPECTED_FILE', `Invalid file type: ${file.mimetype}`)
        );
      }

      cb(null, true);
    } catch (error) {
      cb(new Error(`File validation error: ${error}`));
    }
  };

  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxSizeMB * 1024 * 1024,
      files: maxFiles,
      ...fieldLimits,
    },
    fileFilter,
  });
};

// Pre-configured uploaders for common use cases
export const imageUploader = createMulterUploader({
  allowedTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
  ],
  maxFiles: 10,
  maxSizeMB: 5,
});

export const documentUploader = createMulterUploader({
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
  ],
  maxFiles: 5,
  maxSizeMB: 10,
});

export const archiveUploader = createMulterUploader({
  allowedTypes: [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    'application/x-tar',
  ],
  maxFiles: 3,
  maxSizeMB: 50,
});

// Error handling middleware for multer
export const handleMulterError = (
  error: Error | multer.MulterError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          message: 'File size too large',
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          message: 'Too many files',
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          message: 'Invalid file type',
        });
      default:
        return res.status(400).json({
          message: 'File upload error',
        });
    }
  }

  if (error) {
    return res.status(500).json({
      message: 'Internal server error during file upload',
    });
  }

  next();
};

// Validation middleware for uploaded files
export const validateUploadedFiles = (allowedTypes: string[], maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'No files uploaded',
      });
    }

    const files = Array.isArray(req.files) ? req.files : [req.files];
    const errors: string[] = [];

    for (const file of files) {
      const validation = validateFile(file as Express.Multer.File, allowedTypes, maxSize);
      if (!validation.isValid) {
        errors.push(`${file.originalname}: ${validation.error}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'File validation failed',
        errors,
      });
    }

    next();
  };
};

// Combined uploader for product creation using existing file type validation
export const productCreationUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max per file (matching productOptionUpload)
    files: 20, // Max 20 files total
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    try {
      // Use existing file type validation logic based on fieldname
      if (file.fieldname === 'image' || file.fieldname === 'additionalImages') {
        // Use same validation as productImageUpload
        if (!allowedImageTypes.includes(file.mimetype.toLowerCase())) {
          return cb(
            new multer.MulterError('LIMIT_UNEXPECTED_FILE', `Invalid image type: ${file.mimetype}`)
          );
        }
      } else if (file.fieldname.startsWith('options[') && file.fieldname.endsWith('].file')) {
        // Use same validation as productOptionUpload for option files
        if (!allowedOptionFileTypes.includes(file.mimetype.toLowerCase())) {
          return cb(
            new multer.MulterError(
              'LIMIT_UNEXPECTED_FILE',
              `Invalid option file type: ${file.mimetype}`
            )
          );
        }
      } else {
        return cb(
          new multer.MulterError('LIMIT_UNEXPECTED_FILE', `Unexpected field: ${file.fieldname}`)
        );
      }

      cb(null, true);
    } catch (error) {
      cb(new Error(`File validation error: ${error}`));
    }
  },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'additionalImages', maxCount: 10 },
  { name: 'options[0].file', maxCount: 1 },
  { name: 'options[1].file', maxCount: 1 },
  { name: 'options[2].file', maxCount: 1 },
  { name: 'options[3].file', maxCount: 1 },
  { name: 'options[4].file', maxCount: 1 },
  { name: 'options[5].file', maxCount: 1 },
  { name: 'options[6].file', maxCount: 1 },
  { name: 'options[7].file', maxCount: 1 },
  { name: 'options[8].file', maxCount: 1 },
  { name: 'options[9].file', maxCount: 1 },
]);
