// routes/wishlist.routes.ts
import express from 'express';

import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlist.controller';
import { authenticateCustomer } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     WishlistItem:
 *       type: object
 *       required:
 *         - product
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique wishlist item identifier
 *           example: "507f1f77bcf86cd799439011"
 *         customer:
 *           type: string
 *           description: Customer ID reference
 *           example: "507f1f77bcf86cd799439012"
 *         product:
 *           type: string
 *           description: Product ID reference
 *           example: "507f1f77bcf86cd799439013"
 *         productDetails:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               description: Product ID
 *               example: "507f1f77bcf86cd799439013"
 *             productModel:
 *               type: string
 *               description: Product model name
 *               example: "Anne's Cross Stitch Pattern"
 *             sku:
 *               type: string
 *               description: Product SKU
 *               example: "ACS-001"
 *             image:
 *               type: string
 *               description: Product image path
 *               example: "/catalog/product/main-image.jpg"
 *             description:
 *               type: string
 *               description: Product description
 *               example: "Beautiful cross stitch pattern"
 *             status:
 *               type: boolean
 *               description: Product availability status
 *               example: true
 *         addedAt:
 *           type: string
 *           format: date-time
 *           description: When item was added to wishlist
 *           example: "2024-01-15T10:30:00Z"
 *
 *     Wishlist:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique wishlist identifier
 *           example: "507f1f77bcf86cd799439011"
 *         customer:
 *           type: string
 *           description: Customer ID reference
 *           example: "507f1f77bcf86cd799439012"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WishlistItem'
 *           description: Wishlist items
 *         totalItems:
 *           type: number
 *           minimum: 0
 *           description: Total number of items in wishlist
 *           example: 5
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Wishlist creation timestamp
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00Z"
 *
 *     WishlistAdd:
 *       type: object
 *       required:
 *         - product
 *       properties:
 *         productId:
 *           type: string
 *           description: Product ID reference
 *           example: "507f1f77bcf86cd799439013"
 */

// All wishlist routes require authentication
router.use(authenticateCustomer);

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Get customer wishlist
 *     description: Retrieve the current customer's wishlist with all saved products
 *     tags: [Wishlist]
 *     security:
 *       - customerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Success status
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                       description: Number of items in wishlist
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Product ID
 *                           productModel:
 *                             type: string
 *                             description: Product model name
 *                           sku:
 *                             type: string
 *                             description: Product SKU
 *                           image:
 *                             type: string
 *                             description: Product image URL with image/ prefix
 *                           description:
 *                             type: string
 *                             description: Product description
 *                           status:
 *                             type: boolean
 *                             description: Product status
 *                           categories:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                   description: Category ID
 *                                 name:
 *                                   type: string
 *                                   description: Category name
 *                           options:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 option:
 *                                   type: object
 *                                   properties:
 *                                     _id:
 *                                       type: string
 *                                       description: Option ID
 *                                     name:
 *                                       type: string
 *                                       description: Option name
 *                                 price:
 *                                   type: number
 *                                   description: Option price
 *                           addedAt:
 *                             type: string
 *                             format: date-time
 *                             description: When product was added to wishlist
 *                 message:
 *                   type: string
 *                   example: "Wishlist retrieved successfully"
 *             examples:
 *               success:
 *                 summary: Successful wishlist retrieval
 *                 value:
 *                   data: {
 *                     _id: "507f1f77bcf86cd799439011",
 *                     customer: "507f1f77bcf86cd799439012",
 *                     items: [
 *                       {
 *                         _id: "507f1f77bcf86cd799439013",
 *                         product: "507f1f77bcf86cd799439014",
 *                         productDetails: {
 *                           _id: "507f1f77bcf86cd799439014",
 *                           productModel: "Anne's Cross Stitch Pattern",
 *                           sku: "ACS-001",
 *                           image: "/catalog/product/main-image.jpg",
 *                           description: "Beautiful cross stitch pattern",
 *                           status: true
 *                         },
 *                         addedAt: "2024-01-15T10:30:00Z"
 *                       }
 *                     ],
 *                     totalItems: 1,
 *                     createdAt: "2024-01-15T10:30:00Z",
 *                     updatedAt: "2024-01-15T10:30:00Z"
 *                   }
 *                   message: "Wishlist retrieved successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing customer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Customer access required
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
router.get('/', getWishlist);

/**
 * @swagger
 * /wishlist/add:
 *   post:
 *     summary: Add product to wishlist
 *     description: Add a product to the customer's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - customerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WishlistAdd'
 *           examples:
 *             addItemExample:
 *               summary: Add item example
 *               value:
 *                 productId: "507f1f77bcf86cd799439013"
 *     responses:
 *       200:
 *         description: Product added to wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Success status
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Product added to wishlist successfully"
 *                     wishlist:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Wishlist ID
 *                         itemCount:
 *                           type: number
 *                           description: Number of items in wishlist
 *                 message:
 *                   type: string
 *                   example: "Product added to wishlist successfully"
 *             examples:
 *               success:
 *                 summary: Successful item addition
 *                 value:
 *                   data: {
 *                     _id: "507f1f77bcf86cd799439011",
 *                     totalItems: 1,
 *                     items: [
 *                       {
 *                         _id: "507f1f77bcf86cd799439013",
 *                         product: "507f1f77bcf86cd799439014",
 *                         productDetails: {
 *                           _id: "507f1f77bcf86cd799439014",
 *                           productModel: "Anne's Cross Stitch Pattern",
 *                           sku: "ACS-001",
 *                           image: "/catalog/product/main-image.jpg"
 *                         },
 *                         addedAt: "2024-01-15T10:30:00Z"
 *                       }
 *                     ]
 *                   }
 *                   message: "Product added to wishlist successfully"
 *       400:
 *         description: Validation error or invalid product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validationError:
 *                 summary: Validation error
 *                 value:
 *                   message: "Product ID is required"
 *                   error: "VALIDATION_ERROR"
 *                   type: "VALIDATION_ERROR"
 *               productNotFound:
 *                 summary: Product not found
 *                 value:
 *                   message: "Product not found"
 *                   error: "PRODUCT_NOT_FOUND"
 *                   type: "RESOURCE_NOT_FOUND"
 *       401:
 *         description: Unauthorized - Invalid or missing customer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Customer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Product already in wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               alreadyInWishlist:
 *                 summary: Product already in wishlist
 *                 value:
 *                   message: "Product already in wishlist"
 *                   error: "PRODUCT_ALREADY_IN_WISHLIST"
 *                   type: "DUPLICATE_KEY"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/add', addToWishlist);

/**
 * @swagger
 * /wishlist/remove/{productId}:
 *   delete:
 *     summary: Remove product from wishlist
 *     description: Remove a specific product from the customer's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - customerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Product ID (24 character hex string)
 *         example: "507f1f77bcf86cd799439013"
 *     responses:
 *       200:
 *         description: Product removed from wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Success status
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Product removed from wishlist successfully"
 *                     wishlist:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Wishlist ID
 *                         itemCount:
 *                           type: number
 *                           description: Number of items in wishlist
 *                 message:
 *                   type: string
 *                   example: "Product removed from wishlist successfully"
 *       400:
 *         description: Invalid product ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing customer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Customer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found in wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notInWishlist:
 *                 summary: Product not in wishlist
 *                 value:
 *                   message: "Product not found in wishlist"
 *                   error: "PRODUCT_NOT_IN_WISHLIST"
 *                   type: "RESOURCE_NOT_FOUND"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/remove/:productId', removeFromWishlist);

export default router;
