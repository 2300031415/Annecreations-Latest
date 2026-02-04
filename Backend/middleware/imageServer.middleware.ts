// middleware/imageServer.middleware.ts - FIXED FOR EXPRESS 5
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';

import express, { Request, Response, NextFunction } from 'express';

/**
 * Middleware to serve images from catalog directory
 * Maps /image/* requests to catalog/ directory
 */
export const imageServerMiddleware = express.static(path.join(process.cwd(), 'catalog'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res: Response, filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();

    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };

    const contentType = contentTypes[ext];
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    res.setHeader('Cache-Control', 'public, max-age=86400');
  },
});

/**
 * 🔧 FIXED: Custom image handler with better error handling and validation
 * This replaces the problematic wildcard route
 */
export const customImageHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract the path after /image/ from the URL and decode it
    const rawImagePath = req.url.replace('/image/', '');

    let imagePath: string;
    try {
      imagePath = decodeURIComponent(rawImagePath);
    } catch (decodeError) {
      console.error(`Failed to decode URL: ${rawImagePath}`, decodeError);
      res.status(400).json({ message: 'Invalid URL encoding' });
      return;
    }

    if (!imagePath || imagePath.includes('..') || imagePath.includes('~')) {
      res.status(403).json({ message: 'Invalid image path' });
      return;
    }

    const fullPath = path.join(process.cwd(), imagePath);

    const stats = await fs.stat(fullPath);

    if (!stats.isFile()) {
      res.status(404).json({ message: 'Image not found' });
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.zip'];

    if (!allowed.includes(ext)) {
      res.status(400).json({ message: 'Invalid image format' });
      return;
    }

    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.zip': 'application/zip',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    const etag = `"${stats.mtime.getTime()}-${stats.size}"`;

    if (req.headers['if-none-match']?.replace(/^W\//, '') === etag) {
      res.status(304).end();
      return;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Last-Modified', stats.mtime.toUTCString());
    res.setHeader('ETag', etag);

    createReadStream(fullPath).pipe(res);
  } catch (err) {
    res.status(404).json({ message: 'Image not found' });
  }
};

/**
 * Image upload validation middleware
 */
export const validateImageUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    res.status(400).json({ message: 'No image file provided' });
    return;
  }

  if (req.file.size > 5 * 1024 * 1024) {
    res.status(400).json({ message: 'Image too large (max 5MB)' });
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    res.status(400).json({ message: 'Invalid image type' });
    return;
  }

  if (!validateFileSignature(req.file.buffer, req.file.mimetype)) {
    res.status(400).json({ message: 'Invalid file signature' });
    return;
  }

  next();
};

export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) return next();

  if (req.file.size > 50 * 1024 * 1024) {
    res.status(400).json({ message: 'File too large (max 50MB)' });
    return;
  }

  const allowedTypes = [
    'application/zip',
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

  if (!allowedTypes.includes(req.file.mimetype)) {
    res.status(400).json({ message: 'Invalid file type' });
    return;
  }

  next();
};

const validateFileSignature = (buffer: Buffer, mimeType: string): boolean => {
  const signatures: Record<string, number[]> = {
    'image/jpeg': [0xff, 0xd8, 0xff],
    'image/png': [0x89, 0x50, 0x4e, 0x47],
    'image/gif': [0x47, 0x49, 0x46],
    'image/webp': [0x52, 0x49, 0x46, 0x46],
  };

  const expected = signatures[mimeType];
  if (!expected) return true;

  return expected.every((byte, index) => buffer[index] === byte);
};

export const logFileAccess = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send;

  res.send = function (data: any) {
    if (res.statusCode === 200) {
      console.log(
        `File accessed: ${req.originalUrl} - IP: ${req.ip} - Time: ${new Date().toISOString()}`
      );
    }
    return originalSend.call(this, data);
  };

  next();
};

export const rateLimitFileDownloads = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map<string, { firstRequest: number; count: number }>();

  setInterval(() => {
    const now = Date.now();
    for (const [ip, { firstRequest }] of requests.entries()) {
      if (now - firstRequest > windowMs) {
        requests.delete(ip);
      }
    }
  }, windowMs);

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = req.ip || 'unknown';
    const now = Date.now();
    const data = requests.get(clientIp);

    if (!data) {
      requests.set(clientIp, { firstRequest: now, count: 1 });
      return next();
    }

    if (now - data.firstRequest > windowMs) {
      requests.set(clientIp, { firstRequest: now, count: 1 });
      return next();
    }

    data.count++;
    if (data.count > maxRequests) {
      res.status(429).json({ message: 'Too many file requests. Try later.' });
      return;
    }

    next();
  };
};

export const cleanupOrphanedFiles = async (): Promise<void> => {
  try {
    const catalogDir = path.join(process.cwd(), 'catalog');
    const productDir = path.join(catalogDir, 'product');
    const filesDir = path.join(catalogDir, 'files');

    console.log('TODO: Implement orphaned file cleanup');
    // Step 1: List all files in productDir/filesDir
    // Step 2: Query DB for files in use
    // Step 3: Delete unused files
  } catch (err) {
    console.error('Error during cleanup:', err);
  }
};

export default {
  imageServerMiddleware,
  customImageHandler,
  validateImageUpload,
  validateFileUpload,
  logFileAccess,
  rateLimitFileDownloads,
  cleanupOrphanedFiles,
};
