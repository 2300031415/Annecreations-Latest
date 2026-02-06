import express from 'express';
import multer from 'multer';

import productController from '../controllers/product.controller';
import { parseArrayFormData } from '../middleware/arrayParser.middleware';
import { authenticateAdmin, optionalAuth } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { productListLimiter, productCreationLimiter } from '../middleware/rate-limit.middleware';
import {
  validateObjectId,
  validateObjectIdParam,
  validatePagination,
  validateProductCreate,
  validateProductUpdate,
  validateProductSearch,
  handleValidationErrors,
} from '../middleware/validation.middleware';
import { Feature, PermissionAction } from '../types/models/role';
import { productCreationUpload } from '../utils/multerConfig';

const router = express.Router();

// === PUBLIC ROUTES ===

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - productModel
 *         - sku
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique product identifier
 *           example: "507f1f77bcf86cd799439011"
 *         languageId:
 *           type: string
 *           description: Language ID reference (optional, defaults to English)
 *           example: "507f1f77bcf86cd799439012"
 *         productModel:
 *           type: string
 *           maxLength: 255
 *           description: Product model name
 *           example: "Anne's Cross Stitch Pattern"
 *         sku:
 *           type: string
 *           maxLength: 100
 *           description: Stock keeping unit
 *           example: "ACS-001"
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: Product description
 *           example: "Beautiful cross stitch pattern featuring flowers"
 *         stitches:
 *           type: string
 *           maxLength: 100
 *           description: Number of stitches
 *           example: "14 count"
 *         dimensions:
 *           type: string
 *           maxLength: 100
 *           description: Product dimensions
 *           example: "8x10 inches"
 *         colourNeedles:
 *           type: string
 *           maxLength: 100
 *           description: Color and needle information
 *           example: "DMC threads included"
 *         sortOrder:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Sort order for display
 *           example: 1
 *         status:
 *           type: boolean
 *           default: true
 *           description: Product availability status
 *           example: true
 *         viewed:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Number of times viewed
 *           example: 150
 *         image:
 *           type: string
 *           description: Main product image path
 *           example: "/catalog/product/main-image.jpg"
 *         metaTitle:
 *           type: string
 *           maxLength: 255
 *           description: SEO meta title
 *         metaDescription:
 *           type: string
 *           maxLength: 500
 *           description: SEO meta description
 *         metaKeyword:
 *           type: string
 *           maxLength: 500
 *           description: SEO meta keywords
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of category IDs
 *           example: ["507f1f77bcf86cd799439013"]
 *         additionalImages:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 description: Image path
 *               sortOrder:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - option
 *             properties:
 *               option:
 *                 type: string
 *                 description: Product option ID
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Option price
 *               uploadedFilePath:
 *                 type: string
 *                 description: Path to uploaded file for digital products
 *               isPurchased:
 *                 type: boolean
 *                 description: Whether current customer has purchased this option
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         isPurchased:
 *           type: boolean
 *           description: Whether current customer has purchased this product
 *           example: false
 *
 *     ProductCreate:
 *       type: object
 *       required:
 *         - productModel
 *         - sku
 *       properties:
 *         languageId:
 *           type: string
 *           description: Language ID reference (optional, defaults to English)
 *         productModel:
 *           type: string
 *           maxLength: 255
 *           description: Product model name
 *         sku:
 *           type: string
 *           maxLength: 100
 *           description: Stock keeping unit
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: Product description
 *         stitches:
 *           type: string
 *           maxLength: 100
 *           description: Number of stitches
 *         dimensions:
 *           type: string
 *           maxLength: 100
 *           description: Product dimensions
 *         colourNeedles:
 *           type: string
 *           maxLength: 100
 *           description: Color and needle information
 *         sortOrder:
 *           type: number
 *           minimum: 0
 *           description: Sort order for display
 *         status:
 *           type: boolean
 *           description: Product availability status
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of category IDs
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               option:
 *                 type: string
 *                 description: Product option ID
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Option price
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: Current page number
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *           example: 20
 *         total:
 *           type: integer
 *           description: Total number of items
 *           example: 150
 *         pages:
 *           type: integer
 *           description: Total number of pages
 *           example: 8
 *
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Product not found"
 *         error:
 *           type: string
 *           description: Error code
 *           example: "PRODUCT_NOT_FOUND"
 *         type:
 *           type: string
 *           description: Error type
 *           example: "RESOURCE_NOT_FOUND"
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           description: Response data
 *         message:
 *           type: string
 *           description: Success message
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with pagination and filters
 *     description: Retrieve a paginated list of products with optional filtering, searching, and sorting capabilities
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page (max 100)
 *         example: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product model, SKU, or description (case-insensitive)
 *         example: "cross stitch"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *         example: "507f1f77bcf86cd799439013"
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [productModel, sku, createdAt, sortOrder]
 *           default: createdAt
 *         description: Field to sort by
 *         example: "createdAt"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *         example: "desc"
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   data: [
 *                     {
 *                       _id: "507f1f77bcf86cd799439011",
 *                       productModel: "Anne's Cross Stitch Pattern",
 *                       sku: "ACS-001",
 *                       description: "Beautiful cross stitch pattern",
 *                       status: true,
 *                       image: "/image/catalog/product/main-image.jpg",
 *                       createdAt: "2024-01-15T10:30:00Z",
 *                       updatedAt: "2024-01-15T10:30:00Z"
 *                     }
 *                   ]
 *                   pagination: {
 *                     page: 1,
 *                     limit: 20,
 *                     total: 150,
 *                     pages: 8
 *                   }
 *       400:
 *         description: Bad request - Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidParams:
 *                 summary: Invalid parameters
 *                 value:
 *                   message: "Invalid pagination parameters"
 *                   error: "INVALID_PARAMS"
 *                   type: "VALIDATION_ERROR"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               serverError:
 *                 summary: Server error
 *                 value:
 *                   message: "Internal server error"
 *                   error: "INTERNAL_ERROR"
 *                   type: "SERVER_ERROR"
 */
