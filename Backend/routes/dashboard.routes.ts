// routes/dashboard.routes.ts
import express from 'express';

import {
  getSalesRevenue,
  getNewOrders,
  getNewCustomers,
  getOnlineCustomers,
  getYearlyRevenue,
  getTopProducts,
  getRecentOrders,
} from '../controllers/dashboard.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Feature, PermissionAction } from '../types/models/role';

const router = express.Router();

// All dashboard routes require admin authentication
router.use(authenticateAdmin);
// All dashboard routes require read permission on dashboard
router.use(checkPermission(Feature.DASHBOARD, PermissionAction.READ));

// Dashboard analytics routes

/**
 * @swagger
 * /dashboard/sales:
 *   get:
 *     summary: Get sales revenue data
 *     description: Retrieve sales revenue analytics for the dashboard (admin only)
 *     tags: [Dashboard, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of days to look back for sales data (optional - if not provided, returns all time data)
 *     responses:
 *       200:
 *         description: Sales revenue data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                   description: Time period for sales data (e.g., "30 days" or "All time")
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   description: Start date of the period (null if all time)
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                   description: End date of the period
 *                 totalSales:
 *                   type: number
 *                   description: Total number of sales
 *                 totalRevenue:
 *                   type: number
 *                   description: Total revenue amount
 *       401:
 *         description: Unauthorized - Admin authentication required
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
router.get('/sales', getSalesRevenue);

/**
 * @swagger
 * /dashboard/orders/new:
 *   get:
 *     summary: Get new orders data
 *     description: Retrieve new orders analytics for the dashboard (admin only)
 *     tags: [Dashboard, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 7
 *         description: Number of days to look back for new orders
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of orders to return
 *     responses:
 *       200:
 *         description: New orders data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                   description: Time period for orders data (e.g., "7 days")
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                   description: Start date of the period
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                   description: End date of the period
 *                 totalOrders:
 *                   type: number
 *                   description: Total new orders in period
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       orderId:
 *                         type: string
 *                         description: Order ID
 *                       orderNumber:
 *                         type: string
 *                         description: Order number
 *                       customer:
 *                         type: string
 *                         description: Customer name
 *                       total:
 *                         type: number
 *                         description: Order total amount
 *                       status:
 *                         type: string
 *                         description: Order status
 *                       razorpayOrderId:
 *                         type: string
 *                         nullable: true
 *                         description: Razorpay order ID
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Order creation timestamp
 *       401:
 *         description: Unauthorized - Admin authentication required
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
router.get('/orders/new', getNewOrders);

/**
 * @swagger
 * /dashboard/customers/new:
 *   get:
 *     summary: Get new customers data
 *     description: Retrieve new customers analytics for the dashboard (admin only)
 *     tags: [Dashboard, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 30
 *         description: Number of days to look back for new customers
 *     responses:
 *       200:
 *         description: New customers data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                   description: Time period for customers data (e.g., "30 days")
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                   description: Start date of the period
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                   description: End date of the period
 *                 totalNewCustomers:
 *                   type: number
 *                   description: Total new customers in period
 *                 customers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       customerId:
 *                         type: string
 *                         description: Customer ID
 *                       name:
 *                         type: string
 *                         description: Customer full name
 *                       email:
 *                         type: string
 *                         description: Customer email
 *                       ipAddress:
 *                         type: string
 *                         description: Customer IP address
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Customer creation timestamp
 *       401:
 *         description: Unauthorized - Admin authentication required
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
router.get('/customers/new', getNewCustomers);

/**
 * @swagger
 * /dashboard/customers/online:
 *   get:
 *     summary: Get online customers data
 *     description: Retrieve online customers analytics for the dashboard (admin only)
 *     tags: [Dashboard, Admin]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Online customers data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalOnline:
 *                   type: number
 *                   description: Total online customers
 *                 customers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       customerId:
 *                         type: string
 *                         description: Customer ID
 *                       lastActivity:
 *                         type: string
 *                         format: date-time
 *                         description: Last activity timestamp
 *                       activityCount:
 *                         type: number
 *                         description: Number of activities
 *       401:
 *         description: Unauthorized - Admin authentication required
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
router.get('/customers/online', getOnlineCustomers);

/**
 * @swagger
 * /dashboard/revenue/yearly:
 *   get:
 *     summary: Get yearly revenue data
 *     description: Retrieve yearly revenue analytics for the dashboard (admin only)
 *     tags: [Dashboard, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2020
 *           maximum: 2030
 *         description: Year for revenue data (defaults to current year)
 *     responses:
 *       200:
 *         description: Yearly revenue data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 year:
 *                   type: integer
 *                   description: Year of revenue data
 *                 totalRevenue:
 *                   type: number
 *                   description: Total revenue for the year
 *                 totalOrders:
 *                   type: number
 *                   description: Total orders for the year
 *                 monthlyData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: integer
 *                         description: Month number (1-12)
 *                       revenue:
 *                         type: number
 *                         description: Revenue for the month
 *                       orders:
 *                         type: number
 *                         description: Number of orders for the month
 *       401:
 *         description: Unauthorized - Admin authentication required
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
router.get('/revenue/yearly', getYearlyRevenue);

/**
 * @swagger
 * /dashboard/products/top:
 *   get:
 *     summary: Get top products data
 *     description: Retrieve top performing products analytics for the dashboard (admin only)
 *     tags: [Dashboard, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 30
 *         description: Number of days to look back for product performance
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of products to return
 *     responses:
 *       200:
 *         description: Top products data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                   description: Time period for the data
 *                   example: "30 days"
 *                 topProducts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: string
 *                         description: Product ID
 *                         example: "68bc1cf10300dbb0e862e296"
 *                       name:
 *                         type: string
 *                         description: Product name/model
 *                         example: "BH428"
 *                       sku:
 *                         type: string
 *                         description: Product SKU
 *                         example: "Pot shape neck"
 *                       image:
 *                         type: string
 *                         nullable: true
 *                         description: Product image URL with image/ prefix
 *                         example: "image/uploads/products/bh428.jpg"
 *                       totalSold:
 *                         type: number
 *                         description: Total quantity sold
 *                         example: 114
 *                       totalRevenue:
 *                         type: number
 *                         description: Total revenue generated
 *                         example: 1250.50
 *       401:
 *         description: Unauthorized - Admin authentication required
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
router.get('/products/top', getTopProducts);

/**
 * @swagger
 * /dashboard/orders/recent:
 *   get:
 *     summary: Get recent orders data
 *     description: Retrieve recent orders analytics for the dashboard (admin only)
 *     tags: [Dashboard, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Maximum number of orders to return
 *     responses:
 *       200:
 *         description: Recent orders data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recentOrders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       orderId:
 *                         type: string
 *                         description: Order ID
 *                       customer:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Customer ID
 *                           name:
 *                             type: string
 *                             description: Customer full name
 *                           email:
 *                             type: string
 *                             description: Customer email
 *                       total:
 *                         type: number
 *                         description: Order total amount
 *                       status:
 *                         type: string
 *                         description: Order status
 *                       razorpayOrderId:
 *                         type: string
 *                         nullable: true
 *                         description: Razorpay order ID
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Order creation timestamp
 *       401:
 *         description: Unauthorized - Admin authentication required
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
router.get('/orders/recent', getRecentOrders);

export default router;
