import express from 'express';

import {
  startCheckout,
  completeCheckout,
  createPaymentOrder,
  getCheckoutStatus,
  cancelCheckout,
  updatePaymentFailed,
  retryPayment,
} from '../controllers/checkout.controller';
import { authenticateCustomer } from '../middleware/auth.middleware';

const router = express.Router();

// All other checkout routes require authentication
router.use(authenticateCustomer);

/**
 * @swagger
 * /checkout/start:
 *   post:
 *     summary: Start checkout process
 *     description: Initialize the checkout process with cart items
 *     tags: [Checkout]
 *     security:
 *       - customerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               languageId:
 *                 type: string
 *                 description: Language ID for checkout (optional, defaults to English)
 *               paymentFirstName:
 *                 type: string
 *                 description: Payment first name
 *               paymentLastName:
 *                 type: string
 *                 description: Payment last name
 *               paymentCompany:
 *                 type: string
 *                 description: Payment company
 *               paymentAddress1:
 *                 type: string
 *                 description: Payment address line 1
 *               paymentAddress2:
 *                 type: string
 *                 description: Payment address line 2
 *               paymentCity:
 *                 type: string
 *                 description: Payment city
 *               paymentPostcode:
 *                 type: string
 *                 description: Payment postcode
 *               paymentCountry:
 *                 type: string
 *                 description: Payment country ID
 *               paymentZone:
 *                 type: string
 *                 description: Payment zone ID
 *               paymentAddressFormat:
 *                 type: string
 *                 description: Payment address format
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method
 *               paymentCode:
 *                 type: string
 *                 description: Payment code
 *             required:
 *     responses:
 *       200:
 *         description: Checkout started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       description: Created order ID
 *                     customer:
 *                       type: string
 *                       description: Customer ID
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: Product ID
 *                               productModel:
 *                                 type: string
 *                                 description: Product model
 *                               sku:
 *                                 type: string
 *                                 description: Product SKU
 *                               image:
 *                                 type: string
 *                                 description: Product image URL with /image prefix
 *                               description:
 *                                 type: string
 *                                 description: Product description
 *                           options:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 option:
 *                                   type: object
 *                                   properties:
 *                                     _id:
 *                                       type: string
 *                                       description: Option ID
 *                                     name:
 *                                       type: string
 *                                       description: Option name
 *                                 price:
 *                                   type: number
 *                                   description: Option price
 *                           subtotal:
 *                             type: number
 *                             description: Product subtotal
 *                     totals:
 *                       type: object
 *                       properties:
 *                         subtotal:
 *                           type: number
 *                           description: Subtotal amount
 *                         tax:
 *                           type: number
 *                           description: Tax amount
 *                         shipping:
 *                           type: number
 *                           description: Shipping amount
 *                         total:
 *                           type: number
 *                           description: Total amount
 *                     totalAmount:
 *                       type: number
 *                       description: Total checkout amount
 *                     itemCount:
 *                       type: number
 *                       description: Number of items
 *                 message:
 *                   type: string
 *                   example: "Checkout started successfully"
 *       400:
 *         description: Bad request - Invalid cart or missing information
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
 *         description: Cart not found
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
router.post('/start', startCheckout);

/**
 * @swagger
 * /checkout/payment/create:
 *   post:
 *     summary: Create Razorpay payment order for checkout
 *     description: Create a Razorpay payment order using the order total from the existing order
 *     tags: [Checkout - Payment]
 *     security:
 *       - customerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order ID from completed checkout
 *                 example: "507f1f77bcf86cd799439011"
 *             required:
 *               - orderId
 *           example:
 *             orderId: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Payment order created successfully using order total
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       description: Internal order ID
 *                     razorpayOrderId:
 *                       type: string
 *                       description: Razorpay order ID
 *                     amount:
 *                       type: number
 *                       description: Payment amount taken from order total
 *                     currency:
 *                       type: string
 *                       description: Payment currency (defaults to INR)
 *                 message:
 *                   type: string
 *                   example: "Payment order created successfully"
 *           example:
 *             success: true
 *             data:
 *               orderId: "507f1f77bcf86cd799439011"
 *               razorpayOrderId: "order_1234567890"
 *               amount: 29.97
 *               currency: "INR"
 *             message: "Payment order created successfully"
 *       400:
 *         description: Bad request - Invalid order ID or order not in pending status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Order is not in pending status"
 *               message: "Order is not in pending status"
 *       401:
 *         description: Unauthorized - Authentication required
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
router.post('/payment/create', createPaymentOrder);

/**
 * @swagger
 * /checkout/payment/verify:
 *   post:
 *     summary: Verify payment and update order
 *     description: Verify Razorpay payment signature and update order status
 *     tags: [Checkout - Payment]
 *     security:
 *       - customerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Internal order ID
 *                 example: "507f1f77bcf86cd799439011"
 *               razorpayOrderId:
 *                 type: string
 *                 description: Razorpay order ID
 *                 example: "order_1234567890"
 *               razorpayPaymentId:
 *                 type: string
 *                 description: Razorpay payment ID
 *                 example: "pay_1234567890"
 *               razorpaySignature:
 *                 type: string
 *                 description: Razorpay payment signature for verification
 *                 example: "abc123def456..."
 *             required:
 *               - orderId
 *               - razorpayOrderId
 *               - razorpayPaymentId
 *               - razorpaySignature
 *     responses:
 *       200:
 *         description: Payment verified and order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       description: Order ID
 *                     orderStatus:
 *                       type: string
 *                       description: Updated order status
 *                     message:
 *                       type: string
 *                       description: Success message
 *                 message:
 *                   type: string
 *                   example: "Payment verified successfully"
 *       400:
 *         description: Bad request - Invalid signature or payment not captured
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
router.post('/payment/verify', completeCheckout);

/**
 * @swagger
 * /checkout/{id}/status:
 *   get:
 *     summary: Get checkout status
 *     description: Get the status of a specific checkout session
 *     tags: [Checkout]
 *     security:
 *       - customerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Checkout status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: Order ID
 *                     orderStatus:
 *                       type: string
 *                       description: Current order status
 *                     totalAmount:
 *                       type: number
 *                       description: Total order amount
 *                     paymentMethod:
 *                       type: string
 *                       description: Payment method used
 *                     paymentCode:
 *                       type: string
 *                       description: Payment code
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: Product ID
 *                               productModel:
 *                                 type: string
 *                                 description: Product model
 *                               sku:
 *                                 type: string
 *                                 description: Product SKU
 *                               image:
 *                                 type: string
 *                                 description: Product image URL with /image prefix
 *                               description:
 *                                 type: string
 *                                 description: Product description
 *                           options:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 option:
 *                                   type: object
 *                                   properties:
 *                                     _id:
 *                                       type: string
 *                                       description: Option ID
 *                                     name:
 *                                       type: string
 *                                       description: Option name
 *                                 price:
 *                                   type: number
 *                                   description: Option price
 *                           subtotal:
 *                             type: number
 *                             description: Product subtotal
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Order creation date
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Order last update date
 *                 message:
 *                   type: string
 *                   example: "Checkout status retrieved successfully"
 *       400:
 *         description: Bad request - Invalid order ID
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
 *         description: Forbidden - Not authorized to view this checkout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Checkout session not found
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
// Get checkout status
router.get('/:id/status', getCheckoutStatus);

/**
 * @swagger
 * /checkout/{id}/cancel:
 *   delete:
 *     summary: Cancel checkout
 *     description: Cancel a pending checkout session
 *     tags: [Checkout]
 *     security:
 *       - customerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Checkout cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       description: Order ID
 *                     orderStatus:
 *                       type: string
 *                       description: Updated order status
 *                     message:
 *                       type: string
 *                       description: Success message
 *                 message:
 *                   type: string
 *                   example: "Checkout cancelled successfully"
 *       400:
 *         description: Bad request - Invalid order ID or order not in pending status
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
 *         description: Forbidden - Not authorized to cancel this checkout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Checkout session not found
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
// Cancel checkout
router.delete('/:id/cancel', cancelCheckout);

/**
 * @swagger
 * /checkout/payment-failed:
 *   put:
 *     summary: Update order payment failed status
 *     description: Mark an order as payment failed and reverse any applied coupons
 *     tags: [Checkout]
 *     security:
 *       - customerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order ID to mark as payment failed
 *                 example: "507f1f77bcf86cd799439011"
 *               reason:
 *                 type: string
 *                 description: Reason for payment failure
 *                 example: "Insufficient funds"
 *                 maxLength: 1000
 *             required:
 *               - orderId
 *     responses:
 *       200:
 *         description: Payment failed status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       description: Order ID
 *                     orderStatus:
 *                       type: string
 *                       description: Updated order status (failed)
 *                       example: "failed"
 *                     message:
 *                       type: string
 *                       description: Success message
 *                 message:
 *                   type: string
 *                   example: "Payment failed status updated successfully"
 *       400:
 *         description: Bad request - Invalid order ID or order not in pending status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Only pending orders can be marked as payment failed"
 *               message: "Only pending orders can be marked as payment failed"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not authorized to update this order
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
// Update payment failed
router.put('/payment-failed', updatePaymentFailed);

/**
 * @swagger
 * /checkout/retry-payment:
 *   post:
 *     summary: Retry payment for failed order
 *     description: Retry payment for a failed order within 24 hours
 *     tags: [Checkout]
 *     security:
 *       - customerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order ID to retry payment for
 *                 example: "507f1f77bcf86cd799439011"
 *             required:
 *               - orderId
 *     responses:
 *       200:
 *         description: Payment retry initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       description: Order ID
 *                     orderNumber:
 *                       type: string
 *                       description: Order number
 *                       example: "ORD20241201000001"
 *                     razorpayOrderId:
 *                       type: string
 *                       description: New Razorpay order ID
 *                     amount:
 *                       type: number
 *                       description: Payment amount
 *                     currency:
 *                       type: string
 *                       description: Payment currency
 *                       example: "INR"
 *                     message:
 *                       type: string
 *                       description: Success message
 *                 message:
 *                   type: string
 *                   example: "Payment retry initiated successfully"
 *       400:
 *         description: Bad request - Invalid order ID, order not failed, or order too old
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Only failed orders can be retried"
 *               message: "Only failed orders can be retried"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not authorized to retry this order
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
 *       429:
 *         description: Too many requests - Please wait before retrying
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
// Retry payment
router.post('/retry-payment', retryPayment);

export default router;