router.get(
  '/',
  optionalAuth,
  productListLimiter,
  validateProductSearch,
  handleValidationErrors,
  productController.getAllProducts
);

router.get('/:id/pdf', optionalAuth, productController.downloadProductPDF);

/**
 * @swagger
 * /products/{id}/related:
 *   get:
 *     summary: Get related products
 *     description: |
 *       Retrieve products from the same categories as the specified product, excluding the current product.
 *       The endpoint supports backward compatibility - you can use either the productId (_id) or productModel.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product identifier - can be either MongoDB ObjectId (24 character hex string) or product model name
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page (max 100)
 *         example: 10
 *     responses:
 *       200:
 *         description: Related products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid product model
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
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
router.get(
  '/:id/related',
  optionalAuth,
  validatePagination,
  handleValidationErrors,
  productController.getRelatedProducts
);

/**
 * @swagger
 * /products/compare:
 *   post:
 *     summary: Compare products
 *     description: Retrieve details for multiple products to compare (max 3)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 2
 *                 maxItems: 3
 *                 description: Array of product IDs to compare
 *     responses:
 *       200:
 *         description: Comparison data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input (less than 2 or more than 3 IDs)
 */
router.post(
  '/compare',
  optionalAuth,
  productController.compareProducts
);

/**
 * @swagger
 * /products/category/{categoryId}:
 *   get:
 *     summary: Get products by category
 *     description: Retrieve all products belonging to a specific category with pagination and sorting
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Category ID (24 character hex string)
 *         example: "507f1f77bcf86cd799439013"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page (max 100)
 *         example: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [productModel, sku, createdAt, sortOrder]
 *           default: createdAt
 *         description: Field to sort by
 *         example: "createdAt"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *         example: "desc"
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid category ID format
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
router.get(
  '/category/:categoryId',
  optionalAuth,
  validateObjectIdParam('categoryId'),
  validatePagination,
  handleValidationErrors,
  productController.getAllProductsByCategoryId
);

// === ADMIN ROUTES (require admin authentication) ===

/**
 * @swagger
 * /products/options:
 *   get:
 *     summary: Get all product options (Admin only)
 *     description: Retrieve all available product options for admin management
 *     tags: [Products - Admin]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Product options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Option ID
 *                     example: "507f1f77bcf86cd799439014"
 *                   name:
 *                     type: string
 *                     description: Option name
 *                     example: "PDF Pattern"
 *                   type:
 *                     type: string
 *                     description: Option type
 *                     example: "file"
 *                   sortOrder:
 *                     type: number
 *                     description: Sort order
 *                     example: 1
 *       401:
 *         description: Unauthorized - Invalid or missing admin token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               unauthorized:
 *                 summary: Unauthorized
 *                 value:
 *                   message: "Unauthorized"
 *                   error: "UNAUTHORIZED"
 *                   type: "AUTH_ERROR"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               forbidden:
 *                 summary: Admin access required
 *                 value:
 *                   message: "Admin access required"
 *                   error: "ACCESS_DENIED"
 *                   type: "PERMISSION_ERROR"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/options',
  authenticateAdmin,
  checkPermission(Feature.PRODUCTS, PermissionAction.READ),
  productController.getAllOptions
);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product (Admin only)
 *     description: |
 *       Create a new product with images, options, and all metadata. Supports multipart form data for file uploads.
 *
 *       **File Upload Structure:**
 *       - `image`: Single main product image (optional, max 5MB)
 *       - `additionalImages`: Multiple additional images (optional, max 10 images, 5MB each)
 *       - `options[0].option`: First option name
 *       - `options[0].price`: First option price
 *       - `options[0].file`: First option ZIP file (max 50MB)
 *       - `options[1].option`: Second option name
 *       - `options[1].price`: Second option price
 *       - `options[1].file`: Second option ZIP file (max 50MB)
 *       - ... (up to 10 options)
 *
 *       **Example FormData structure:**
 *       ```
 *       formData.append("productModel", "Anne's Cross Stitch Pattern");
 *       formData.append("sku", "ACS-001");
 *       formData.append("image", mainImageFile);
 *       additionalImages.forEach(img => formData.append("additionalImages", img));
 *       options.forEach((opt, index) => {
 *         formData.append(`options[${index}].option`, opt.name);
 *         formData.append(`options[${index}].price`, opt.price);
 *         formData.append(`options[${index}].file`, opt.zipFile);
 *       });
 *       ```
 *     tags: [Products - Admin]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productModel
 *               - sku
 *               - options
 *             properties:
 *               languageId:
 *                 type: string
 *                 description: Language ID reference (optional, defaults to English)
 *                 example: "507f1f77bcf86cd799439012"
 *               productModel:
 *                 type: string
 *                 maxLength: 255
 *                 description: Product model name (required)
 *                 example: "Anne's Cross Stitch Pattern"
 *               sku:
 *                 type: string
 *                 maxLength: 100
 *                 description: Stock keeping unit (required, must be unique)
 *                 example: "ACS-001"
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Product description (optional)
 *                 example: "Beautiful cross stitch pattern featuring flowers"
 *               stitches:
 *                 type: string
 *                 maxLength: 100
 *                 description: Number of stitches (optional)
 *                 example: "14 count"
 *               dimensions:
 *                 type: string
 *                 maxLength: 100
 *                 description: Product dimensions (optional)
 *                 example: "8x10 inches"
 *               colourNeedles:
 *                 type: string
 *                 maxLength: 100
 *                 description: Color and needle information (optional)
 *                 example: "DMC threads included"
 *               sortOrder:
 *                 type: number
 *                 minimum: 0
 *                 description: Sort order for display (optional, default 0)
 *                 example: 1
 *               status:
 *                 type: boolean
 *                 description: Product availability status (optional, default true)
 *                 example: true
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of category IDs (optional)
 *                 example: ["507f1f77bcf86cd799439013"]
 *               seo:
 *                 type: object
 *                 properties:
 *                   metaTitle:
 *                     type: string
 *                     maxLength: 255
 *                     description: SEO meta title (optional)
 *                     example: "Cross Stitch Pattern - AnneCreations"
 *                   metaDescription:
 *                     type: string
 *                     maxLength: 500
 *                     description: SEO meta description (optional)
 *                     example: "Beautiful cross stitch pattern featuring flowers"
 *                   metaKeyword:
 *                     type: string
 *                     maxLength: 500
 *                     description: SEO meta keywords (optional)
 *                     example: "cross stitch, pattern, embroidery"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Main product image (optional, max 5MB)
 *               additionalImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional product images (optional, max 5 images, 5MB each)
 *               options[0].option:
 *                 type: string
 *                 description: First option name
 *                 example: "PDF Pattern"
 *               options[0].price:
 *                 type: number
 *                 minimum: 0
 *                 description: First option price
 *                 example: 9.99
 *               options[0].file:
 *                 type: string
 *                 format: binary
 *                 description: First option ZIP file (max 50MB)
 *               options[1].option:
 *                 type: string
 *                 description: Second option name
 *                 example: "DST File"
 *               options[1].price:
 *                 type: number
 *                 minimum: 0
 *                 description: Second option price
 *                 example: 12.99
 *               options[1].file:
 *                 type: string
 *                 format: binary
 *                 description: Second option ZIP file (max 50MB)
 *               # ... (up to 10 options with same pattern)
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Created product ID
 *                   example: "507f1f77bcf86cd799439011"
 *                 productModel:
 *                   type: string
 *                   description: Product model name
 *                   example: "Anne's Cross Stitch Pattern"
 *                 sku:
 *                   type: string
 *                   description: Stock keeping unit
 *                   example: "ACS-001"
 *                 status:
 *                   type: boolean
 *                   description: Product status
 *                   example: true
 *                 image:
 *                   type: string
 *                   description: Image path if uploaded
 *                   example: "/image/catalog/product/main-image.jpg"
 *                 additionalImages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       image:
 *                         type: string
 *                         description: Additional image path
 *                         example: "/image/catalog/product/additional-1.jpg"
 *                       sortOrder:
 *                         type: number
 *                         description: Sort order
 *                         example: 0
 *                 options:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       option:
 *                         type: string
 *                         description: Option name
 *                         example: "PDF Pattern"
 *                       price:
 *                         type: number
 *                         description: Option price
 *                         example: 9.99
 *                       fileSize:
 *                         type: number
 *                         description: File size in bytes
 *                         example: 2048576
 *                       mimeType:
 *                         type: string
 *                         description: File MIME type
 *                         example: "application/zip"
 *                       downloadCount:
 *                         type: number
 *                         description: Download count
 *                         example: 0
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Creation timestamp
 *                   example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Validation error or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validationError:
 *                 summary: Validation error
 *                 value:
 *                   message: "Validation failed"
 *                   error: "VALIDATION_ERROR"
 *                   type: "VALIDATION_ERROR"
 *               fileTooLarge:
 *                 summary: File too large
 *                 value:
 *                   message: "File too large"
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
 *         description: Conflict - SKU already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               duplicateSku:
 *                 summary: SKU already exists
 *                 value:
 *                   message: "SKU already exists"
 *                   error: "DUPLICATE_SKU"
 *                   type: "DUPLICATE_KEY"
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
  checkPermission(Feature.PRODUCTS, PermissionAction.CREATE),
  productCreationLimiter,
  productCreationUpload,
  parseArrayFormData,
  validateProductCreate,
  handleValidationErrors,
  productController.createProduct
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product (Admin only)
 *     description: |
 *       Update an existing product with new data and images. Supports partial updates and file replacements.
 *
 *       **File Upload Structure:**
 *       - `image`: Single main product image (optional, replaces existing, max 5MB)
 *       - `additionalImages`: Multiple additional images (optional, replaces existing, max 10 images, 5MB each)
 *       - `options[0].option`: First option name
 *       - `options[0].price`: First option price
 *       - `options[0].file`: First option ZIP file (replaces existing, max 50MB)
 *       - `options[1].option`: Second option name
 *       - `options[1].price`: Second option price
 *       - `options[1].file`: Second option ZIP file (replaces existing, max 50MB)
 *       - ... (up to 10 options)
 *     tags: [Products - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Product ID (24 character hex string)
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
 *               productModel:
 *                 type: string
 *                 maxLength: 255
 *                 description: Product model name (optional)
 *               sku:
 *                 type: string
 *                 maxLength: 100
 *                 description: Stock keeping unit (optional, must be unique if changed)
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Product description (optional)
 *               stitches:
 *                 type: string
 *                 maxLength: 100
 *                 description: Number of stitches (optional)
 *               dimensions:
 *                 type: string
 *                 maxLength: 100
 *                 description: Product dimensions (optional)
 *               colourNeedles:
 *                 type: string
 *                 maxLength: 100
 *                 description: Color and needle information (optional)
 *               sortOrder:
 *                 type: number
 *                 minimum: 0
 *                 description: Sort order for display (optional)
 *               status:
 *                 type: boolean
 *                 description: Product availability status (optional)
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of category IDs (optional)
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
 *                 description: Main product image (optional, replaces existing)
 *               additionalImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional product images (optional, replaces existing)
 *               options[0].option:
 *                 type: string
 *                 description: First option name
 *                 example: "PDF Pattern"
 *               options[0].price:
 *                 type: number
 *                 minimum: 0
 *                 description: First option price
 *                 example: 9.99
 *               options[0].file:
 *                 type: string
 *                 format: binary
 *                 description: First option ZIP file (replaces existing, max 50MB)
 *               options[1].option:
 *                 type: string
 *                 description: Second option name
 *                 example: "DST File"
 *               options[1].price:
 *                 type: number
 *                 minimum: 0
 *                 description: Second option price
 *                 example: 12.99
 *               options[1].file:
 *                 type: string
 *                 format: binary
 *                 description: Second option ZIP file (replaces existing, max 50MB)
 *               # ... (up to 10 options with same pattern)
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Product ID
 *                   example: "507f1f77bcf86cd799439011"
 *                 productModel:
 *                   type: string
 *                   description: Product model name
 *                   example: "Anne's Cross Stitch Pattern"
 *                 sku:
 *                   type: string
 *                   description: Stock keeping unit
 *                   example: "ACS-001"
 *                 status:
 *                   type: boolean
 *                   description: Product status
 *                   example: true
 *                 image:
 *                   type: string
 *                   description: Image path if uploaded
 *                   example: "/image/catalog/product/main-image.jpg"
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Category ID
 *                       name:
 *                         type: string
 *                         description: Category name
 *                 options:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       option:
 *                         type: string
 *                         description: Product option ID
 *                       price:
 *                         type: number
 *                         description: Option price
 *                       downloadCount:
 *                         type: number
 *                         description: Download count
 *                       fileSize:
 *                         type: number
 *                         description: File size in bytes
 *                       mimeType:
 *                         type: string
 *                         description: File MIME type
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Creation timestamp
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Last update timestamp
 *       400:
 *         description: Validation error, invalid product ID, or invalid data
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
 *         description: Product not found
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
  checkPermission(Feature.PRODUCTS, PermissionAction.UPDATE),
  validateObjectId,
  validateProductUpdate,
  handleValidationErrors,
  productCreationUpload,
  productController.updateProduct
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product (Admin only)
 *     description: Delete a product and all associated files (images and option files)
 *     tags: [Products - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Product ID (24 character hex string)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Deleted product ID
 *                   example: "507f1f77bcf86cd799439011"
 *                 productModel:
 *                   type: string
 *                   description: Deleted product model name
 *                   example: "Anne's Cross Stitch Pattern"
 *       400:
 *         description: Invalid product ID format
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
 *         description: Product not found
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
router.delete(
  '/:id',
  authenticateAdmin,
  checkPermission(Feature.PRODUCTS, PermissionAction.DELETE),
  validateObjectId,
  handleValidationErrors,
  productController.deleteProduct
);

// === ADVANCED SEARCH ROUTES ===

/**
 * @swagger
 * /products/search/advanced:
 *   post:
 *     summary: Advanced product search (Admin only)
 *     description: Perform advanced search with multiple filters, sorting, and pagination
 *     tags: [Products - Admin]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               search:
 *                 type: string
 *                 description: Search term for product model, SKU, or stitches (optional)
 *                 example: "cross stitch"
 *               categoryId:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *                 description: Filter by category ID (optional)
 *                 example: "507f1f77bcf86cd799439013"
 *               status:
 *                 type: boolean
 *                 description: Filter by status (optional)
 *                 example: true
 *               page:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 description: Page number for pagination (optional)
 *                 example: 1
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 20
 *                 description: Number of items per page (optional, max 100)
 *                 example: 20
 *               sort:
 *                 type: string
 *                 enum: [productModel, sku, createdAt, sortOrder]
 *                 default: createdAt
 *                 description: Field to sort by (optional)
 *                 example: "createdAt"
 *               order:
 *                 type: string
 *                 enum: [asc, desc]
 *                 default: desc
 *                 description: Sort order (optional)
 *                 example: "desc"
 *     responses:
 *       200:
 *         description: Advanced search completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 message:
 *                   type: string
 *                   example: "Advanced search completed successfully"
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/search/advanced',
  authenticateAdmin,
  checkPermission(Feature.PRODUCTS, PermissionAction.READ),
  productController.advancedProductSearch
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID or model name
 *     description: |
 *       Retrieve detailed information about a specific product using either its MongoDB ObjectId or product model name, including all options, images, and purchase status.
 *       The endpoint supports backward compatibility - you can use either the productId (_id) or productModel.
 *       Authentication is optional - if a valid customer token is provided, purchase status will be included for each option.
 *       For public users, all options will show purchased: false.
 *     tags: [Products]
 *     security:
 *       - customerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product identifier - can be either MongoDB ObjectId (24 character hex string) or product model name
 *         example: "507f1f77bcf86cd799439011"
 *       - in: header
 *         name: Authorization
 *         required: false
 *         schema:
 *           type: string
 *           example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         description: Optional customer authentication token. If provided, purchase status will be included for each option.
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Product'
 *                 - type: object
 *                   properties:
 *                     isPurchased:
 *                       type: boolean
 *                       description: Whether the current customer has purchased this product (only for authenticated customers)
 *                       example: false
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   productModel: "Anne's Cross Stitch Pattern"
 *                   sku: "ACS-001"
 *                   description: "Beautiful cross stitch pattern featuring flowers"
 *                   stitches: "14 count"
 *                   dimensions: "8x10 inches"
 *                   colourNeedles: "DMC threads included"
 *                   sortOrder: 1
 *                   status: true
 *                   viewed: 150
 *                   image: "/image/catalog/product/main-image.jpg"
 *                   categories:
 *                     - _id: "507f1f77bcf86cd799439013"
 *                       name: "Cross Stitch"
 *                   additionalImages:
 *                     - image: "/image/catalog/product/additional-1.jpg"
 *                       sortOrder: 0
 *                   options:
 *                     - _id: "507f1f77bcf86cd799439014"
 *                       option:
 *                         _id: "507f1f77bcf86cd799439014"
 *                         name: "PDF Pattern"
 *                         sortOrder: 1
 *                         status: true
 *                       price: 9.99
 *                       fileSize: 2048576
 *                       mimeType: "application/pdf"
 *                       downloadCount: 0
 *                       purchased: false
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *               authenticated:
 *                 summary: Authenticated customer response
 *                 value:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   productModel: "Anne's Cross Stitch Pattern"
 *                   sku: "ACS-001"
 *                   description: "Beautiful cross stitch pattern featuring flowers"
 *                   stitches: "14 count"
 *                   dimensions: "8x10 inches"
 *                   colourNeedles: "DMC threads included"
 *                   sortOrder: 1
 *                   status: true
 *                   viewed: 150
 *                   image: "/image/catalog/product/main-image.jpg"
 *                   categories:
 *                     - _id: "507f1f77bcf86cd799439013"
 *                       name: "Cross Stitch"
 *                   additionalImages:
 *                     - image: "/image/catalog/product/additional-1.jpg"
 *                       sortOrder: 0
 *                   options:
 *                     - _id: "507f1f77bcf86cd799439014"
 *                       option:
 *                         _id: "507f1f77bcf86cd799439014"
 *                         name: "PDF Pattern"
 *                         sortOrder: 1
 *                         status: true
 *                       price: 9.99
 *                       fileSize: 2048576
 *                       mimeType: "application/pdf"
 *                       downloadCount: 0
 *                       purchased: true
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *               unauthenticated:
 *                 summary: Public user response (no auth token)
 *                 value:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   productModel: "Anne's Cross Stitch Pattern"
 *                   sku: "ACS-001"
 *                   description: "Beautiful cross stitch pattern featuring flowers"
 *                   stitches: "14 count"
 *                   dimensions: "8x10 inches"
 *                   colourNeedles: "DMC threads included"
 *                   sortOrder: 1
 *                   status: true
 *                   viewed: 150
 *                   image: "/image/catalog/product/main-image.jpg"
 *                   categories:
 *                     - _id: "507f1f77bcf86cd799439013"
 *                       name: "Cross Stitch"
 *                   additionalImages:
 *                     - image: "/image/catalog/product/additional-1.jpg"
 *                       sortOrder: 0
 *                   options:
 *                     - _id: "507f1f77bcf86cd799439014"
 *                       option:
 *                         _id: "507f1f77bcf86cd799439014"
 *                         name: "PDF Pattern"
 *                         sortOrder: 1
 *                         status: true
 *                       price: 9.99
 *                       fileSize: 2048576
 *                       mimeType: "application/pdf"
 *                       downloadCount: 0
 *                       purchased: false
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Invalid product model
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidModel:
 *                 summary: Invalid product model
 *                 value:
 *                   message: "Product model is required"
 *                   error: "INVALID_MODEL"
 *                   type: "VALIDATION_ERROR"
 *       404:
 *         description: Product not found or inactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notFound:
 *                 summary: Product not found
 *                 value:
 *                   message: "Product not found"
 *                   error: "PRODUCT_NOT_FOUND"
 *                   type: "RESOURCE_NOT_FOUND"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', optionalAuth, handleValidationErrors, productController.getProductById);

// === CENTRALIZED MULTER ERROR HANDLER ===
router.use(
  (error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof multer.MulterError) {
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          return res.status(400).json({
            message: 'File too large',
            error: error.message,
          });
        case 'LIMIT_FILE_COUNT':
          return res.status(400).json({
            message: 'Too many files per field.',
            error: error.message,
          });
        case 'LIMIT_UNEXPECTED_FILE':
          return res.status(400).json({
            message: 'Unexpected field',
            error: error.message,
          });
        default:
          return res.status(400).json({
            message: 'File upload error',
            error: error.message,
          });
      }
    }
    _next(error);
  }
);

export default router;
