import express from 'express';
import multer from 'multer';

import categoryController from '../controllers/category.controller';
import { authenticateAdmin, optionalAuth } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import {
  validateCategoryCreate,
  validateCategoryUpdate,
} from '../middleware/validation.middleware';
import { Feature, PermissionAction } from '../types/models/role';
import { allowedImageTypes } from '../utils/fileUtils';
import { createMulterUploader } from '../utils/multerConfig';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - sortOrder
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique category identifier
 *           example: "507f1f77bcf86cd799439011"
 *         languageId:
 *           type: string
 *           description: Language ID reference (optional, defaults to English)
 *           example: "507f1f77bcf86cd799439012"
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: Category name
 *           example: "Cross Stitch Patterns"
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: Category description (optional)
 *           example: "Beautiful cross stitch patterns for all skill levels"
 *         sortOrder:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Sort order for display
 *           example: 1
 *         status:
 *           type: boolean
 *           default: true
 *           description: Category availability status
 *           example: true
 *         image:
 *           type: string
 *           description: Category image path with /image/ prefix (optional)
 *           example: "image/catalog/category/cross-stitch.jpg"
 *         seo:
 *           type: object
 *           properties:
 *             metaTitle:
 *               type: string
 *               maxLength: 255
 *               description: SEO meta title (optional)
 *               example: "Cross Stitch Patterns - AnneCreations"
 *             metaDescription:
 *               type: string
 *               maxLength: 500
 *               description: SEO meta description (optional)
 *               example: "Discover beautiful cross stitch patterns"
 *             metaKeyword:
 *               type: string
 *               maxLength: 500
 *               description: SEO meta keywords (optional)
 *               example: "cross stitch, patterns, embroidery"
 *         productCount:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Number of products in this category
 *           example: 25
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Category creation timestamp
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00Z"
 *
 *     CategoryCreate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         languageId:
 *           type: string
 *           description: Language ID reference (optional, defaults to English)
 *           example: "507f1f77bcf86cd799439012"
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: Category name
 *           example: "Cross Stitch Patterns"
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: Category description (optional)
 *           example: "Beautiful cross stitch patterns for all skill levels"
 *         sortOrder:
 *           type: number
 *           minimum: 0
 *           description: Sort order for display (optional, default 0)
 *           example: 1
 *         status:
 *           type: boolean
 *           description: Category availability status (optional, default true)
 *           example: true
 *         seo:
 *           type: object
 *           properties:
 *             metaTitle:
 *               type: string
 *               maxLength: 255
 *               description: SEO meta title (optional)
 *             metaDescription:
 *               type: string
 *               maxLength: 500
 *               description: SEO meta description (optional)
 *             metaKeyword:
 *               type: string
 *               maxLength: 500
 *               description: SEO meta keywords (optional)
 *         image:
 *           type: string
 *           format: binary
 *           description: Category image (optional, max 5MB)
 */

// ✅ PUBLIC ROUTES

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve all active categories with product counts (no pagination)
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter by status (optional, defaults to true for public access)
 *         example: true
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search categories by name or description
 *         example: "cross stitch"
 *     responses:
 *       200:
 *         description: All categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *                 count:
 *                   type: integer
 *                   description: Total number of categories returned
 *                   example: 39
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   data: [
 *                     {
 *                       _id: "507f1f77bcf86cd799439011",
 *                       name: "Cross Stitch Patterns",
 *                       description: "Beautiful cross stitch patterns",
 *                       sortOrder: 1,
 *                       status: true,
 *                       image: "image/catalog/category/cross-stitch.jpg",
 *                       productCount: 25,
 *                       createdAt: "2024-01-15T10:30:00Z",
 *                       updatedAt: "2024-01-15T10:30:00Z"
 *                     },
 *                     {
 *                       _id: "507f1f77bcf86cd799439012",
 *                       name: "Embroidery Designs",
 *                       description: "Modern embroidery patterns",
 *                       sortOrder: 2,
 *                       status: true,
 *                       image: "image/catalog/category/embroidery.jpg",
 *                       productCount: 18,
 *                       createdAt: "2024-01-15T10:30:00Z",
 *                       updatedAt: "2024-01-15T10:30:00Z"
 *                     }
 *                   ]
 *                   count: 39
 *       400:
 *         description: Bad request - Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', optionalAuth, categoryController.getAllCategories);

