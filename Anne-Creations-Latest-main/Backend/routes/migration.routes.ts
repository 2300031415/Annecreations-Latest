// routes/migration.routes.ts
import express from 'express';

import migrationController from '../controllers/migration.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// All migration routes require admin authentication
router.use(authenticateAdmin);

/**
 * @swagger
 * /migration/status:
 *   get:
 *     summary: Get migration status
 *     description: Retrieve the current status of all database migrations (admin only)
 *     tags: [Migration, Admin]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Migration status retrieved successfully
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
 *                     overview:
 *                       type: object
 *                       properties:
 *                         total_migrations:
 *                           type: number
 *                           description: Total number of migrations
 *                         completed:
 *                           type: number
 *                           description: Number of completed migrations
 *                         failed:
 *                           type: number
 *                           description: Number of failed migrations
 *                         running:
 *                           type: number
 *                           description: Number of running migrations
 *                         progress_percentage:
 *                           type: number
 *                           description: Overall migration progress percentage
 *                     migrations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MigrationStatus'
 *                     collections:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                       description: Collection document counts
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Report generation timestamp
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
router.get('/status', migrationController.getMigrationStatus);

/**
 * @swagger
 * /migration/details/{name}:
 *   get:
 *     summary: Get migration details
 *     description: Retrieve detailed information about a specific migration (admin only)
 *     tags: [Migration, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Migration name
 *     responses:
 *       200:
 *         description: Migration details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Success status
 *                 data:
 *                   $ref: '#/components/schemas/MigrationStatus'
 *       400:
 *         description: Bad request - Invalid migration name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Migration not found
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
router.get('/details/:name', migrationController.getMigrationDetails);

/**
 * @swagger
 * /migration/reset/{name}:
 *   delete:
 *     summary: Reset migration status
 *     description: Reset the status of a specific migration to pending (admin only)
 *     tags: [Migration, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Migration name to reset
 *     responses:
 *       200:
 *         description: Migration status reset successfully
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
 *                       example: "Migration status reset successfully"
 *                     migration_name:
 *                       type: string
 *                       description: Name of reset migration
 *                     migration_id:
 *                       type: string
 *                       description: ID of reset migration
 *       400:
 *         description: Bad request - Invalid migration name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Migration not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Migration is currently running
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
router.delete('/reset/:name', migrationController.resetMigrationStatus);

export default router;
