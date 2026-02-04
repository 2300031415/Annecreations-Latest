import express from 'express';

import orderController from '../controllers/order.controller';
import { authenticateAdmin, authenticateCustomer } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { orderCreationLimiter, orderListLimiter } from '../middleware/rate-limit.middleware';
import {
  validateObjectId,
  validatePagination,
  validateDateRange,
  validateOrderCreate,
  validateOrderStatusUpdate,
  validateOrderSearch,
  handleValidationErrors,
} from '../middleware/validation.middleware';
import { Feature, PermissionAction } from '../types/models/role';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - customer
 *         - orderTotal
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique order identifier
 *           example: "507f1f77bcf86cd799439011"
 *         customer:
 *           type: string
 *           description: Customer ID reference
 *           example: "507f1f77bcf86cd799439012"
 *         languageId:
 *           type: string
 *           description: Language ID reference (optional, defaults to English)
 *           example: "507f1f77bcf86cd799439013"
 *         orderStatus:
 *           type: string
 *           enum: [pending, paid, cancelled, refunded, failed]
 *           default: pending
 *           description: Current order status
 *           example: "pending"
 *         orderTotal:
 *           type: number
 *           minimum: 0
 *           description: Order total amount
 *           example: 29.97
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderProduct'
 *           description: Order products
 *         payment:
 *           type: object
 *           description: Payment information
 *           properties:
 *             firstName:
 *               type: string
 *               maxLength: 100
 *               description: Payment first name
 *               example: "John"
 *             lastName:
 *               type: string
 *               maxLength: 100
 *               description: Payment last name
 *               example: "Doe"
 *             company:
 *               type: string
 *               maxLength: 200
 *               description: Payment company name (optional)
 *               example: "Acme Corp"
 *             address1:
 *               type: string
 *               maxLength: 255
 *               description: Payment address line 1
 *               example: "123 Main Street"
 *             address2:
 *               type: string
 *               maxLength: 255
 *               description: Payment address line 2 (optional)
 *               example: "Apt 4B"
 *             city:
 *               type: string
 *               maxLength: 100
 *               description: Payment city
 *               example: "New York"
 *             postcode:
 *               type: string
 *               maxLength: 20
 *               description: Payment postal code
 *               example: "10001"
 *             country:
 *               type: string
 *               description: Payment country
 *               example: "United States"
 *             zone:
 *               type: string
 *               description: Payment zone/state (optional)
 *               example: "NY"
 *             addressFormat:
 *               type: string
 *               maxLength: 1000
 *               description: Payment address format (optional)
 *               example: "US"
 *             method:
 *               type: string
 *               maxLength: 100
 *               description: Payment method used
 *               example: "Credit Card"
 *             code:
 *               type: string
 *               maxLength: 100
 *               description: Payment method code
 *               example: "credit_card"
 *         history:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderHistory'
 *           description: Order status history
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Order creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     OrderProduct:
 *       type: object
 *       required:
 *         - product
 *         - subtotal
 *       properties:
 *         product:
 *           type: string
 *           description: Product ID reference
 *           example: "507f1f77bcf86cd799439016"
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductOption'
 *           description: Selected product options
 *         subtotal:
 *           type: number
 *           minimum: 0
 *           description: Product subtotal
 *           example: 9.99
 *
 *     OrderHistory:
 *       type: object
 *       properties:
 *         orderStatus:
 *           type: string
 *           enum: [pending, paid, cancelled, refunded, failed]
 *           description: Status at this point in history
 *           example: "pending"
 *         comment:
 *           type: string
 *           description: Status change comment (optional)
 *           example: "Order placed successfully"
 *         notify:
 *           type: boolean
 *           default: false
 *           description: Whether customer was notified
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Status change timestamp
 *           example: "2024-01-15T10:30:00Z"
 *
 *     OrderCreate:
 *       type: object
 *       required:
 *         - products
 *         - payment
 *       properties:
 *         languageId:
 *           type: string
 *           description: Language ID reference (optional, defaults to English)
 *           example: "507f1f77bcf86cd799439013"
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderProduct'
 *           description: Order products
 *         payment:
 *           type: object
 *           description: Payment information
 *           required:
 *             - firstName
 *             - lastName
 *             - address1
 *             - city
 *             - postcode
 *             - country
 *             - method
 *             - code
 *           properties:
 *             firstName:
 *               type: string
 *               maxLength: 100
 *               description: Payment first name
 *               example: "John"
 *             lastName:
 *               type: string
 *               maxLength: 100
 *               description: Payment last name
 *               example: "Doe"
 *             company:
 *               type: string
 *               maxLength: 200
 *               description: Payment company name (optional)
 *               example: "Acme Corp"
 *             address1:
 *               type: string
 *               maxLength: 255
 *               description: Payment address line 1
 *               example: "123 Main Street"
 *             address2:
 *               type: string
 *               maxLength: 255
 *               description: Payment address line 2 (optional)
 *               example: "Apt 4B"
 *             city:
 *               type: string
 *               maxLength: 100
 *               description: Payment city
 *               example: "New York"
 *             postcode:
 *               type: string
 *               maxLength: 20
 *               description: Payment postal code
 *               example: "10001"
 *             country:
 *               type: string
 *               description: Payment country
 *               example: "United States"
 *             zone:
 *               type: string
 *               description: Payment zone/state (optional)
 *               example: "NY"
 *             addressFormat:
 *               type: string
 *               maxLength: 1000
 *               description: Payment address format (optional)
 *               example: "US"
 *             method:
 *               type: string
 *               maxLength: 100
 *               description: Payment method used
 *               example: "Credit Card"
 *             code:
 *               type: string
 *               maxLength: 100
 *               description: Payment method code
 *               example: "credit_card"
 *
 *     OrderStatusUpdate:
 *       type: object
 *       required:
 *         - orderStatus
 *       properties:
 *         orderStatus:
 *           type: string
 *           enum: [pending, processing, paid, cancelled, refunded, failed]
 *           description: New order status
 *           example: "processing"
 *         comment:
 *           type: string
 *           maxLength: 2000
 *           description: Status change comment (optional)
 *           example: "Order is being processed"
 *         notify:
 *           type: boolean
 *           default: false
 *           description: Whether to notify customer
 *           example: true
 *
 *     OrderAnalytics:
 *       type: object
 *       properties:
 *         totalOrders:
 *           type: number
 *           description: Total number of orders
 *           example: 150
 *         totalRevenue:
 *           type: number
 *           description: Total revenue
 *           example: 4495.50
 *         averageOrderValue:
 *           type: number
 *           description: Average order value
 *           example: 29.97
 *         ordersByStatus:
 *           type: object
 *           properties:
 *             pending:
 *               type: number
 *               description: Number of pending orders
 *               example: 25
 *             processing:
 *               type: number
 *               description: Number of processing orders
 *               example: 15
 *             paid:
 *               type: number
 *               description: Number of paid orders
 *               example: 100
 *             cancelled:
 *               type: number
 *               description: Number of cancelled orders
 *               example: 5
 *             refunded:
 *               type: number
 *               description: Number of refunded orders
 *               example: 3
 *             failed:
 *               type: number
 *               description: Number of failed orders
 *               example: 2
 *         topProducts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 description: Product ID
 *               name:
 *                 type: string
 *                 description: Product name
 *               quantity:
 *                 type: number
 *                 description: Total quantity sold
 *               revenue:
 *                 type: number
 *                 description: Total revenue from this product
 */

