// routes/download.routes.ts
import express from 'express';

import { downloadFile } from '../controllers/download.controller';
import { authenticateCustomer } from '../middleware/auth.middleware';

const router = express.Router();

// All download routes require authentication
router.use(authenticateCustomer);

/**
 * @swagger
 * /downloads/{productId}/{optionId}:
 *   get:
 *     summary: Download a product file
 *     description: Download a digital product file for a specific product option
 *     tags: [Downloads]
 *     security:
 *       - customerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: path
 *         name: optionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product option ID
 *     responses:
 *       200:
 *         description: File download successful
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Bad request - Invalid parameters
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
 *       403:
 *         description: Forbidden - Customer doesn't have access to this product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found - Product or option not found
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
router.get('/:productId/:optionId', downloadFile);

export default router;
