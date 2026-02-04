// routes/zone.routes.ts
import express from 'express';

import zoneController from '../controllers/zone.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes

/**
 * @swagger
 * /zones:
 *   get:
 *     summary: Get all zones
 *     description: Retrieve all zones with optional filtering (no pagination)
 *     tags: [Zones]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter by zone status
 *       - in: query
 *         name: countryId
 *         schema:
 *           type: string
 *         description: Filter by country ID
 *     responses:
 *       200:
 *         description: Zones retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Zone'
 *                 message:
 *                   type: string
 *                   example: "Zones retrieved successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', zoneController.getAllZones);

/**
 * @swagger
 * /zones/country/{country_id}:
 *   get:
 *     summary: Get zones by country
 *     description: Retrieve all zones for a specific country (no pagination)
 *     tags: [Zones]
 *     parameters:
 *       - in: path
 *         name: country_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Country ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter by zone status
 *     responses:
 *       200:
 *         description: Zones for country retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Zone'
 *                 message:
 *                   type: string
 *                   example: "Zones for country retrieved successfully"
 *       400:
 *         description: Bad request - Invalid country ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Country not found
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
router.get('/country/:country_id', zoneController.getZonesByCountry);

// Admin routes

/**
 * @swagger
 * /zones:
 *   post:
 *     summary: Create a new zone
 *     description: Create a new zone (admin only)
 *     tags: [Zones, Admin]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               countryId:
 *                 type: string
 *                 description: Country ID for the zone
 *               name:
 *                 type: string
 *                 maxLength: 128
 *                 description: Zone name
 *               code:
 *                 type: string
 *                 maxLength: 32
 *                 description: Zone code
 *               status:
 *                 type: boolean
 *                 default: true
 *                 description: Zone status
 *             required:
 *               - countryId
 *               - name
 *               - code
 *     responses:
 *       201:
 *         description: Zone created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Zone'
 *                 message:
 *                   type: string
 *                   example: "Zone created successfully"
 *       400:
 *         description: Bad request - Invalid zone data
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
 *         description: Country not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Zone already exists
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
router.post('/', authenticateAdmin, zoneController.createZone);

/**
 * @swagger
 * /zones/{id}:
 *   put:
 *     summary: Update a zone
 *     description: Update an existing zone (admin only)
 *     tags: [Zones, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Zone ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               countryId:
 *                 type: string
 *                 description: Country ID for the zone
 *               name:
 *                 type: string
 *                 maxLength: 128
 *                 description: Zone name
 *               code:
 *                 type: string
 *                 maxLength: 32
 *                 description: Zone code
 *               status:
 *                 type: boolean
 *                 description: Zone status
 *     responses:
 *       200:
 *         description: Zone updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Zone'
 *                 message:
 *                   type: string
 *                   example: "Zone updated successfully"
 *       400:
 *         description: Bad request - Invalid zone data
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
 *         description: Zone or country not found
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
router.put('/:id', authenticateAdmin, zoneController.updateZone);

/**
 * @swagger
 * /zones/{id}:
 *   delete:
 *     summary: Delete a zone
 *     description: Delete an existing zone (admin only)
 *     tags: [Zones, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Zone ID
 *     responses:
 *       200:
 *         description: Zone deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Zone deleted successfully"
 *       401:
 *         description: Unauthorized - Admin authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Zone not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Zone cannot be deleted (in use)
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
router.delete('/:id', authenticateAdmin, zoneController.deleteZone);

export default router;