// === CUSTOMER ROUTES (require customer authentication) ===

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get customer orders
 *     description: Retrieve all orders for the authenticated customer with pagination and date filtering
 *     tags: [Orders]
 *     security:
 *       - customerAuth: []
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
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders from date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders to date (YYYY-MM-DD)
 *         example: "2024-01-31"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, paid, cancelled, refunded, failed]
 *         description: Filter by order status
 *         example: "paid"
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   data: [
 *                     {
 *                       _id: "507f1f77bcf86cd799439011",
 *                       orderStatus: "paid",
 *                       orderTotal: 29.97,
 *                       payment: {
 *                         firstName: "John",
 *                         lastName: "Doe",
 *                         method: "Credit Card"
 *                       },
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                     }
 *                   ]
 *                   pagination: {
 *                     page: 1,
 *                     limit: 20,
 *                     total: 5,
 *                     pages: 1
 *                   }
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
router.get(
  '/',
  authenticateCustomer,
  validatePagination,
  validateDateRange,
  handleValidationErrors,
  orderController.getCustomerOrders
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order details
 *     description: Retrieve detailed information about a specific order for the authenticated customer
 *     tags: [Orders]
 *     security:
 *       - customerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Order ID (24 character hex string)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *                   example: "Order details retrieved successfully"
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   data: {
 *                     _id: "507f1f77bcf86cd799439011",
 *                     customer: "507f1f77bcf86cd799439012",
 *                     payment: {
 *                       firstName: "John",
 *                       lastName: "Doe",
 *                       company: "Acme Corp",
 *                       address1: "123 Main Street",
 *                       address2: "Apt 4B",
 *                       city: "New York",
 *                       postcode: "10001",
 *                       country: "United States",
 *                       zone: "NY",
 *                       addressFormat: "US",
 *                       method: "Credit Card",
 *                       code: "credit_card"
 *                     },
 *                     orderTotal: 29.97,
 *                     orderStatus: "paid",
 *                     languageId: {
 *                       _id: "507f1f77bcf86cd799439013",
 *                       name: "English",
 *                       code: "en-gb"
 *                     },
 *                     products: [
 *                       {
 *                         product: {
 *                           _id: "507f1f77bcf86cd799439016",
 *                           productModel: "Design Pattern",
 *                           sku: "DP001",
 *                           image: "image/design-pattern.jpg",
 *                           price: 9.99,
 *                           description: "Beautiful design pattern"
 *                         },
 *                         options: [
 *                           {
 *                             option: "507f1f77bcf86cd799439017",
 *                             price: 9.99
 *                           }
 *                         ],
 *                         subtotal: 9.99
 *                       }
 *                     ],
 *                     history: [
 *                       {
 *                         orderStatus: "pending",
 *                         comment: "Order placed",
 *                         notify: false,
 *                         createdAt: "2024-01-15T10:30:00Z"
 *                       },
 *                       {
 *                         orderStatus: "paid",
 *                         comment: "Payment completed via Razorpay",
 *                         notify: true,
 *                         createdAt: "2024-01-15T10:35:00Z"
 *                       }
 *                     ],
 *                     createdAt: "2024-01-15T10:30:00Z",
 *                     updatedAt: "2024-01-15T10:35:00Z"
 *                   }
 *                   message: "Order details retrieved successfully"
 *       400:
 *         description: Invalid order ID format
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
 *         description: Forbidden - Customer access required or order doesn't belong to customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
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
  '/:id',
  authenticateCustomer,
  validateObjectId,
  handleValidationErrors,
  orderController.getOrderDetails
);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create new order
 *     description: Create a new order for the authenticated customer
 *     tags: [Orders]
 *     security:
 *       - customerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderCreate'
 *           examples:
 *             orderExample:
 *               summary: Order creation example
 *               value:
 *                 languageId: "507f1f77bcf86cd799439013"
 *                 products: [
 *                   {
 *                     product: "507f1f77bcf86cd799439016",
 *                     subtotal: 9.99
 *                   }
 *                 ]
 *                 payment: {
 *                   firstName: "John",
 *                   lastName: "Doe",
 *                   address1: "123 Main Street",
 *                   city: "New York",
 *                   postcode: "10001",
 *                   country: "United States",
 *                   method: "Credit Card",
 *                   code: "credit_card"
 *                 }
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *                   example: "Order created successfully"
 *             examples:
 *               success:
 *                 summary: Successful order creation
 *                 value:
 *                   data: {
 *                     _id: "507f1f77bcf86cd799439011",
 *                     orderStatus: "pending",
 *                     orderTotal: 29.97,
 *                     payment: {
 *                       firstName: "John",
 *                       lastName: "Doe"
 *                     },
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                   }
 *                   message: "Order created successfully"
 *       400:
 *         description: Validation error or invalid data
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
 *       429:
 *         description: Too many order creation attempts - Rate limit exceeded
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
// Order creation is handled through checkout process
// router.post('/', ...);

