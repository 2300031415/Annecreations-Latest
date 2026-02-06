import express from 'express';
import multer from 'multer';

import bannerController from '../controllers/banner.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Feature, PermissionAction } from '../types/models/role';
import { allowedImageTypes } from '../utils/fileUtils';
import { createMulterUploader } from '../utils/multerConfig';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Banner:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique banner identifier
 *           example: "507f1f77bcf86cd799439011"
 *         title:
 *           type: string
 *           maxLength: 255
 *           description: Banner title
 *           example: "Summer Sale 2024"
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Banner description (optional)
 *           example: "Get up to 50% off on selected items"
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 description: Image object ID
 *               image:
 *                 type: string
 *                 description: Image path with /image/ prefix
 *               status:
 *                 type: boolean
 *                 description: Image status (active/inactive)
 *           description: Array of banner images with status
 *           example: [{"_id": "507f191e810c19729de860ea", "image": "image/catalog/banners/mobile/banner1.jpg", "status": true}]
 *         deviceType:
 *           type: string
 *           enum: [mobile, web]
 *           description: Device type for the entire banner
 *           example: "mobile"
 *         sortOrder:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Sort order for display
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Banner creation timestamp
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00Z"
 *
 *     BannerCreate:
 *       type: object
 *       required:
 *         - title
 *         - deviceType
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 255
 *           description: Banner title (required)
 *           example: "Summer Sale 2024"
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Banner description (optional)
 *           example: "Get up to 50% off on selected items"
 *         deviceType:
 *           type: string
 *           enum: [mobile, web]
 *           description: Device type for the banner (required)
 *           example: "mobile"
 *         sortOrder:
 *           type: number
 *           minimum: 0
 *           description: Sort order for display (optional, default 0)
 *           example: 1
 *         mobileImages:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: Mobile banner images (max 5MB each, PNG/JPG) - only when deviceType is mobile
 *         webImages:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: Web banner images (max 5MB each, PNG/JPG) - only when deviceType is web
 *
 *     BannerImageUpdate:
 *       type: object
 *       required:
 *         - imageId
 *         - status
 *       properties:
 *         imageId:
 *           type: string
 *           description: ID of the image to update (_id from the image object)
 *           example: "507f1f77bcf86cd799439012"
 *         status:
 *           type: boolean
 *           description: New status for the image
 *           example: true
 *
 *     BannerImageDelete:
 *       type: object
 *       required:
 *         - imagePaths
 *       properties:
 *         imagePaths:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image paths to delete
 *           example: ["catalog/banners/mobile/banner1.jpg"]
 */

// ✅ PUBLIC ROUTES

