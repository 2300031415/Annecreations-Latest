// routes/backup.routes.ts
import express from 'express';

import {
  createBackupHandler,
  restoreBackupHandler,
  getBackupsHandler,
  deleteBackupHandler,
} from '../controllers/backup.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// All backup routes require admin authentication
router.use(authenticateAdmin);

// Get list of backups

/**
 * @swagger
 * /backup:
 *   get:
 *     summary: Get list of backups
 *     description: Retrieve a list of all available database backups (admin only)
 *     tags: [Backup, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
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
 *           default: 20
 *         description: Number of backups per page
 *     responses:
 *       200:
 *         description: Backups list retrieved successfully
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
 *                       description: Number of backups
 *                     backups:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Backup file name
 *                           path:
 *                             type: string
 *                             description: Full path to backup file
 *                           size:
 *                             type: string
 *                             description: Human-readable file size
 *                           size_raw:
 *                             type: number
 *                             description: Raw file size in bytes
 *                           created:
 *                             type: string
 *                             format: date-time
 *                             description: Backup creation timestamp
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
router.get('/', getBackupsHandler);

// Create new backup

/**
 * @swagger
 * /backup:
 *   post:
 *     summary: Create new backup
 *     description: Create a new database backup (admin only)
 *     tags: [Backup, Admin]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [full, incremental]
 *                 default: full
 *                 description: Type of backup to create
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional description for the backup
 *               includeFiles:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to include uploaded files in backup
 *             required:
 *               - type
 *     responses:
 *       201:
 *         description: Backup creation started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Success status
 *                 message:
 *                   type: string
 *                   example: "Backup created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     backupName:
 *                       type: string
 *                       description: Name of created backup file
 *                     path:
 *                       type: string
 *                       description: Full path to backup file
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Backup creation timestamp
 *       400:
 *         description: Bad request - Invalid backup parameters
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
 *       409:
 *         description: Conflict - Another backup is already in progress
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
router.post('/', createBackupHandler);

// Restore from backup

/**
 * @swagger
 * /backup/restore/{backupName}:
 *   post:
 *     summary: Restore from backup
 *     description: Restore database from a specific backup (admin only)
 *     tags: [Backup, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: backupName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the backup file to restore from
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               confirm:
 *                 type: boolean
 *                 description: Confirmation that restore operation is intended
 *               includeFiles:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to restore uploaded files
 *               preview:
 *                 type: boolean
 *                 default: false
 *                 description: Preview changes without applying them
 *             required:
 *               - confirm
 *     responses:
 *       200:
 *         description: Backup restore started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Success status
 *                 message:
 *                   type: string
 *                   example: "Database restored successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     backupName:
 *                       type: string
 *                       description: Name of backup that was restored
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Restore completion timestamp
 *       400:
 *         description: Bad request - Invalid restore parameters
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
 *         description: Backup file not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Another operation is in progress
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
router.post('/restore/:backupName', restoreBackupHandler);

// Delete a backup

/**
 * @swagger
 * /backup/{backupName}:
 *   delete:
 *     summary: Delete a backup
 *     description: Delete a specific backup file (admin only)
 *     tags: [Backup, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: backupName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the backup file to delete
 *     responses:
 *       200:
 *         description: Backup deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Success status
 *                 message:
 *                   type: string
 *                   example: "Backup deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     backupName:
 *                       type: string
 *                       description: Name of deleted backup
 *       400:
 *         description: Bad request - Invalid backup name
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
 *         description: Backup file not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Backup is currently being used
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
router.delete('/:backupName', deleteBackupHandler);

export default router;