// === ADMIN ROUTES (require admin authentication) ===

/**
 * @swagger
 * /orders/admin/all:
 *   get:
 *     summary: Get all orders (Admin only)
 *     description: Retrieve all orders with advanced filtering, searching, and pagination for admin management
 *     tags: [Orders - Admin]
 *     security:
 *       - adminAuth: []
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
 *         description: Search by customer name or email
 *         example: "john doe"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, paid, cancelled, refunded, failed]
 *         description: Filter by order status
 *         example: "paid"
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders from date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders to date (YYYY-MM-DD)
 *         example: "2024-01-31"
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, total, orderStatus]
 *           default: createdAt
 *         description: Field to sort by
 *         example: "createdAt"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *         example: "desc"
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
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
router.get(
  '/admin/all',
  authenticateAdmin,
  checkPermission(Feature.ORDERS, PermissionAction.READ),
  orderListLimiter,
  validateOrderSearch,
  handleValidationErrors,
  orderController.getAllOrders
);

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     summary: Update order status (Admin only)
 *     description: Update the status of a specific order with optional notification
 *     tags: [Orders - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Order ID (24 character hex string)
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderStatusUpdate'
 *           examples:
 *             statusUpdateExample:
 *               summary: Status update example
 *               value:
 *                 orderStatus: "processing"
 *                 comment: "Order is being processed"
 *                 notify: true
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *                   example: "Order status updated successfully"
 *       400:
 *         description: Validation error or invalid order ID
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
 *         description: Order not found
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
  '/:id/status',
  authenticateAdmin,
  checkPermission(Feature.ORDERS, PermissionAction.UPDATE),
  validateOrderStatusUpdate,
  handleValidationErrors,
  orderController.updateOrderStatus
);

/**
 * @swagger
 * /orders/admin/analytics:
 *   get:
 *     summary: Get order analytics (Admin only)
 *     description: Retrieve comprehensive order analytics and statistics for admin dashboard
 *     tags: [Orders - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Analytics from date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Analytics to date (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/OrderAnalytics'
 *                 message:
 *                   type: string
 *                   example: "Analytics retrieved successfully"
 *             examples:
 *               success:
 *                 summary: Successful analytics response
 *                 value:
 *                   data: {
 *                     totalOrders: 150,
 *                     totalRevenue: 4495.50,
 *                     averageOrderValue: 29.97,
 *                     ordersByStatus: {
 *                       pending: 25,
 *                       processing: 15,
 *                       paid: 100,
 *                       cancelled: 5,
 *                       refunded: 3,
 *                       failed: 2
 *                     },
 *                     topProducts: [
 *                       {
 *                         product: "507f1f77bcf86cd799439016",
 *                         name: "Cross Stitch Pattern",
 *                         quantity: 50,
 *                         revenue: 499.50
 *                       }
 *                     ]
 *                   }
 *                   message: "Analytics retrieved successfully"
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
router.get(
  '/admin/analytics',
  authenticateAdmin,
  checkPermission(Feature.ORDERS, PermissionAction.READ),
  validateDateRange,
  handleValidationErrors,
  orderController.getOrderAnalytics
);

/**
 * @swagger
 * /orders/admin/customers-by-product:
 *   get:
 *     summary: Get customers by product model (Admin only)
 *     description: Retrieve all customers who purchased a specific product model
 *     tags: [Orders - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: productModel
 *         required: true
 *         schema:
 *           type: string
 *         description: Product model to search for
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productModel:
 *                   type: string
 *                 totalCustomers:
 *                   type: number
 *                 customers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       customer:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                       totalPurchases:
 *                         type: number
 *                       totalSpent:
 *                         type: number
 *                       firstPurchase:
 *                         type: string
 *                         format: date-time
 *                       lastPurchase:
 *                         type: string
 *                         format: date-time
 *                       orders:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             orderId:
 *                               type: string
 *                             orderNumber:
 *                               type: string
 *                             orderDate:
 *                               type: string
 *                               format: date-time
 *                             amount:
 *                               type: number
 *       400:
 *         description: Bad request - Product model required
 *       500:
 *         description: Internal server error
 */
