import express from 'express';

import {
  startSession,
  getOnlineUsers,
  getUserActivity,
  getSearchAnalytics,
  getAuditLogs,
  getSystemOverview,
  getOnlineUserDetails,
} from '../controllers/analytics.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Feature, PermissionAction } from '../types/models/role';

const router = express.Router();

/**
 * @swagger
 * /analytics/start:
 *   get:
 *     summary: Initialize browser session
 *     description: Get or create a browser ID for tracking user sessions (public, no auth required)
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Browser ID initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Success status
 *                   example: true
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/start', startSession);

// System overview

/**
 * @swagger
 * /analytics/overview:
 *   get:
 *     summary: Get analytics overview
 *     description: Retrieve comprehensive analytics overview and key metrics (admin only)
 *     tags: [Analytics, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: week
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Analytics overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp of the overview data
 *                 online:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Total online users
 *                     customers:
 *                       type: number
 *                       description: Online customers
 *                     guests:
 *                       type: number
 *                       description: Online guests
 *                 totals:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: number
 *                       description: Total products
 *                     customers:
 *                       type: number
 *                       description: Total customers
 *                     orders:
 *                       type: number
 *                       description: Total orders
 *                     searches_30d:
 *                       type: number
 *                       description: Total searches in last 30 days
 *                 new_30d:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: number
 *                       description: New products in last 30 days
 *                     customers:
 *                       type: number
 *                       description: New customers in last 30 days
 *                     orders:
 *                       type: number
 *                       description: New orders in last 30 days
 *                 top_products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: string
 *                         description: Product ID
 *                       name:
 *                         type: string
 *                         description: Product name
 *                       views:
 *                         type: number
 *                         description: Number of views
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
router.get(
  '/overview',
  authenticateAdmin,
  checkPermission(Feature.ANALYTICS, PermissionAction.READ),
  getSystemOverview
);

// Online users analytics

/**
 * @swagger
 * /analytics/online-users:
 *   get:
 *     summary: Get online users analytics
 *     description: Retrieve analytics about currently online users (admin only)
 *     tags: [Analytics, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of online users to return
 *     responses:
 *       200:
 *         description: Online users analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Online user ID
 *                       userId:
 *                         type: string
 *                         description: User ID
 *                       userType:
 *                         type: string
 *                         description: Type of user (customer, guest)
 *                       ipAddress:
 *                         type: string
 *                         description: User's IP address
 *                       userAgent:
 *                         type: string
 *                         description: User's browser agent
 *                       lastActivity:
 *                         type: string
 *                         format: date-time
 *                         description: Last activity timestamp
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     activeUsers:
 *                       type: number
 *                       description: Number of active users
 *                     totalOnline:
 *                       type: number
 *                       description: Total online users
 *                     totalUsers:
 *                       type: number
 *                       description: Total users in database
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
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
router.get(
  '/online-users',
  authenticateAdmin,
  checkPermission(Feature.ANALYTICS, PermissionAction.READ),
  getOnlineUsers
);

// Online user details

/**
 * @swagger
 * /analytics/online-users/details:
 *   get:
 *     summary: Get detailed online user data
 *     description: Retrieve detailed online user data with all tracked fields (admin only)
 *     tags: [Analytics, Admin]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Online user details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sessionId:
 *                             type: string
 *                             description: Unique session identifier
 *                           userType:
 *                             type: string
 *                             enum: [customer, admin, guest]
 *                             description: Type of user
 *                           customerId:
 *                             type: string
 *                             nullable: true
 *                             description: Customer ID if logged in, null if guest
 *                           isGuest:
 *                             type: boolean
 *                             description: Whether user is a guest
 *                           lastPageVisited:
 *                             type: string
 *                             description: Last page visited by user
 *                           pageUrl:
 *                             type: string
 *                             description: Full URL of last page
 *                           source:
 *                             type: string
 *                             enum: [web, mobile]
 *                             description: Source of request (web or mobile)
 *                           lastActivity:
 *                             type: string
 *                             format: date-time
 *                             description: Last activity timestamp
 *                           isActive:
 *                             type: boolean
 *                             description: Whether user is currently active (within 5 minutes)
 *                           ipAddress:
 *                             type: string
 *                             description: User's IP address
 *                           userAgent:
 *                             type: string
 *                             description: User's browser agent string
 *                           userId:
 *                             type: string
 *                             nullable: true
 *                             description: User ID
 *                           username:
 *                             type: string
 *                             nullable: true
 *                             description: Username
 *                           email:
 *                             type: string
 *                             nullable: true
 *                             description: Email address
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: Record creation timestamp
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             description: Record last update timestamp
 *                     total:
 *                       type: number
 *                       description: Total number of online users
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalOnline:
 *                           type: number
 *                           description: Total online users
 *                         customersOnline:
 *                           type: number
 *                           description: Online customers
 *                         adminsOnline:
 *                           type: number
 *                           description: Online admins
 *                         guestsOnline:
 *                           type: number
 *                           description: Online guests
 *                     fieldMapping:
 *                       type: object
 *                       description: Mapping of tracked fields
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Response timestamp
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
router.get(
  '/online-users/details',
  authenticateAdmin,
  checkPermission(Feature.ANALYTICS, PermissionAction.READ),
  getOnlineUserDetails
);

// User activity analytics

/**
 * @swagger
 * /analytics/user-activity:
 *   get:
 *     summary: Get user activity analytics
 *     description: Retrieve analytics about user activities and behavior (admin only)
 *     tags: [Analytics, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [login, logout, page_view, search, order, download]
 *         description: Filter by activity type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of activities to return
 *     responses:
 *       200:
 *         description: User activity analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Activity ID
 *                       userId:
 *                         type: string
 *                         description: User ID
 *                       userType:
 *                         type: string
 *                         description: Type of user
 *                       action:
 *                         type: string
 *                         description: Action performed
 *                       ipAddress:
 *                         type: string
 *                         description: User's IP address
 *                       userAgent:
 *                         type: string
 *                         description: User's browser agent
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Activity timestamp
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Total number of activities
 *                     byActivity:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                       description: Count of activities by type
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
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
router.get(
  '/user-activity',
  authenticateAdmin,
  checkPermission(Feature.ANALYTICS, PermissionAction.READ),
  getUserActivity
);

// Search analytics

/**
 * @swagger
 * /analytics/searches:
 *   get:
 *     summary: Get search analytics
 *     description: Retrieve analytics about search behavior and patterns (admin only)
 *     tags: [Analytics, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of search terms to return
 *     responses:
 *       200:
 *         description: Search analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                   description: Time period for analytics
 *                 searches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Search log ID
 *                       query:
 *                         type: string
 *                         description: Search query
 *                       resultsCount:
 *                         type: number
 *                         description: Number of results returned
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Search timestamp
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalSearches:
 *                       type: number
 *                       description: Total number of searches in period
 *                     popularSearches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           query:
 *                             type: string
 *                           count:
 *                             type: number
 *                           avgResults:
 *                             type: number
 *                           lastSearched:
 *                             type: string
 *                             format: date-time
 *                     zeroResultSearches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           query:
 *                             type: string
 *                           count:
 *                             type: number
 *                           lastSearched:
 *                             type: string
 *                             format: date-time
 *                     searchesByDay:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           count:
 *                             type: number
 *                           uniqueTerms:
 *                             type: number
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
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
router.get(
  '/searches',
  authenticateAdmin,
  checkPermission(Feature.ANALYTICS, PermissionAction.READ),
  getSearchAnalytics
);

// Audit logs

/**
 * @swagger
 * /analytics/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     description: Retrieve system audit logs for security and compliance (admin only)
 *     tags: [Analytics, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for logs (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for logs (YYYY-MM-DD)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [create, read, update, delete, login, logout]
 *         description: Filter by action type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of logs per page
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 audit_logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Audit log ID
 *                       userId:
 *                         type: string
 *                         description: User ID who performed the action
 *                       userType:
 *                         type: string
 *                         description: Type of user (customer, admin)
 *                       action:
 *                         type: string
 *                         description: Action performed
 *                       entityType:
 *                         type: string
 *                         description: Type of entity affected
 *                       entityId:
 *                         type: string
 *                         description: ID of entity affected
 *                       details:
 *                         type: object
 *                         description: Additional details about the action
 *                       ipAddress:
 *                         type: string
 *                         description: User's IP address
 *                       userAgent:
 *                         type: string
 *                         description: User's browser agent
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Action timestamp
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Total number of audit logs
 *                     byAction:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                       description: Count of actions by type
 *                     byEntityType:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                       description: Count of actions by entity type
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
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
router.get(
  '/audit-logs',
  authenticateAdmin,
  checkPermission(Feature.ANALYTICS, PermissionAction.READ),
  getAuditLogs
);

export default router;
