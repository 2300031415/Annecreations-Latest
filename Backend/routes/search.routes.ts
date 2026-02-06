import express from 'express';

import searchController from '../controllers/search.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Public search routes

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     description: Retrieve paginated search suggestions based on query parameter
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of suggestions per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by product status (active/inactive)
 *     responses:
 *       200:
 *         description: Search suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Product ID
 *                       productModel:
 *                         type: string
 *                         description: Product model name
 *                       sku:
 *                         type: string
 *                         description: Product SKU
 *                       description:
 *                         type: string
 *                         description: Product description
 *                       image:
 *                         type: string
 *                         description: Product image URL
 *                       status:
 *                         type: boolean
 *                         description: Product status
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       description: Current page number
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *                     totalProducts:
 *                       type: integer
 *                       description: Total number of products matching search
 *                     limit:
 *                       type: integer
 *                       description: Number of products per page
 *                     hasNextPage:
 *                       type: boolean
 *                       description: Whether there is a next page
 *                     hasPrevPage:
 *                       type: boolean
 *                       description: Whether there is a previous page
 *                     nextPage:
 *                       type: integer
 *                       nullable: true
 *                       description: Next page number (null if no next page)
 *                     prevPage:
 *                       type: integer
 *                       nullable: true
 *                       description: Previous page number (null if no previous page)
 *       400:
 *         description: Bad request
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
router.get('/suggestions', searchController.getSearchSuggestions);

/**
 * @swagger
 * /search/visual:
 *   post:
 *     summary: Search products by image
 *     description: Upload an image to find similar embroidery designs
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Similar products retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.post('/visual', searchController.getVisualSearch);

/**
 * @swagger
 * /search/popular:
 *   get:
 *     summary: Get popular searches
 *     description: Retrieve most popular search terms
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of popular searches to return
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: week
 *         description: Time period for popular searches
 *     responses:
 *       200:
 *         description: Popular searches retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 popularSearches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       query:
 *                         type: string
 *                         description: Search term
 *                       count:
 *                         type: integer
 *                         description: Number of times searched
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/popular', searchController.getPopularSearches);

// Admin analytics

/**
 * @swagger
 * /search/analytics:
 *   get:
 *     summary: Get search analytics
 *     description: Retrieve search analytics data (admin only)
 *     tags: [Search, Admin]
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
 *         description: Maximum number of results to return
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
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalSearches:
 *                       type: integer
 *                       description: Total number of searches in period
 *                     averageResults:
 *                       type: integer
 *                       description: Average number of results per search
 *                     averageTime:
 *                       type: integer
 *                       description: Average search time in milliseconds
 *                 searchesByDay:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         description: Date in YYYY-MM-DD format
 *                       count:
 *                         type: integer
 *                         description: Number of searches on this date
 *                       avgResults:
 *                         type: integer
 *                         description: Average results per search on this date
 *                 zeroResultSearches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       query:
 *                         type: string
 *                         description: Search term that returned zero results
 *                       count:
 *                         type: integer
 *                         description: Number of times this query returned zero results
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
router.get('/analytics', authenticateAdmin, searchController.getSearchAnalytics);

export default router;