router.get(
  '/admin/customers-by-product',
  authenticateAdmin,
  checkPermission(Feature.ORDERS, PermissionAction.READ),
  orderController.getCustomersByProductModel
);

/**
 * @swagger
 * /orders/admin/statuses:
 *   get:
 *     summary: Get order statuses (Admin only)
 *     description: Retrieve all available order statuses for admin reference
 *     tags: [Orders - Admin]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Order statuses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [pending, processing, paid, cancelled, refunded, failed]
 *                 message:
 *                   type: string
 *                   example: "Order statuses retrieved successfully"
 *             examples:
 *               success:
 *                 summary: Successful statuses response
 *                 value:
 *                   data: ["pending", "processing", "paid", "cancelled", "refunded", "failed"]
 *                   message: "Order statuses retrieved successfully"
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
router.get(
  '/admin/statuses',
  authenticateAdmin,
  checkPermission(Feature.ORDERS, PermissionAction.READ),
  orderController.getOrderStatuses
);

/**
 * @swagger
 * /orders/payment/create:
 *   post:
 *     summary: Create Razorpay payment order
 *     description: Create a Razorpay payment order for an existing order
 *     tags: [Orders - Payment]
 *     security:
 *       - customerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order ID to create payment for
 *                 example: "507f1f77bcf86cd799439011"
 *               amount:
 *                 type: number
 *                 description: Payment amount in rupees
 *                 example: 29.97
 *               currency:
 *                 type: string
 *                 default: "INR"
 *                 description: Payment currency
 *                 example: "INR"
 *             required:
 *               - orderId
 *               - amount
 *     responses:
 *       200:
 *         description: Payment order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       description: Internal order ID
 *                     razorpayOrderId:
 *                       type: string
 *                       description: Razorpay order ID
 *                     amount:
 *                       type: number
 *                       description: Payment amount in paise
 *                     currency:
 *                       type: string
 *                       description: Payment currency
 *                     key:
 *                       type: string
 *                       description: Razorpay public key for frontend
 *                 message:
 *                   type: string
 *                   example: "Payment order created successfully"
 *       400:
 *         description: Bad request - Invalid order or amount
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
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
// Payment order creation is handled by checkout controller

/**
 * @swagger
 * /orders/payment/verify:
 *   post:
 *     summary: Verify payment and update order
 *     description: Verify Razorpay payment signature and update order status
 *     tags: [Orders - Payment]
 *     security:
 *       - customerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Internal order ID
 *                 example: "507f1f77bcf86cd799439011"
 *               razorpayOrderId:
 *                 type: string
 *                 description: Razorpay order ID
 *                 example: "order_1234567890"
 *               razorpayPaymentId:
 *                 type: string
 *                 description: Razorpay payment ID
 *                 example: "pay_1234567890"
 *               razorpaySignature:
 *                 type: string
 *                 description: Razorpay payment signature for verification
 *                 example: "abc123def456..."
 *             required:
 *               - orderId
 *               - razorpayOrderId
 *               - razorpayPaymentId
 *               - razorpaySignature
 *     responses:
 *       200:
 *         description: Payment verified and order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       description: Internal order ID
 *                     orderStatus:
 *                       type: string
 *                       description: Updated order status
 *                     paymentStatus:
 *                       type: string
 *                       description: Payment status
 *                     paymentId:
 *                       type: string
 *                       description: Razorpay payment ID
 *                     paidAt:
 *                       type: string
 *                       format: date-time
 *                       description: Payment completion timestamp
 *                 message:
 *                   type: string
 *                   example: "Payment verified successfully"
 *       400:
 *         description: Bad request - Invalid signature or payment not captured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
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
// Payment verification is handled by checkout controller

/**
 * @swagger
 * /orders/payment/webhook:
 *   post:
 *     summary: Process Razorpay payment webhook
 *     description: Handle webhook events from Razorpay for payment status updates
 *     tags: [Orders - Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 description: Webhook event type
 *                 example: "payment.captured"
 *               payload:
 *                 type: object
 *                 description: Webhook payload data
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *       400:
 *         description: Bad request - Invalid webhook signature
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
// Payment webhook processing is handled by checkout controller

// Refund processing is handled by checkout controller

// Payment details are handled by checkout controller
// router.get('/admin/:orderId/payment-details', ...);

export default router;