/**
 * @swagger
 * /banners:
 *   get:
 *     summary: Get all active banners
 *     description: Retrieve all active banners within their date range (public access)
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: Active banners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Array of active image paths with /image/ prefix
 *                       deviceType:
 *                         type: string
 *                         enum: [mobile, web]
 *                       sortOrder:
 *                         type: number
 *                 count:
 *                   type: integer
 *                   description: Total number of active banners
 *                   example: 5
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   data:
 *                     - _id: "507f1f77bcf86cd799439011"
 *                       title: "Summer Sale"
 *                       description: "Get 50% off"
 *                       images: ["image/catalog/banners/mobile/summer_mobile.jpg"]
 *                       deviceType: "mobile"
 *                       sortOrder: 1
 *                   count: 1
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', bannerController.getAllBanners);

// Configure multer for banner images
const bannerImageUpload = createMulterUploader({
  allowedTypes: allowedImageTypes,
  maxFiles: 20, // Allow up to 20 images total (combined mobile and website)
  maxSizeMB: 5,
});

// ✅ ADMIN ROUTES

/**
 * @swagger
 * /banners/admin:
 *   get:
 *     summary: Get all banners (Admin only)
 *     description: Retrieve all banners including inactive ones (admin access)
 *     tags: [Banners - Admin]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: All banners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Banner'
 *                 count:
 *                   type: integer
 *                   description: Total number of banners
 *                   example: 5
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   data:
 *                     - _id: "507f1f77bcf86cd799439011"
 *                       title: "Summer Sale"
 *                       description: "Get 50% off"
 *                       deviceType: "mobile"
 *                       sortOrder: 1
 *                       images:
 *                         - _id: "507f191e810c19729de860ea"
 *                           image: "image/catalog/banners/mobile/summer_mobile.jpg"
 *                           status: true
 *                         - _id: "507f191e810c19729de860eb"
 *                           image: "image/catalog/banners/mobile/summer_mobile2.jpg"
 *                           status: false
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                       updatedAt: "2024-01-15T10:30:00Z"
 *                   count: 5
 *       401:
 *         description: Unauthorized - Invalid or missing admin token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get(
  '/admin',
  authenticateAdmin,
  checkPermission(Feature.BANNERS, PermissionAction.READ),
  bannerController.getAllBannersAdmin
);

/**
 * @swagger
 * /banners/{id}:
 *   get:
 *     summary: Get banner by ID (Admin only)
 *     description: Retrieve detailed information about a specific banner
 *     tags: [Banners - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Banner ID (24 character hex string)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Banner retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 *       400:
 *         description: Invalid banner ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Banner not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  authenticateAdmin,
  checkPermission(Feature.BANNERS, PermissionAction.READ),
  bannerController.getBannerById
);

/**
 * @swagger
 * /banners:
 *   post:
 *     summary: Create a new banner (Admin only)
 *     description: Create a new banner with optional mobile and website images
 *     tags: [Banners - Admin]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/BannerCreate'
 *     responses:
 *       201:
 *         description: Banner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 *             examples:
 *               success:
 *                 summary: Successful banner creation
 *                 value:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   title: "Summer Sale 2024"
 *                   description: "Get up to 50% off on selected items"
 *                   deviceType: "mobile"
 *                   sortOrder: 1
 *                   images:
 *                     - _id: "507f191e810c19729de860ea"
 *                       image: "image/catalog/banners/mobile/summer_mobile.jpg"
 *                       status: true
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Validation error or file upload error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  authenticateAdmin,
  checkPermission(Feature.BANNERS, PermissionAction.CREATE),
  bannerImageUpload.fields([
    { name: 'mobileImages', maxCount: 10 },
    { name: 'webImages', maxCount: 10 },
  ]),
  bannerController.createBanner
);

/**
 * @swagger
 * /banners/{id}:
 *   delete:
 *     summary: Delete a banner (Admin only)
 *     description: Delete a banner and all its associated images
 *     tags: [Banners - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Banner ID (24 character hex string)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Banner deleted successfully"
 *                 _id:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439011"
 *                 title:
 *                   type: string
 *                   example: "Summer Sale"
 *       400:
 *         description: Invalid banner ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Banner not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  authenticateAdmin,
  checkPermission(Feature.BANNERS, PermissionAction.DELETE),
  bannerController.deleteBanner
);

/**
 * @swagger
 * /banners/{id}/images:
 *   delete:
 *     summary: Delete specific images from a banner (Admin only)
 *     description: Delete specific mobile or website images from a banner
 *     tags: [Banners - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Banner ID (24 character hex string)
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BannerImageDelete'
 *     responses:
 *       200:
 *         description: Images deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Images deleted successfully"
 *                 banner:
 *                   $ref: '#/components/schemas/Banner'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Banner not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id/images',
  authenticateAdmin,
  checkPermission(Feature.BANNERS, PermissionAction.UPDATE),
  bannerController.deleteImages
);

/**
 * @swagger
 * /banners/{id}/images/status:
 *   put:
 *     summary: Update image status (Admin only)
 *     description: Activate or deactivate a specific image in a banner
 *     tags: [Banners - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Banner ID (24 character hex string)
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BannerImageUpdate'
 *     responses:
 *       200:
 *         description: Image status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Image status updated successfully"
 *                 banner:
 *                   $ref: '#/components/schemas/Banner'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Banner or image not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id/images/status',
  authenticateAdmin,
  checkPermission(Feature.BANNERS, PermissionAction.UPDATE),
  bannerController.updateImageStatus
);

// ✅ CENTRALIZED MULTER ERROR HANDLER
router.use(
  (error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof multer.MulterError) {
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          return res.status(400).json({
            message: 'File too large. Max 5MB per image.',
            error: error.message,
          });
        case 'LIMIT_FILE_COUNT':
          return res.status(400).json({
            message: 'Too many files. Max 10 images per field.',
            error: error.message,
          });
        case 'LIMIT_UNEXPECTED_FILE':
          return res.status(400).json({
            message: 'Unexpected field. Allowed: mobileImages, webImages',
            error: error.message,
          });
        default:
          return res.status(400).json({ message: 'Upload error', error: error.message });
      }
    }

    if (error instanceof Error && error.message.startsWith('Invalid image type')) {
      return res.status(400).json({
        message: error.message,
        allowed_types: allowedImageTypes,
      });
    }

    console.error('❌ Unhandled error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
);

export default router;
