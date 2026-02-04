// routes/country.routes.ts
import express from 'express';

import countryController from '../controllers/country.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes

/**
 * @swagger
 * /countries:
 *   get:
 *     summary: Get all countries
 *     description: Retrieve all countries with optional filtering (no pagination)
 *     tags: [Countries]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter by country status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search countries by name or ISO code
 *     responses:
 *       200:
 *         description: Countries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Country'
 *                 message:
 *                   type: string
 *                   example: "Countries retrieved successfully"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', countryController.getAllCountries);

/**
 * @swagger
 * /countries/{id}:
 *   get:
 *     summary: Get country by ID
 *     description: Retrieve a specific country by its ID
 *     tags: [Countries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Country ID
 *     responses:
 *       200:
 *         description: Country retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Country'
 *                 message:
 *                   type: string
 *                   example: "Country retrieved successfully"
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
router.get('/:id', countryController.getCountryById);

// Admin routes

/**
 * @swagger
 * /countries:
 *   post:
 *     summary: Create a new country
 *     description: Create a new country (admin only)
 *     tags: [Countries, Admin]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 128
 *                 description: Country name
 *               isoCode2:
 *                 type: string
 *                 maxLength: 2
 *                 description: ISO 2-letter country code
 *               isoCode3:
 *                 type: string
 *                 maxLength: 3
 *                 description: ISO 3-letter country code
 *               addressFormat:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Address format template
 *               postcodeRequired:
 *                 type: boolean
 *                 default: false
 *                 description: Whether postcode is required for addresses
 *               status:
 *                 type: boolean
 *                 default: true
 *                 description: Country status
 *             required:
 *               - name
 *               - isoCode2
 *     responses:
 *       201:
 *         description: Country created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Country'
 *                 message:
 *                   type: string
 *                   example: "Country created successfully"
 *       400:
 *         description: Bad request - Invalid country data
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
 *         description: Conflict - Country with ISO code already exists
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
router.post('/', authenticateAdmin, countryController.createCountry);

/**
 * @swagger
 * /countries/{id}:
 *   put:
 *     summary: Update a country
 *     description: Update an existing country (admin only)
 *     tags: [Countries, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Country ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 128
 *                 description: Country name
 *               isoCode2:
 *                 type: string
 *                 maxLength: 2
 *                 description: ISO 2-letter country code
 *               isoCode3:
 *                 type: string
 *                 maxLength: 3
 *                 description: ISO 3-letter country code
 *               addressFormat:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Address format template
 *               postcodeRequired:
 *                 type: boolean
 *                 description: Whether postcode is required for addresses
 *               status:
 *                 type: boolean
 *                 description: Country status
 *     responses:
 *       200:
 *         description: Country updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Country'
 *                 message:
 *                   type: string
 *                   example: "Country updated successfully"
 *       400:
 *         description: Bad request - Invalid country data
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
 *         description: Conflict - Country with ISO code already exists
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
router.put('/:id', authenticateAdmin, countryController.updateCountry);

/**
 * @swagger
 * /countries/{id}:
 *   delete:
 *     summary: Delete a country
 *     description: Delete an existing country (admin only)
 *     tags: [Countries, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Country ID
 *     responses:
 *       200:
 *         description: Country deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Country deleted successfully"
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
 *         description: Conflict - Country cannot be deleted (in use by zones or addresses)
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
router.delete('/:id', authenticateAdmin, countryController.deleteCountry);

export default router;
