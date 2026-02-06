// routes/system.routes.ts
import express from 'express';

import systemController from '../controllers/system.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /system:
 *   get:
 *     summary: Get system information
 *     description: Retrieve basic system information and available endpoints
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OpenCart REST API with Enhanced File Management"
 *                 version:
 *                   type: string
 *                   example: "2.1"
 *                 documentation:
 *                   type: string
 *                   example: "/api/docs"
 *                 healthCheck:
 *                   type: string
 *                   example: "/api/health"
 *                 metrics:
 *                   type: string
 *                   example: "/api/metrics"
 */
router.get('/', (req, res) => {
  res.json({
    message: 'OpenCart REST API with Enhanced File Management',
    version: '2.1',
    documentation: '/api/docs',
    healthCheck: '/api/health',
    metrics: '/api/metrics',
  });
});

// Public health check

/**
 * @swagger
 * /system/health:
 *   get:
 *     summary: System health check
 *     description: Check the health status of the system and its dependencies
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy
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
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                       description: Overall system health status
 *                     checks:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                           description: Database health status
 *                         filesystem:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                           description: File system health status
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Health check timestamp
 *       503:
 *         description: System is unhealthy
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
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                       description: Overall system health status
 *                     checks:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                           description: Database health status
 *                         filesystem:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                           description: File system health status
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Health check timestamp
 */
router.get('/health', systemController.getHealthCheck);

// Public metrics endpoint

/**
 * @swagger
 * /system/metrics:
 *   get:
 *     summary: Get system metrics
 *     description: Retrieve system performance metrics and statistics
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System metrics retrieved successfully
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
 *                     memory:
 *                       type: object
 *                       properties:
 *                         rss:
 *                           type: number
 *                           description: Resident Set Size
 *                         heapTotal:
 *                           type: number
 *                           description: Total heap size
 *                         heapUsed:
 *                           type: number
 *                           description: Used heap size
 *                         external:
 *                           type: number
 *                           description: External memory usage
 *                         arrayBuffers:
 *                           type: number
 *                           description: Array buffer memory usage
 *                     cpu:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: number
 *                           description: User CPU time in microseconds
 *                         system:
 *                           type: number
 *                           description: System CPU time in microseconds
 *                     uptime:
 *                       type: number
 *                       description: Process uptime in seconds
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Metrics timestamp
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/metrics', systemController.getSystemMetrics);

// Admin routes

/**
 * @swagger
 * /system/overview:
 *   get:
 *     summary: Get system overview
 *     description: Retrieve comprehensive system overview and statistics (admin only)
 *     tags: [System, Admin]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: System overview retrieved successfully
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
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           description: Database connection status
 *                         name:
 *                           type: string
 *                           description: Database name
 *                         total_collections:
 *                           type: number
 *                           description: Total number of collections
 *                         total_documents:
 *                           type: number
 *                           description: Total number of documents
 *                         total_indexes:
 *                           type: number
 *                           description: Total number of indexes
 *                         collections:
 *                           type: object
 *                           additionalProperties:
 *                             type: object
 *                             properties:
 *                               count:
 *                                 type: number
 *                                 description: Document count
 *                               size:
 *                                 type: number
 *                                 description: Collection size in bytes
 *                               avgObjSize:
 *                                 type: number
 *                                 description: Average object size
 *                               indexes:
 *                                 type: number
 *                                 description: Number of indexes
 *                               error:
 *                                 type: string
 *                                 description: Error message if any
 *                     server:
 *                       type: object
 *                       properties:
 *                         node_version:
 *                           type: string
 *                           description: Node.js version
 *                         platform:
 *                           type: string
 *                           description: Operating system platform
 *                         arch:
 *                           type: string
 *                           description: System architecture
 *                         uptime:
 *                           type: number
 *                           description: Process uptime in seconds
 *                         memory_usage:
 *                           type: object
 *                           description: Memory usage statistics
 *                         pid:
 *                           type: number
 *                           description: Process ID
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Overview timestamp
 *       401:
 *         description: Unauthorized - Admin authentication required
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
router.get('/overview', authenticateAdmin, systemController.getSystemOverview);

export default router;
