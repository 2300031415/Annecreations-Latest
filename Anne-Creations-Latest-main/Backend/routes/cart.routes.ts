// routes/cart.routes.ts - ENHANCED
import express from 'express';

import cartController from '../controllers/cart.controller';
import { authenticateCustomer } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       required:
 *         - product
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique cart item identifier
 *           example: "507f1f77bcf86cd799439011"
 *         product:
 *           type: string
 *           description: Product ID reference
 *           example: "507f1f77bcf86cd799439012"
 *         productDetails:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               description: Product ID
 *               example: "507f1f77bcf86cd799439012"
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
 *               example: "/image/catalog/product/main-image.jpg"
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               option:
 *                 type: string
 *                 description: Product option ID
 *                 example: "507f1f77bcf86cd799439013"
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Option price
 *                 example: 9.99
 *         subtotal:
 *           type: number
 *           minimum: 0
 *           description: Item subtotal
 *           example: 19.98
 *         addedAt:
 *           type: string
 *           format: date-time
 *           description: When item was added to cart
 *           example: "2024-01-15T10:30:00Z"
 *
 *     Cart:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique cart identifier
 *           example: "507f1f77bcf86cd799439011"
 *         customerId:
 *           type: string
 *           description: Customer ID reference
 *           example: "507f1f77bcf86cd799439012"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *           description: Cart items
 *         itemCount:
 *           type: number
 *           minimum: 0
 *           description: Total number of items in cart
 *           example: 5
 *         subtotal:
 *           type: number
 *           minimum: 0
 *           description: Total cart subtotal
 *           example: 49.95
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Cart creation timestamp
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00Z"
 *
 *     CartItemAdd:
 *       type: object
 *       required:
 *         - productId
 *       properties:
 *         productId:
 *           type: string
 *           description: Product ID reference
 *           example: "507f1f77bcf86cd799439012"
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of product option IDs
 *           example: ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
 *
 *     CartItemUpdate:
 *       type: object
 *       properties:
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of product option IDs
 *           example: ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
 */

// All cart routes require authentication
router.use(authenticateCustomer);

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get customer cart
 *     description: Retrieve the current customer's shopping cart with all items and totals
 *     tags: [Cart]
 *     security:
 *       - customerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Cart ID
 *                 customerId:
 *                   type: string
 *                   description: Customer ID
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Cart item ID
 *                       product:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Product ID
 *                           productModel:
 *                             type: string
 *                             description: Product model
 *                           sku:
 *                             type: string
 *                             description: Product SKU
 *                           image:
 *                             type: string
 *                             description: Product image URL with /image prefix
 *                           description:
 *                             type: string
 *                             description: Product description
 *                       options:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             option:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                   description: Option ID
 *                                 name:
 *                                   type: string
 *                                   description: Option name
 *                             price:
 *                               type: number
 *                               description: Option price
 *                       subtotal:
 *                         type: number
 *                         description: Item subtotal
 *                 itemCount:
 *                   type: number
 *                   description: Number of items in cart
 *                 subtotal:
 *                   type: number
 *                   description: Total cart subtotal
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Cart creation timestamp
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Last update timestamp
 *             examples:
 *               success:
 *                 summary: Successful cart retrieval
 *                 value:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   customerId: "507f1f77bcf86cd799439012"
 *                   items: [
 *                     {
 *                       _id: "507f1f77bcf86cd799439013",
 *                       product: "507f1f77bcf86cd799439014",
 *                       options: [
 *                         {
 *                           option: "507f1f77bcf86cd799439015",
 *                           price: 19.98
 *                         }
 *                       ],
 *                       subtotal: 19.98
 *                     }
 *                   ]
 *                   itemCount: 1
 *                   subtotal: 19.98
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
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
router.get('/', cartController.getCart);

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Add item to cart
 *     description: Add a product to the customer's shopping cart with specified quantity and options
 *     tags: [Cart]
 *     security:
 *       - customerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartItemAdd'
 *           examples:
 *             addItemExample:
 *               summary: Add item example
 *               value:
 *                 productId: "507f1f77bcf86cd799439012"
 *                 options: ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Item added to cart successfully"
 *                 cart:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Cart ID
 *                     itemCount:
 *                       type: number
 *                       description: Number of items in cart
 *                     subtotal:
 *                       type: number
 *                       description: Cart subtotal
 *             examples:
 *               success:
 *                 summary: Successful item addition
 *                 value:
 *                   message: "Item added to cart successfully"
 *                   cart: {
 *                     id: "507f1f77bcf86cd799439011",
 *                     itemCount: 1,
 *                     subtotal: 19.98
 *                   }
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
 *                   message: "Invalid product options"
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/add', cartController.addToCart);

/**
 * @swagger
 * /cart/items/{itemId}:
 *   put:
 *     summary: Update cart item options
 *     description: Update the options of an existing item in the customer's cart (digital products don't have quantities)
 *     tags: [Cart]
 *     security:
 *       - customerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartItemUpdate'
 *           examples:
 *             updateItemExample:
 *               summary: Update item example
 *               value:
 *                 productId: "507f1f77bcf86cd799439013"
 *                 options: [
 *                   {
 *                     option: "507f1f77bcf86cd799439015"
 *                   }
 *                 ]
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cart item updated successfully"
 *                 cart:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Cart ID
 *                     itemCount:
 *                       type: number
 *                       description: Number of items in cart
 *                     subtotal:
 *                       type: number
 *                       description: Cart subtotal
 *       400:
 *         description: Validation error or invalid item
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
 *         description: Cart item not found
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
// Update cart item by item ID (RESTful pattern)
router.put('/items/:itemId', cartController.updateCart);

/**
 * @swagger
 * /cart/remove/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     description: Remove a specific item from the customer's shopping cart
 *     tags: [Cart]
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
 *         description: Item removed from cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Item removed from cart successfully"
 *                 cart:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Cart ID
 *                     itemCount:
 *                       type: number
 *                       description: Number of items in cart
 *                     subtotal:
 *                       type: number
 *                       description: Cart subtotal
 *       400:
 *         description: Invalid item ID format
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
 *         description: Cart item not found
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
router.delete('/remove/:itemId', cartController.removeFromCart);

/**
 * @swagger
 * /cart/clear:
 *   delete:
 *     summary: Clear cart
 *     description: Remove all items from the customer's shopping cart
 *     tags: [Cart]
 *     security:
 *       - customerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cart cleared successfully"
 *                 cart:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Cart ID
 *                       example: "507f1f77bcf86cd799439011"
 *                     itemCount:
 *                       type: number
 *                       description: Number of items in cart (0)
 *                       example: 0
 *                     subtotal:
 *                       type: number
 *                       description: Cart subtotal (0)
 *                       example: 0
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
router.delete('/clear', cartController.clearCart);

export default router;
