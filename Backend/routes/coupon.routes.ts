// routes/coupon.routes.ts
import express from 'express';

import {
  getAllCoupons,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponUsageStats,
  applyCoupon,
  applyAutoApplyCoupon,
} from '../controllers/coupon.controller';
import {
  authenticateAdmin,
  authenticateCustomer,
  authenticateUser,
} from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Feature, PermissionAction } from '../types/models/role';

const router = express.Router();

// Admin-only routes - all require admin authentication

/**
 * @swagger
 * /coupons:
 *   get:
 *     summary: Get all coupons
 *     description: Retrieve all coupons with pagination (admin only)
 *     tags: [Coupons, Admin]
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
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter by coupon status
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Coupon'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 message:
 *                   type: string
 *                   example: "Coupons retrieved successfully"
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
  '/',
  authenticateAdmin,
  checkPermission(Feature.COUPONS, PermissionAction.READ),
  getAllCoupons
);

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: Create a new coupon
 *     description: Create a new coupon (admin only)
 *     tags: [Coupons, Admin]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CouponCreate'
 *           examples:
 *             percentageCoupon:
 *               summary: Percentage discount coupon
 *               value:
 *                 name: "New Year Sale"
 *                 code: "NEWYEAR2024"
 *                 type: "P"
 *                 discount: 20
 *                 minAmount: 100
 *                 maxDiscount: 500
 *                 totalUses: 500
 *                 customerUses: 2
 *                 dateStart: "2024-01-01T00:00:00Z"
 *                 dateEnd: "2024-01-31T23:59:59Z"
 *                 autoApply: false
 *             fixedCoupon:
 *               summary: Fixed amount discount coupon
 *               value:
 *                 name: "Welcome Discount"
 *                 code: "WELCOME50"
 *                 type: "F"
 *                 discount: 50
 *                 minAmount: 200
 *                 totalUses: 100
 *                 customerUses: 1
 *                 autoApply: false
 *             autoApplyCoupon:
 *               summary: Auto-apply coupon (only one can be active)
 *               value:
 *                 name: "Flash Sale"
 *                 code: "FLASHSALE"
 *                 type: "P"
 *                 discount: 15
 *                 minAmount: 50
 *                 maxDiscount: 300
 *                 totalUses: 0
 *                 customerUses: 0
 *                 status: true
 *                 autoApply: true
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Coupon'
 *                 message:
 *                   type: string
 *                   example: "Coupon created successfully"
 *       400:
 *         description: Bad request - Invalid coupon data
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
 *         description: Conflict - Coupon code already exists
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
router.post(
  '/',
  authenticateAdmin,
  checkPermission(Feature.COUPONS, PermissionAction.CREATE),
  createCoupon
);

/**
 * @swagger
 * /coupons/{id}:
 *   put:
 *     summary: Update a coupon
 *     description: Update an existing coupon (admin only)
 *     tags: [Coupons, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CouponCreate'
 *           examples:
 *             updateUsageLimits:
 *               summary: Update usage limits
 *               value:
 *                 totalUses: 1000
 *                 customerUses: 3
 *             updateDiscount:
 *               summary: Update discount amount
 *               value:
 *                 discount: 25
 *                 maxDiscount: 750
 *             updateAutoApply:
 *               summary: Enable auto-apply for coupon
 *               value:
 *                 autoApply: true
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Coupon'
 *                 message:
 *                   type: string
 *                   example: "Coupon updated successfully"
 *       400:
 *         description: Bad request - Invalid coupon data
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
 *         description: Coupon not found
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
  '/:id',
  authenticateAdmin,
  checkPermission(Feature.COUPONS, PermissionAction.UPDATE),
  updateCoupon
);

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     summary: Delete a coupon
 *     description: Delete an existing coupon (admin only)
 *     tags: [Coupons, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     responses:
 *       200:
 *         description: Coupon deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Coupon deleted successfully"
 *       401:
 *         description: Unauthorized - Admin authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Coupon not found
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
router.delete(
  '/:id',
  authenticateAdmin,
  checkPermission(Feature.COUPONS, PermissionAction.DELETE),
  deleteCoupon
);

/**
 * @swagger
 * /coupons/{id}/usage-stats:
 *   get:
 *     summary: Get coupon usage statistics
 *     description: Get detailed usage statistics for a specific coupon (admin only)
 *     tags: [Coupons, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     responses:
 *       200:
 *         description: Coupon usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coupon:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: Coupon ID
 *                     name:
 *                       type: string
 *                       description: Coupon name
 *                     code:
 *                       type: string
 *                       description: Coupon code
 *                     totalUses:
 *                       type: number
 *                       description: Maximum total uses allowed
 *                     customerUses:
 *                       type: number
 *                       description: Maximum uses per customer
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalUsage:
 *                       type: number
 *                       description: Current total usage count
 *                     remainingUses:
 *                       oneOf:
 *                         - type: number
 *                         - type: string
 *                           enum: [unlimited]
 *                       description: Remaining uses (number or 'unlimited')
 *                     customerUsageStats:
 *                       type: array
 *                       description: Usage statistics by customer
 *                       items:
 *                         type: object
 *                         properties:
 *                           customer:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           usageCount:
 *                             type: number
 *                             description: Number of times customer used this coupon
 *                           totalDiscount:
 *                             type: number
 *                             description: Total discount amount for this customer
 *                           lastUsed:
 *                             type: string
 *                             format: date-time
 *                             description: Last usage date
 *                     usageOverTime:
 *                       type: array
 *                       description: Usage statistics over time (last 30 days)
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Date (YYYY-MM-DD)
 *                           count:
 *                             type: number
 *                             description: Number of uses on this date
 *                           totalDiscount:
 *                             type: number
 *                             description: Total discount amount on this date
 *       400:
 *         description: Bad request - Invalid coupon ID
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
 *         description: Coupon not found
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
  '/:id/usage-stats',
  authenticateAdmin,
  checkPermission(Feature.COUPONS, PermissionAction.READ),
  getCouponUsageStats
);

// Public/Customer routes

/**
 * @swagger
 * /coupons/{code}:
 *   get:
 *     summary: Get coupon by code
 *     description: Retrieve coupon details by coupon code
 *     tags: [Coupons]
 *     security:
 *       - customerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon code
 *     responses:
 *       200:
 *         description: Coupon retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Coupon'
 *                 message:
 *                   type: string
 *                   example: "Coupon retrieved successfully"
 *       400:
 *         description: Bad request - Invalid coupon code
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
 *         description: Coupon not found
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
router.get('/:code', authenticateUser, getCouponByCode);

/**
 * @swagger
 * /coupons/apply-coupon:
 *   post:
 *     summary: Apply coupon to cart
 *     description: Apply a coupon code to the customer's cart
 *     tags: [Coupons]
 *     security:
 *       - customerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Coupon code to apply
 *               orderId:
 *                 type: string
 *                 description: Order ID to apply coupon to
 *             required:
 *               - code
 *               - orderId
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 coupon:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: Coupon ID
 *                     name:
 *                       type: string
 *                       description: Coupon name
 *                     code:
 *                       type: string
 *                       description: Coupon code
 *                     type:
 *                       type: string
 *                       description: Coupon type
 *                     discount:
 *                       type: number
 *                       description: Discount value
 *                 calculation:
 *                   type: object
 *                   properties:
 *                     originalTotal:
 *                       type: number
 *                       description: Original order total
 *                     discountAmount:
 *                       type: number
 *                       description: Discount amount applied
 *                     finalTotal:
 *                       type: number
 *                       description: Final total after discount
 *                 order:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: Order ID
 *                     orderTotal:
 *                       type: number
 *                       description: Updated order total
 *                     totals:
 *                       type: array
 *                       description: Order totals breakdown
 *                     coupon:
 *                       type: string
 *                       description: Applied coupon ID
 *                 message:
 *                   type: string
 *                   description: Success message
 *           example:
 *             success: true
 *             coupon:
 *               _id: "507f1f77bcf86cd799439011"
 *               name: "New Year Sale"
 *               code: "NEWYEAR2024"
 *               type: "P"
 *               discount: 20
 *             calculation:
 *               originalTotal: 100.00
 *               discountAmount: 20.00
 *               finalTotal: 80.00
 *             order:
 *               _id: "507f1f77bcf86cd799439012"
 *               orderTotal: 80.00
 *               totals:
 *                 - code: "subtotal"
 *                   value: 100.00
 *                   sortOrder: 1
 *                 - code: "couponDiscount"
 *                   value: -20.00
 *                   sortOrder: 2
 *                 - code: "total"
 *                   value: 80.00
 *                   sortOrder: 3
 *               coupon: "507f1f77bcf86cd799439011"
 *             message: "Coupon applied successfully"
 *       400:
 *         description: Bad request - Invalid coupon or usage limits exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               minAmountNotMet:
 *                 summary: Minimum amount not met
 *                 value:
 *                   error: "Minimum order amount of 100 required"
 *               usageLimitReached:
 *                 summary: Total usage limit reached
 *                 value:
 *                   error: "Coupon usage limit has been reached"
 *               customerLimitReached:
 *                 summary: Customer usage limit reached
 *                 value:
 *                   error: "You have already used this coupon 2 time(s). Maximum uses per customer: 2"
 *               couponAlreadyApplied:
 *                 summary: Coupon already applied to order
 *                 value:
 *                   error: "A coupon has already been applied to this order"
 *       401:
 *         description: Unauthorized - Customer authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Coupon or cart not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Coupon cannot be applied
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
router.post('/apply-coupon', authenticateCustomer, applyCoupon);

/**
 * @swagger
 * /coupons/auto-apply/{orderId}:
 *   get:
 *     summary: Apply auto-apply coupon to order (Customer)
 *     description: Automatically applies the eligible auto-apply coupon to the specified order
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Auto-apply coupon processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 applied:
 *                   type: boolean
 *                   description: Whether coupon was applied
 *                   example: true
 *                 coupon:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "NEWYEAR2024"
 *                     name:
 *                       type: string
 *                       example: "New Year Sale"
 *                     type:
 *                       type: string
 *                       enum: [F, P]
 *                     discount:
 *                       type: number
 *                       example: 20
 *                     discountAmount:
 *                       type: number
 *                       example: 200
 *                     reason:
 *                       type: string
 *                       description: Reason if not applied
 *                       example: "Order total below minimum amount"
 *                 calculation:
 *                   type: object
 *                   properties:
 *                     originalAmount:
 *                       type: number
 *                       example: 1000
 *                     discountAmount:
 *                       type: number
 *                       example: 200
 *                     finalAmount:
 *                       type: number
 *                       example: 800
 *                 order:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     orderNumber:
 *                       type: string
 *                     orderTotal:
 *                       type: number
 *       400:
 *         description: Invalid order ID or coupon already applied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Customer authentication required
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
router.get('/auto-apply/:orderId', authenticateCustomer, applyAutoApplyCoupon);

export default router;