/**
 * @swagger
 * /categories/{id}/catalog/pdf:
 *   get:
 *     summary: Download category catalog as PDF
 *     description: Generate and download a PDF catalog containing all active products in the category with their images and details. Each product shows its Design Code (productModel), description, stitches, dimensions, colour needles, main image, and additional images if available.
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Category ID (24 character hex string)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: PDF catalog generated and returned successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Attachment with filename
 *             schema:
 *               type: string
 *               example: attachment; filename="cross_stitch_patterns_catalog_1234567890.pdf"
 *           Content-Type:
 *             description: PDF content type
 *             schema:
 *               type: string
 *               example: application/pdf
 *       400:
 *         description: Invalid category ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidId:
 *                 summary: Invalid category ID
 *                 value:
 *                   message: "Invalid category ID format"
 *                   error: "VALIDATION_ERROR"
 *       404:
 *         description: Category not found, inactive, or has no products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notFound:
 *                 summary: Category not found
 *                 value:
 *                   message: "Category not found"
 *                   error: "NOT_FOUND"
 *               noProducts:
 *                 summary: No products in category
 *                 value:
 *                   message: "No products found in this category"
 *                   error: "NOT_FOUND"
 *       500:
 *         description: Internal server error during PDF generation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/catalog/pdf', categoryController.downloadCategoryCatalog);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: Retrieve detailed information about a specific category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Category ID (24 character hex string)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   name: "Cross Stitch Patterns"
 *                   description: "Beautiful cross stitch patterns for all skill levels"
 *                   sortOrder: 1
 *                   status: true
 *                   image: "/image/catalog/category/cross-stitch.jpg"
 *                   seo:
 *                     metaTitle: "Cross Stitch Patterns - AnneCreations"
 *                     metaDescription: "Discover beautiful cross stitch patterns"
 *                     metaKeyword: "cross stitch, patterns, embroidery"
 *                   productCount: 25
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Invalid category ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Category not found or inactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', categoryController.getCategoryById);

const categoryImageUpload = createMulterUploader({
  allowedTypes: allowedImageTypes,
  maxFiles: 1,
  maxSizeMB: 5,
});

// ✅ ADMIN ROUTES

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category (Admin only)
 *     description: Create a new category with optional image upload
 *     tags: [Categories - Admin]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               languageId:
 *                 type: string
 *                 description: Language ID reference (optional, defaults to English)
 *                 example: "507f1f77bcf86cd799439012"
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Category name (required)
 *                 example: "Cross Stitch Patterns"
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Category description (optional)
 *                 example: "Beautiful cross stitch patterns for all skill levels"
 *               sortOrder:
 *                 type: number
 *                 minimum: 0
 *                 description: Sort order for display (optional, default 0)
 *                 example: 1
 *               status:
 *                 type: boolean
 *                 description: Category availability status (optional, default true)
 *                 example: true
 *               seo:
 *                 type: object
 *                 properties:
 *                   metaTitle:
 *                     type: string
 *                     maxLength: 255
 *                     description: SEO meta title (optional)
 *                   metaDescription:
 *                     type: string
 *                     maxLength: 500
 *                     description: SEO meta description (optional)
 *                   metaKeyword:
 *                     type: string
 *                     maxLength: 500
 *                     description: SEO meta keywords (optional)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image (optional, max 5MB)
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *             examples:
 *               success:
 *                 summary: Successful category creation
 *                 value:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   name: "Cross Stitch Patterns"
 *                   description: "Beautiful cross stitch patterns"
 *                   sortOrder: 1
 *                   status: true
 *                   image: "/image/catalog/category/cross-stitch.jpg"
 *                   productCount: 0
 *                   createdAt: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Validation error or file upload error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validationError:
 *                 summary: Validation error
 *                 value:
 *                   message: "Name is required"
 *                   error: "VALIDATION_ERROR"
 *                   type: "VALIDATION_ERROR"
 *               fileTooLarge:
 *                 summary: File too large
 *                 value:
 *                   message: "File too large. Max 5MB."
 *                   error: "FILE_TOO_LARGE"
 *                   type: "VALIDATION_ERROR"
 *       401:
 *         description: Unauthorized - Invalid or missing admin token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Category name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  authenticateAdmin,
  checkPermission(Feature.CATEGORIES, PermissionAction.CREATE),
  validateCategoryCreate,
  categoryImageUpload.single('image'), // Only runs if auth passes
  categoryController.createCategory
);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category (Admin only)
 *     description: Update an existing category with new data and optional image replacement
 *     tags: [Categories - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Category ID (24 character hex string)
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               languageId:
 *                 type: string
 *                 description: Language ID reference (optional)
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Category name (optional)
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Category description (optional)
 *               sortOrder:
 *                 type: number
 *                 minimum: 0
 *                 description: Sort order for display (optional)
 *               status:
 *                 type: boolean
 *                 description: Category availability status (optional)
 *               seo:
 *                 type: object
 *                 properties:
 *                   metaTitle:
 *                     type: string
 *                     maxLength: 255
 *                     description: SEO meta title (optional)
 *                   metaDescription:
 *                     type: string
 *                     maxLength: 500
 *                     description: SEO meta description (optional)
 *                   metaKeyword:
 *                     type: string
 *                     maxLength: 500
 *                     description: SEO meta keywords (optional)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image (optional, replaces existing, max 5MB)
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error, invalid category ID, or file upload error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing admin token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Category name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  authenticateAdmin,
  checkPermission(Feature.CATEGORIES, PermissionAction.UPDATE),
  validateCategoryUpdate,
  categoryImageUpload.single('image'), // Only runs if auth passes,
  categoryController.updateCategory
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category (Admin only)
 *     description: Delete a category and its associated image. Cannot delete if category has products.
 *     tags: [Categories - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Category ID (24 character hex string)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Deleted category ID
 *                   example: "507f1f77bcf86cd799439011"
 *                 name:
 *                   type: string
 *                   description: Deleted category name
 *                   example: "Cross Stitch Patterns"
 *       400:
 *         description: Invalid category ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing admin token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Category has products and cannot be deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               hasProducts:
 *                 summary: Category has products
 *                 value:
 *                   message: "Cannot delete category with products"
 *                   error: "CATEGORY_HAS_PRODUCTS"
 *                   type: "BUSINESS_RULE_VIOLATION"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  authenticateAdmin,
  checkPermission(Feature.CATEGORIES, PermissionAction.DELETE),
  categoryController.deleteCategory
);

// ✅ CENTRALIZED MULTER ERROR HANDLER
router.use(
  (error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof multer.MulterError) {
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          return res.status(400).json({
            message: 'File too large. Max 5MB.',
            error: error.message,
          });
        case 'LIMIT_FILE_COUNT':
          return res.status(400).json({
            message: 'Too many files per field. Max 1 image allowed.',
            error: error.message,
          });
        case 'LIMIT_UNEXPECTED_FILE':
          return res.status(400).json({
            message: 'Unexpected field. Allowed: image',
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
