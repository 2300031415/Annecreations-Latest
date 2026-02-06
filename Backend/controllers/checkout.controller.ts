import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Cart from '../models/cart.model';
import { Counter } from '../models/counter.model';
import CouponUsage from '../models/couponUsage.model';
import Customer from '../models/customer.model';
import Order from '../models/order.model';
import { IProductItem } from '../types/models/index';
import { BaseController } from '../utils/baseController';
import {
  sendResponse,
  sendErrorResponse,
  validateObjectId,
  sanitizeData,
  logControllerAction,
  ensureLanguageId,
  getFrontendUrl,
} from '../utils/controllerUtils';
import { sendOrderConfirmationEmail, sendPaymentFailureEmail } from '../utils/emailService';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  getPaymentDetails,
  verifyWebhookSignature,
} from '../utils/razorpayUtils';
import { getClientSource } from '../utils/sessionUtils';

import { CouponController } from './coupon.controller';

class CheckoutController extends BaseController {
  constructor() {
    super('Checkout');
  }

  startCheckout = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'startCheckout', 'customer', async () => {
      const customerId = req.customer?.id;
      const {
        paymentFirstName,
        paymentLastName,
        paymentCompany,
        paymentAddress1,
        paymentAddress2,
        paymentCity,
        paymentPostcode,
        paymentCountry,
        paymentZone,
        paymentAddressFormat,
        ...rest
      } = sanitizeData(req.body);

      let { paymentMethod, paymentCode } = rest;

      // if (
      //   !paymentFirstName ||
      //   !paymentLastName ||
      //   !paymentAddress1 ||
      //   !paymentCity ||
      //   !paymentPostcode ||
      //   !paymentCountry
      // ) {
      //   sendErrorResponse(res, 400, 'All required fields are required');
      //   return;
      // }

      // Validate payment method and code for RazorPay (only if provided)
      if (paymentMethod && paymentCode) {
        if (paymentMethod !== 'Pay by RazorPay' || paymentCode !== 'razorpay') {
          // Log invalid payment method attempt
          logControllerAction(req, 'startCheckout_invalid_payment', {
            paymentMethod: paymentMethod,
            paymentCode: paymentCode,
          });

          sendErrorResponse(res, 400, 'Only RazorPay payment method is supported');
          return;
        }
      } else {
        // Set default values if not provided
        paymentMethod = paymentMethod || 'Pay by RazorPay';
        paymentCode = paymentCode || 'razorpay';
      }

      // Get default language ID
      const languageId = await ensureLanguageId();

      // Get customer cart
      const cart = await Cart.findOne({ customerId: new mongoose.Types.ObjectId(customerId) })
        .populate('items.product', 'productModel sku image description')
        .populate('items.options.option', 'name')
        .lean();

      if (!cart || !cart.items || cart.items.length === 0) {
        sendErrorResponse(res, 400, 'Cart is empty');
        return;
      }

      // Validate cart items
      for (const item of cart.items) {
        if (!item.product) {
          sendErrorResponse(res, 400, 'Invalid product in cart');
          return;
        }
      }

      // Create order from cart for digital products
      const orderTotal = cart.items.reduce((sum: number, item: any) => sum + item.subtotal, 0);

      const orderTotals = [
        {
          code: 'subtotal',
          value: orderTotal,
          sortOrder: 1,
        },
        {
          code: 'total',
          value: orderTotal,
          sortOrder: 2,
        },
      ];

      const counter = await Counter.findByIdAndUpdate(
        'orderNumber',
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      const nextOrderNumber = counter.sequence_value.toString();

      const order = new Order({
        customer: new mongoose.Types.ObjectId(customerId),
        languageId: new mongoose.Types.ObjectId(languageId),
        orderNumber: nextOrderNumber,
        products: cart.items.map((item: any) => ({
          product: item.product._id,
          options: item.options,
        })),
        orderTotal,
        totals: orderTotals,
        orderStatus: 'pending',
        paymentFirstName: paymentFirstName || '',
        paymentLastName: paymentLastName || '',
        paymentCompany: paymentCompany || '',
        paymentAddress2: paymentAddress2 || '',
        paymentZone: paymentZone || '',
        paymentAddressFormat: paymentAddressFormat || '',
        paymentAddress1: paymentAddress1 || '',
        paymentCity: paymentCity || '',
        paymentPostcode: paymentPostcode || '',
        paymentCountry: paymentCountry || '',
        paymentMethod: paymentMethod,
        paymentCode: paymentCode,
        history: [
          {
            orderStatus: 'pending',
            comment: 'Checkout initiated from cart',
            notify: false,
            createdAt: new Date(),
          },
        ],
        ipAddress: req.ip,
        forwardedIp: req.get('X-Forwarded-For'),
        userAgent: req.get('User-Agent'),
        acceptLanguageId: req.get('Accept-Language'),
      });

      try {
        await order.save();
        console.log('Order saved successfully with order number:', order.orderNumber);
      } catch (error: any) {
        // Handle duplicate key error for orderNumber
        if (error.code === 11000 && error.keyPattern?.orderNumber) {
          console.error('Duplicate order number detected, retrying...', error.keyValue);
          // Generate a new order number and retry
          const newCounter = await Counter.findByIdAndUpdate(
            'orderNumber',
            { $inc: { sequence_value: 1 } },
            { new: true, upsert: true }
          );
          order.orderNumber = newCounter.sequence_value.toString();
          console.log('Retrying with new order number:', order.orderNumber);
          await order.save();
          console.log('Order saved successfully with retry order number:', order.orderNumber);
        } else {
          throw error; // Re-throw other errors
        }
      }

      // Format checkout data
      const checkoutData = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customer: cart.customerId,
        products: cart.items?.map((item: any) => ({
          product: {
            ...item.product,
            image: item.product?.image ? `image/${item.product.image}` : item.product?.image,
          },
          options: item.options?.map((option: any) => ({
            option: option.option,
            price: option.price,
          })),
          subtotal: item.subtotal,
        })),
        totals: orderTotals,
        totalAmount: orderTotal,
        itemCount: cart.items?.length || 0,
      };

      sendResponse(res, 200, checkoutData);
    });
  };

  createPaymentOrder = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'createPaymentOrder', 'customer', async () => {
      const { orderId } = req.body;

      if (!orderId) {
        sendErrorResponse(res, 400, 'Order ID is required');
        return;
      }
      const customer = await Customer.findById(req.customer?.id);

      // Validate order exists and belongs to customer
      const order = await Order.findOne({
        _id: orderId,
        customer: new mongoose.Types.ObjectId(req.customer?.id),
      });

      if (!order) {
        sendErrorResponse(res, 404, 'Order not found');
        return;
      }

      if (order.orderStatus !== 'pending') {
        sendErrorResponse(res, 400, 'Order is not in pending status');
        return;
      }

      // Check if customer has already purchased the same products with same options
      // This prevents duplicate purchases of digital products

      // Get product IDs from current order for efficient filtering
      const currentProductIds = order.products.map(
        (item: any) => new mongoose.Types.ObjectId(item.product.toString())
      );

      // Use aggregation to get all purchased options for each product in a single query
      // This aggregates options across all paid orders for the customer
      const purchasedOptionsAgg = await Order.aggregate([
        {
          $match: {
            customer: new mongoose.Types.ObjectId(req.customer?.id),
            orderStatus: 'paid',
          },
        },
        {
          $unwind: '$products',
        },
        {
          $match: {
            'products.product': { $in: currentProductIds },
          },
        },
        {
          $unwind: '$products.options',
        },
        {
          $group: {
            _id: '$products.product',
            purchasedOptions: { $addToSet: '$products.options.option' },
          },
        },
      ]);

      // Convert aggregation result to a Map for easy lookup
      const purchasedOptionsMap = new Map<string, Set<string>>();
      for (const item of purchasedOptionsAgg) {
        const productId = item._id.toString();
        const optionsSet = new Set<string>(item.purchasedOptions.map((opt: any) => opt.toString()));
        purchasedOptionsMap.set(productId, optionsSet);
      }

      // Check if current order contains any options that customer already owns
      for (const currentProduct of order.products) {
        const currentProductId = currentProduct.product.toString();

        // Get all options customer has already purchased for this product (across all orders)
        const purchasedOptions = purchasedOptionsMap.get(currentProductId);

        if (purchasedOptions && purchasedOptions.size > 0) {
          // Get option IDs from current order
          const currentOptionIds = currentProduct.options.map((opt: any) => opt.option.toString());

          // Check if any option from current order already exists in purchased options
          const duplicateOptions = currentOptionIds.filter((optionId: string) =>
            purchasedOptions.has(optionId)
          );

          if (duplicateOptions.length > 0) {
            logControllerAction(req, 'createPaymentOrder_duplicate', {
              warning: 'Customer attempted to purchase already bought options',
              customerId: req.customer?.id,
              currentOrderId: orderId,
              productId: currentProductId,
              duplicateOptions: duplicateOptions,
              allPurchasedOptions: Array.from(purchasedOptions),
            });

            sendErrorResponse(
              res,
              409,
              'You have already purchased some of these product options. Please check your orders or downloads.'
            );
            return;
          }
        }
      }

      // Get client source from header (default to 'mobile' if not present)
      const clientSource = getClientSource(req);

      // If the order total is zero, complete checkout without creating a payment order
      if (order.orderTotal <= 0) {
        const isCouponOrder = Boolean(order.coupon);
        order.orderStatus = 'paid';
        order.paymentMethod = isCouponOrder ? 'coupon' : 'free';
        order.paymentCode = 'free';
        order.history.push({
          orderStatus: 'paid',
          comment: isCouponOrder
            ? 'Order completed without payment (coupon covered total)'
            : 'Order completed without payment (free items)',
          notify: false,
          createdAt: new Date(),
        });
        await order.save();

        // Record coupon usage if coupon was applied
        if (order.coupon) {
          const couponDiscount = order.totals?.find(t => t.code === 'couponDiscount')?.value || 0;

          await CouponUsage.create({
            coupon: order.coupon,
            customer: new mongoose.Types.ObjectId(req.customer?.id),
            order: order._id,
            discountAmount: couponDiscount,
            orderTotal: order.orderTotal,
            usedAt: new Date(),
          });

          order.history.push({
            orderStatus: 'paid',
            comment: `Coupon usage confirmed. Discount amount: ${Math.abs(couponDiscount).toFixed(2)} applied to final payment.`,
            notify: false,
            createdAt: new Date(),
          });
        }

        // Clear customer cart after completing the free order
        await Cart.findOneAndUpdate(
          { customerId: new mongoose.Types.ObjectId(req.customer?.id) },
          { $set: { items: [] } }
        );

        const freeOrderResponse = {
          orderId: orderId,
          orderNumber: order.orderNumber,
          orderStatus: 'paid',
          paymentRequired: false,
          message: isCouponOrder
            ? 'Order completed successfully. Coupon covered the full amount.'
            : 'Order completed successfully. No payment required for free items.',
        };

        sendResponse(res, 200, freeOrderResponse);

        // Send order confirmation email in background (non-blocking)
        setImmediate(async () => {
          try {
            const checkoutWithProducts = await Order.findById(orderId)
              .populate('products.product', 'productModel')
              .populate('products.options.option', 'name')
              .lean();

            if (checkoutWithProducts) {
              const itemsForEmail = checkoutWithProducts.products.flatMap((p: any) => {
                return (p.options || []).map((opt: any) => {
                  const optionName = opt.option?.name || 'Option';
                  const productName = p.product?.productModel || 'Product';
                  const itemName = `${productName} - ${optionName}`;
                  const price = opt.price || 0;

                  return {
                    name: itemName,
                    quantity: 1,
                    price: price,
                    subtotal: price,
                  };
                });
              });

              await sendOrderConfirmationEmail(
                {
                  orderId: order.orderNumber || order._id.toString(),
                  dateAdded: order.updatedAt.toISOString(),
                  total: order.orderTotal,
                  paymentMethod: order.paymentMethod || '',
                  items: itemsForEmail,
                  quantity: itemsForEmail.length,
                },
                {
                  email: req.customer?.email || '',
                  firstName: req.customer?.firstName || '',
                  lastName: req.customer?.lastName || '',
                },
                {
                  ordersUrl: `${getFrontendUrl()}/Profile?tab=orders`,
                  downloadsUrl: `${getFrontendUrl()}/Profile?tab=downloads`,
                }
              );
            }
          } catch (emailErr) {
            logControllerAction(req, 'completeCheckout', {
              warning: 'Failed to send order confirmation email for free order',
              error: emailErr instanceof Error ? emailErr.message : 'Unknown error',
            });
          }
        });

        return;
      }

      // Create Razorpay order using current orderTotal
      const razorpayOrder = await createRazorpayOrder(
        order.orderTotal,
        'INR',
        orderId // Use orderId directly as the reference
      );

      // Save razorpayOrderId and source to the order
      order.razorpayOrderId = razorpayOrder.id;
      order.source = clientSource;
      await order.save();

      const response = {
        orderId: orderId,
        orderNumber: order.orderNumber,
        razorpayOrderId: razorpayOrder.id,
        amount: Number(razorpayOrder.amount) / 100,
        currency: razorpayOrder.currency,
        customerName: `${customer?.firstName} ${customer?.lastName}`,
        customerEmail: customer?.email,
        customerContact: customer?.mobile,
        paymentRequired: true,
      };

      sendResponse(res, 200, response);
    });
  };

  completeCheckout = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'completeCheckout', 'customer', async () => {
      const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      if (!orderId) {
        sendErrorResponse(res, 400, 'Missing order ID');
        return;
      }
      if (!razorpayOrderId) {
        sendErrorResponse(res, 400, 'Missing razorpayOrder ID');
        return;
      }
      if (!razorpayPaymentId) {
        sendErrorResponse(res, 400, 'Missing Payment ID');
        return;
      }
      if (!razorpaySignature) {
        sendErrorResponse(res, 400, 'Missing Payment Signature');
        return;
      }

      // If Razorpay payment parameters are provided, verify payment first
      try {
        // Verify payment signature using orderId as razorpayOrderId
        const isSignatureValid = verifyPaymentSignature(
          razorpayOrderId, // Use orderId as razorpayOrderId
          razorpayPaymentId,
          razorpaySignature
        );

        if (!isSignatureValid) {
          sendErrorResponse(res, 400, 'Invalid payment signature');
          return;
        }

        // Get payment details from Razorpay
        const paymentDetails = await getPaymentDetails(razorpayPaymentId);

        if (paymentDetails.status !== 'captured') {
          sendErrorResponse(res, 400, 'Payment not captured');
          return;
        }

        // Update order with payment details
        const checkout = await Order.findById(orderId)
          .populate('products.product', 'productModel')
          .populate('products.options.option', 'name');
        if (!checkout) {
          sendErrorResponse(res, 404, 'Order not found');
          return;
        }

        // Verify customer owns this order
        if (checkout.customer?.toString() !== req.customer?.id) {
          sendErrorResponse(res, 403, 'Not authorized to modify this order');
          return;
        }

        if (checkout.orderTotal !== Number(paymentDetails.amount) / 100) {
          sendErrorResponse(res, 400, 'Payment amount does not match order total');
          return;
        }

        // Update order with payment information
        checkout.orderStatus = 'paid';
        checkout.paymentCode = 'razorpay';

        // Save razorpayOrderId if not already saved
        if (!checkout.razorpayOrderId) {
          checkout.razorpayOrderId = razorpayOrderId;
        }

        checkout.history.push({
          orderStatus: 'paid',
          comment: `Payment completed via Razorpay. Payment ID: ${razorpayPaymentId}`,
          notify: true,
          createdAt: new Date(),
        });

        await checkout.save();

        // Record coupon usage if coupon was applied (only when payment is confirmed)
        if (checkout.coupon) {
          const couponDiscount =
            checkout.totals?.find(t => t.code === 'couponDiscount')?.value || 0;

          await CouponUsage.create({
            coupon: checkout.coupon,
            customer: new mongoose.Types.ObjectId(req.customer?.id),
            order: checkout._id,
            discountAmount: couponDiscount,
            orderTotal: checkout.orderTotal,
            usedAt: new Date(),
          });

          // Add history entry for coupon usage confirmation
          checkout.history.push({
            orderStatus: 'paid',
            comment: `Coupon usage confirmed. Discount amount: ${Math.abs(couponDiscount).toFixed(2)} applied to final payment.`,
            notify: false,
            createdAt: new Date(),
          });
        }

        // Clear customer cart after successful payment
        await Cart.findOneAndUpdate(
          { customerId: new mongoose.Types.ObjectId(req.customer?.id) },
          { $set: { items: [] } }
        );

        // Send response immediately for better performance
        const response = {
          orderId: checkout._id.toString(),
          orderNumber: checkout.orderNumber,
          orderStatus: checkout.orderStatus,
          message: 'Order completed and payment verified successfully',
        };

        logControllerAction(req, 'completeCheckout', {
          success: true,
          orderId: checkout._id.toString(),
          orderNumber: checkout.orderNumber,
        });

        sendResponse(res, 200, response);

        // Send order confirmation email in background (non-blocking)
        setImmediate(async () => {
          try {
            // Fetch product details for email only when needed
            const checkoutWithProducts = await Order.findById(orderId)
              .populate('products.product', 'productModel')
              .populate('products.options.option', 'name')
              .lean();

            if (checkoutWithProducts) {
              const itemsForEmail = checkoutWithProducts.products.flatMap((p: any) => {
                // For each product, create individual items for each option
                return (p.options || []).map((opt: any) => {
                  const optionName = opt.option?.name || 'Option';
                  const productName = p.product?.productModel || 'Product';
                  const itemName = `${productName} - ${optionName}`;
                  const price = opt.price || 0;

                  return {
                    name: itemName,
                    quantity: 1, // Each option is typically quantity 1 for digital products
                    price: price,
                    subtotal: price,
                  };
                });
              });

              await sendOrderConfirmationEmail(
                {
                  orderId: checkout.orderNumber || checkout._id.toString(),
                  dateAdded: checkout.updatedAt.toISOString(),
                  total: checkout.orderTotal,
                  paymentMethod: checkout.paymentMethod || '',
                  items: itemsForEmail,
                  quantity: itemsForEmail.length, // Total number of items
                },
                {
                  email: req.customer?.email || '',
                  firstName: req.customer?.firstName || '',
                  lastName: req.customer?.lastName || '',
                },
                {
                  ordersUrl: `${getFrontendUrl()}/Profile?tab=orders`,
                  downloadsUrl: `${getFrontendUrl()}/Profile?tab=downloads`,
                }
              );
            }
          } catch (emailErr) {
            logControllerAction(req, 'completeCheckout', {
              warning: 'Failed to send order confirmation email',
              error: emailErr instanceof Error ? emailErr.message : 'Unknown error',
            });
            // Email failure doesn't affect the order completion
          }
        });

        return;
      } catch (paymentError) {
        logControllerAction(req, 'completeCheckout', {
          error: true,
          errorMessage: `Payment verification failed: ${paymentError instanceof Error ? paymentError.message : 'Unknown error'}`,
        });
        sendErrorResponse(res, 400, 'Payment verification failed');
        return;
      }
    });
  };

  getCheckoutStatus = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getCheckoutStatus', 'customer', async () => {
      const orderId = req.params.id;

      if (!validateObjectId(orderId)) {
        sendErrorResponse(res, 400, 'Valid order ID is required');
        return;
      }

      const checkout = await Order.findById(orderId)
        .populate('products.product', 'productModel sku image description')
        .populate('products.options.option', 'name')
        .populate('coupon', 'code name type discount')
        .lean();

      if (!checkout) {
        sendErrorResponse(res, 404, 'Checkout session not found');
        return;
      }

      // Verify customer owns this checkout
      if (checkout.customer?.toString() !== req.customer?.id) {
        sendErrorResponse(res, 403, 'Not authorized to view this checkout');
        return;
      }

      // Find discount amount from totals
      const couponDiscount = checkout.totals?.find(
        (total: { code: string; value?: number }) => total.code === 'couponDiscount'
      );
      const discountAmount = couponDiscount?.value || 0;

      // Calculate subtotal from products if needed
      const subtotal =
        checkout.products?.reduce((sum, product: IProductItem) => {
          let productSubtotal = 0;
          if (product.options && Array.isArray(product.options)) {
            product.options.forEach((option: any) => {
              if (option.price && typeof option.price === 'number' && !isNaN(option.price)) {
                productSubtotal += option.price;
              }
            });
          }
          return sum + productSubtotal;
        }, 0) || checkout.orderTotal;

      const response: any = {
        _id: checkout._id.toString(),
        orderNumber: checkout.orderNumber,
        orderStatus: checkout.orderStatus,
        totalAmount: checkout.orderTotal,
        paymentMethod: checkout.paymentMethod,
        paymentCode: checkout.paymentCode,
        subtotal,
        discount: discountAmount,
        orderTotal: checkout.orderTotal,
        products: checkout.products?.map((product: IProductItem) => ({
          product: {
            ...(product.product as any),
            image: (product.product as any)?.image
              ? `image/${(product.product as any).image}`
              : (product.product as any)?.image,
          },
          options: product.options?.map((option: any) => ({
            option: option.option,
            price: option.price,
          })),
          subtotal: product.subtotal,
        })),
        order: {
          orderId: checkout._id,
          orderNumber: checkout.orderNumber,
          orderTotal: checkout.orderTotal,
        },
        createdAt: checkout.createdAt,
        updatedAt: checkout.updatedAt,
      };

      // Add coupon and calculation if coupon exists
      if (checkout.coupon) {
        response.applied = true;
        response.message = `Coupon "${(checkout.coupon as any).code}" applied! You saved ₹${discountAmount.toFixed(2)}`;
        response.coupon = {
          code: (checkout.coupon as any).code,
          name: (checkout.coupon as any).name,
          type: (checkout.coupon as any).type,
          discount: (checkout.coupon as any).discount,
          discountAmount,
        };
        response.calculation = {
          originalAmount: subtotal,
          discountAmount,
          finalAmount: checkout.orderTotal,
        };
      }

      sendResponse(res, 200, response);
    });
  };

  cancelCheckout = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'cancelCheckout', 'customer', async () => {
      const orderId = req.params.id;

      if (!validateObjectId(orderId)) {
        sendErrorResponse(res, 400, 'Valid order ID is required');
        return;
      }

      const checkout = await Order.findById(orderId);
      if (!checkout) {
        sendErrorResponse(res, 404, 'Checkout session not found');
        return;
      }

      // Verify customer owns this checkout
      if (checkout.customer?.toString() !== req.customer?.id) {
        sendErrorResponse(res, 403, 'Not authorized to cancel this checkout');
        return;
      }

      // Only allow cancellation of pending orders
      if (checkout.orderStatus !== 'pending') {
        sendErrorResponse(res, 400, 'Only pending orders can be cancelled');
        return;
      }

      checkout.orderStatus = 'cancelled';
      checkout.history.push({
        orderStatus: 'cancelled',
        comment: 'Checkout cancelled by customer',
        notify: false,
        createdAt: new Date(),
      });

      await checkout.save();

      // Reverse coupon usage if any coupon was applied
      if (checkout.coupon) {
        await CouponController.reverseCouponUsage(checkout._id);

        // Add history entry for coupon reversal
        checkout.history.push({
          orderStatus: 'cancelled',
          comment: 'Coupon usage reversed due to order cancellation',
          notify: false,
          createdAt: new Date(),
        });
      }

      const response = {
        orderId: checkout._id.toString(),
        orderNumber: checkout.orderNumber,
        orderStatus: checkout.orderStatus,
        message: 'Checkout cancelled successfully',
      };

      sendResponse(res, 200, response);
    });
  };

  updatePaymentFailed = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'updatePaymentFailed', 'customer', async () => {
      const { orderId, reason } = sanitizeData(req.body);

      if (!orderId) {
        sendErrorResponse(res, 400, 'Order ID is required');
        return;
      }

      if (!validateObjectId(orderId)) {
        sendErrorResponse(res, 400, 'Valid order ID is required');
        return;
      }

      const checkout = await Order.findById(orderId);
      if (!checkout) {
        sendErrorResponse(res, 404, 'Order not found');
        return;
      }

      // Verify customer owns this order
      if (checkout.customer?.toString() !== req.customer?.id) {
        sendErrorResponse(res, 403, 'Not authorized to update this order');
        return;
      }

      // Only allow updating payment failed for pending orders
      if (checkout.orderStatus !== 'pending') {
        sendErrorResponse(res, 400, 'Only pending orders can be marked as payment failed');
        return;
      }

      // Update order status to failed
      checkout.orderStatus = 'failed';
      checkout.history.push({
        orderStatus: 'failed',
        comment: reason || 'Payment failed',
        notify: false,
        createdAt: new Date(),
      });

      await checkout.save();

      // Reverse coupon usage if any coupon was applied
      if (checkout.coupon) {
        await CouponController.reverseCouponUsage(checkout._id);

        // Add history entry for coupon reversal
        checkout.history.push({
          orderStatus: 'failed',
          comment: 'Coupon usage reversed due to payment failure',
          notify: false,
          createdAt: new Date(),
        });
      }

      // Send payment failure email notification
      try {
        // Get customer details for email
        const customer = await mongoose.model('Customer').findById(req.customer?.id).lean();
        if (customer && !Array.isArray(customer)) {
          // Prepare order data for email
          const orderForEmail = {
            orderId: checkout.orderNumber || checkout._id.toString(),
            dateAdded: checkout.createdAt.toISOString(),
            total: checkout.orderTotal,
            paymentMethod: checkout.paymentMethod || 'Unknown',
            items:
              checkout.products?.flatMap((product: any) =>
                (product.options || []).map((opt: any) => ({
                  name: product.product ? product.product.toString() : 'Product',
                  quantity: 1,
                  price: opt.price || 0,
                  subtotal: opt.price || 0,
                }))
              ) || [],
            quantity: checkout.products?.reduce(
              (sum: number, product: any) => sum + (product.options?.length || 0),
              0
            ),
          };

          const customerForEmail = {
            email: customer?.email || '',
            firstName: customer?.firstName || '',
            lastName: customer?.lastName || '',
          };

          await sendPaymentFailureEmail(
            orderForEmail,
            customerForEmail,
            reason || 'Payment processing failed'
          );

          logControllerAction(req, 'updatePaymentFailed', {
            info: 'Payment failure email sent successfully',
            orderId: checkout._id.toString(),
            orderNumber: checkout.orderNumber,
            customerEmail: customer?.email,
          });
        }
      } catch (emailErr) {
        logControllerAction(req, 'updatePaymentFailed', {
          warning: 'Failed to send payment failure email',
          error: emailErr instanceof Error ? emailErr.message : 'Unknown error',
          orderId: checkout._id.toString(),
          orderNumber: checkout.orderNumber,
        });
        // Continue with response even if email fails
      }

      const response = {
        orderId: checkout._id.toString(),
        orderNumber: checkout.orderNumber,
        orderStatus: checkout.orderStatus,
        message: 'Payment failed status updated successfully',
      };

      sendResponse(res, 200, response);
    });
  };

  retryPayment = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'retryPayment', 'customer', async () => {
      const { orderId } = sanitizeData(req.body);

      if (!orderId) {
        sendErrorResponse(res, 400, 'Order ID is required');
        return;
      }

      if (!validateObjectId(orderId)) {
        sendErrorResponse(res, 400, 'Valid order ID is required');
        return;
      }

      // Find the order
      const order = await Order.findById(orderId);
      if (!order) {
        sendErrorResponse(res, 404, 'Order not found');
        return;
      }

      // Verify customer owns this order
      if (order.customer?.toString() !== req.customer?.id) {
        sendErrorResponse(res, 403, 'Not authorized to retry payment for this order');
        return;
      }

      // Only allow retry for failed orders
      if (order.orderStatus !== 'failed') {
        sendErrorResponse(res, 400, 'Only failed orders can be retried');
        return;
      }

      // Check if order is not too old (e.g., within 24 hours)
      const orderAge = Date.now() - order.createdAt.getTime();
      const maxRetryAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      if (orderAge > maxRetryAge) {
        sendErrorResponse(
          res,
          400,
          'Order is too old to retry payment. Please create a new order.'
        );
        return;
      }

      // Check for recent retry attempts (prevent spam)
      const recentRetry = order.history.find(
        h =>
          h.comment?.includes('Payment retry attempted') &&
          h.createdAt &&
          Date.now() - h.createdAt.getTime() < 5 * 60 * 1000 // 5 minutes
      );

      if (recentRetry) {
        sendErrorResponse(res, 429, 'Please wait before retrying payment again');
        return;
      }

      // Reset order status to pending for retry
      order.orderStatus = 'pending';
      order.history.push({
        orderStatus: 'pending',
        comment: 'Payment retry attempted by customer',
        notify: false,
        createdAt: new Date(),
      });

      await order.save();

      // Create new Razorpay order for retry
      try {
        const razorpayOrder = await createRazorpayOrder(order.orderTotal, 'INR', orderId);

        // Update order with new Razorpay order ID
        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        logControllerAction(req, 'retryPayment', {
          success: true,
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          razorpayOrderId: razorpayOrder.id,
          customerId: req.customer?.id,
        });

        const response = {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          razorpayOrderId: razorpayOrder.id,
          amount: Number(razorpayOrder.amount) / 100,
          currency: razorpayOrder.currency,
          message: 'Payment retry initiated successfully',
        };

        sendResponse(res, 200, response);
      } catch (error) {
        // Revert order status if Razorpay order creation fails
        order.orderStatus = 'failed';
        order.history.push({
          orderStatus: 'failed',
          comment: 'Payment retry failed - Razorpay order creation error',
          notify: false,
          createdAt: new Date(),
        });
        await order.save();

        logControllerAction(req, 'retryPayment', {
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
        });

        sendErrorResponse(res, 500, 'Failed to create payment order for retry');
      }
    });
  };

  handleWebhook = async (req: Request, res: Response) => {
    console.log('>>> handleWebhook FUNCTION CALLED <<<');
    const startTime = Date.now();
    let webhookId: string | undefined;

    try {
      console.log('Inside handleWebhook try block');
      console.log('req.body exists:', !!req.body);
      console.log('req.body type:', typeof req.body);

      // Check if body exists and is a Buffer
      if (!req.body) {
        logControllerAction(req, 'handleWebhook', {
          error: 'No request body received',
          severity: 'warning',
          bodyType: typeof req.body,
          headers: req.headers,
        });
        sendErrorResponse(res, 400, 'No request body');
        return;
      }

      // Get raw body for signature verification
      // Handle both Buffer and string bodies
      let webhookBody: string;
      if (Buffer.isBuffer(req.body)) {
        webhookBody = req.body.toString('utf8');
      } else if (typeof req.body === 'string') {
        webhookBody = req.body;
      } else {
        // Body is already parsed as JSON
        webhookBody = JSON.stringify(req.body);
      }

      const webhookSignature = req.get('X-Razorpay-Signature');
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

      // Log webhook receipt for debugging
      logControllerAction(req, 'handleWebhook_received', {
        hasBody: !!webhookBody,
        bodyLength: webhookBody.length,
        hasSignature: !!webhookSignature,
        hasSecret: !!webhookSecret,
        contentType: req.get('Content-Type'),
        userAgent: req.get('User-Agent'),
      });

      // Parse the body for processing
      let parsedBody;
      try {
        parsedBody = JSON.parse(webhookBody);
      } catch (parseError) {
        logControllerAction(req, 'handleWebhook', {
          error: 'Invalid JSON in webhook body',
          severity: 'warning',
          parseError: parseError instanceof Error ? parseError.message : 'Unknown error',
          bodyPreview: webhookBody.substring(0, 200),
        });
        sendErrorResponse(res, 400, 'Invalid JSON payload');
        return;
      }

      // Validate webhook secret configuration
      if (!webhookSecret) {
        logControllerAction(req, 'handleWebhook', {
          error: 'Webhook secret not configured',
          severity: 'critical',
          envVars: Object.keys(process.env).filter(k => k.includes('RAZORPAY')),
        });
        sendErrorResponse(res, 500, 'Webhook secret not configured');
        return;
      }

      // Validate webhook signature presence
      if (!webhookSignature) {
        logControllerAction(req, 'handleWebhook', {
          error: 'Missing webhook signature',
          severity: 'warning',
          headers: req.headers,
          event: parsedBody.event,
        });
        sendErrorResponse(res, 400, 'Missing webhook signature');
        return;
      }

      // Verify webhook signature
      const isValidSignature = verifyWebhookSignature(webhookBody, webhookSignature, webhookSecret);

      if (!isValidSignature) {
        logControllerAction(req, 'handleWebhook', {
          error: 'Invalid webhook signature',
          severity: 'critical',
          signatureReceived: webhookSignature,
          bodyLength: webhookBody.length,
          event: parsedBody.event,
        });
        sendErrorResponse(res, 400, 'Invalid webhook signature');
        return;
      }

      // Validate webhook payload structure
      const { event, payload, created_at } = parsedBody;

      if (!event || !payload) {
        logControllerAction(req, 'handleWebhook', {
          error: 'Invalid webhook payload structure',
          severity: 'warning',
          body: parsedBody,
        });
        sendErrorResponse(res, 400, 'Invalid webhook payload');
        return;
      }

      // Generate webhook ID for tracking
      webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logControllerAction(req, 'handleWebhook', {
        webhookId,
        event,
        created_at,
        paymentId: payload.payment?.entity?.id,
        orderId: payload.payment?.entity?.order_id,
        razorpayOrderId: payload.order?.entity?.id,
        processingTime: Date.now() - startTime,
      });

      // Handle different webhook events with idempotency
      let result;
      switch (event) {
        case 'payment.captured':
          result = await this.handlePaymentCaptured(payload, webhookId);
          break;
        case 'payment.failed':
          result = await this.handlePaymentFailed(payload, webhookId);
          break;
        case 'order.paid':
          result = await this.handleOrderPaid(payload, webhookId);
          break;
        case 'payment.authorized':
          result = await this.handlePaymentAuthorized(payload, webhookId);
          break;
        case 'payment.captured.failed':
          result = await this.handlePaymentCaptureFailed(payload, webhookId);
          break;
        default:
          logControllerAction(req, 'handleWebhook', {
            webhookId,
            warning: `Unhandled webhook event: ${event}`,
            event,
            payload: JSON.stringify(payload).substring(0, 500), // Limit payload logging
          });
          result = { processed: false, reason: 'Unhandled event' };
      }

      // Log processing result
      logControllerAction(req, 'handleWebhook', {
        webhookId,
        event,
        result,
        processingTime: Date.now() - startTime,
        success: true,
      });

      // Always respond with 200 to acknowledge receipt (webhook best practice)
      res.status(200).json({
        success: true,
        message: 'Webhook processed',
        webhookId,
        event,
        processed: result?.processed || false,
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;

      logControllerAction(req, 'handleWebhook', {
        webhookId,
        error: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        processingTime,
        severity: 'critical',
      });

      // Still return 200 to prevent webhook retries for system errors
      // This is a webhook best practice - only return 4xx for client errors
      res.status(200).json({
        success: false,
        message: 'Webhook processing failed',
        webhookId,
        error: 'Internal processing error',
      });
    }
  };

  private async handlePaymentCaptured(payload: any, webhookId: string) {
    try {
      const payment = payload.payment?.entity;
      if (!payment) {
        logControllerAction({} as Request, 'handlePaymentCaptured', {
          webhookId,
          error: 'Payment entity not found in payload',
          payload: JSON.stringify(payload).substring(0, 500),
        });
        return { processed: false, reason: 'Payment entity not found' };
      }

      // Extract order ID from multiple possible sources
      const orderId =
        payment.notes?.orderId ||
        payment.order_id ||
        payment.notes?.order_id ||
        payment.metadata?.orderId;

      if (!orderId) {
        logControllerAction({} as Request, 'handlePaymentCaptured', {
          webhookId,
          error: 'Order ID not found in payment',
          paymentId: payment.id,
          payment: JSON.stringify(payment).substring(0, 500),
        });
        return { processed: false, reason: 'Order ID not found' };
      }

      // Validate order ID format
      if (!validateObjectId(orderId)) {
        logControllerAction({} as Request, 'handlePaymentCaptured', {
          webhookId,
          error: 'Invalid order ID format',
          orderId,
          paymentId: payment.id,
        });
        return { processed: false, reason: 'Invalid order ID format' };
      }

      // Find order with additional validation
      const order = await Order.findById(orderId);
      if (!order) {
        logControllerAction({} as Request, 'handlePaymentCaptured', {
          webhookId,
          error: `Order not found: ${orderId}`,
          paymentId: payment.id,
        });
        return { processed: false, reason: 'Order not found' };
      }

      // Validate payment amount matches order total
      const paymentAmount = Number(payment.amount) / 100; // Convert from paise
      if (Math.abs(paymentAmount - order.orderTotal) > 0.01) {
        // Allow 1 paisa difference
        logControllerAction({} as Request, 'handlePaymentCaptured', {
          webhookId,
          error: 'Payment amount mismatch',
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          paymentId: payment.id,
          orderTotal: order.orderTotal,
          paymentAmount,
          difference: Math.abs(paymentAmount - order.orderTotal),
        });
        return { processed: false, reason: 'Payment amount mismatch' };
      }

      // Check if order is in a valid state for payment capture
      if (!['pending', 'authorized'].includes(order.orderStatus)) {
        logControllerAction({} as Request, 'handlePaymentCaptured', {
          webhookId,
          warning: `Order not in valid state for payment capture: ${order.orderStatus}`,
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          paymentId: payment.id,
          currentStatus: order.orderStatus,
        });
        return { processed: false, reason: `Order not in valid state: ${order.orderStatus}` };
      }

      // Check for duplicate processing (idempotency)
      const existingPaidEntry = order.history.find(
        h => h.orderStatus === 'paid' && h.comment?.includes(payment.id)
      );

      if (existingPaidEntry) {
        logControllerAction({} as Request, 'handlePaymentCaptured', {
          webhookId,
          warning: 'Payment already processed (idempotency check)',
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          paymentId: payment.id,
        });
        return { processed: true, reason: 'Already processed', idempotent: true };
      }

      // Update order status and add history
      order.orderStatus = 'paid';
      order.history.push({
        orderStatus: 'paid',
        comment: `Payment captured via webhook. Payment ID: ${payment.id}, Amount: ₹${paymentAmount}`,
        notify: true,
        createdAt: new Date(),
      });

      // Save order first
      await order.save();

      // Record coupon usage if coupon was applied (only once)
      if (order.coupon) {
        const existingCouponUsage = await CouponUsage.findOne({ order: order._id });
        if (!existingCouponUsage) {
          const couponDiscount = order.totals?.find(t => t.code === 'couponDiscount')?.value || 0;

          await CouponUsage.create({
            coupon: order.coupon,
            customer: order.customer,
            order: order._id,
            discountAmount: couponDiscount,
            orderTotal: order.orderTotal,
            usedAt: new Date(),
          });

          logControllerAction({} as Request, 'handlePaymentCaptured', {
            webhookId,
            info: 'Coupon usage recorded',
            orderId: order._id.toString(),
            couponId: order.coupon.toString(),
            discountAmount: couponDiscount,
          });
        }
      }

      // Clear customer cart after successful payment
      const cartResult = await Cart.findOneAndUpdate(
        { customerId: order.customer },
        { $set: { items: [] } },
        { new: true }
      );

      logControllerAction({} as Request, 'handlePaymentCaptured', {
        webhookId,
        success: true,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentId: payment.id,
        paymentAmount,
        cartCleared: !!cartResult,
        customerId: order.customer?.toString(),
      });

      return {
        processed: true,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentId: payment.id,
        amount: paymentAmount,
        status: 'paid',
      };
    } catch (error) {
      logControllerAction({} as Request, 'handlePaymentCaptured', {
        webhookId,
        error: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      return {
        processed: false,
        reason: 'Processing error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async handlePaymentFailed(payload: any, webhookId: string) {
    try {
      const payment = payload.payment?.entity;
      if (!payment) {
        logControllerAction({} as Request, 'handlePaymentFailed', {
          webhookId,
          error: 'Payment entity not found in payload',
          payload: JSON.stringify(payload).substring(0, 500),
        });
        return { processed: false, reason: 'Payment entity not found' };
      }

      // Extract order ID from multiple possible sources
      const orderId =
        payment.notes?.orderId ||
        payment.order_id ||
        payment.notes?.order_id ||
        payment.metadata?.orderId;

      if (!orderId) {
        logControllerAction({} as Request, 'handlePaymentFailed', {
          webhookId,
          error: 'Order ID not found in payment',
          paymentId: payment.id,
          payment: JSON.stringify(payment).substring(0, 500),
        });
        return { processed: false, reason: 'Order ID not found' };
      }

      // Validate order ID format
      if (!validateObjectId(orderId)) {
        logControllerAction({} as Request, 'handlePaymentFailed', {
          webhookId,
          error: 'Invalid order ID format',
          orderId,
          paymentId: payment.id,
        });
        return { processed: false, reason: 'Invalid order ID format' };
      }

      // Find order
      const order = await Order.findById(orderId);
      if (!order) {
        logControllerAction({} as Request, 'handlePaymentFailed', {
          webhookId,
          error: `Order not found: ${orderId}`,
          paymentId: payment.id,
        });
        return { processed: false, reason: 'Order not found' };
      }

      // Check if order is in a valid state for payment failure
      if (!['pending', 'authorized'].includes(order.orderStatus)) {
        logControllerAction({} as Request, 'handlePaymentFailed', {
          webhookId,
          warning: `Order not in valid state for payment failure: ${order.orderStatus}`,
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          paymentId: payment.id,
          currentStatus: order.orderStatus,
        });
        return { processed: false, reason: `Order not in valid state: ${order.orderStatus}` };
      }

      // Check for duplicate processing (idempotency)
      const existingFailedEntry = order.history.find(
        h => h.orderStatus === 'failed' && h.comment?.includes(payment.id)
      );

      if (existingFailedEntry) {
        logControllerAction({} as Request, 'handlePaymentFailed', {
          webhookId,
          warning: 'Payment failure already processed (idempotency check)',
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          paymentId: payment.id,
        });
        return { processed: true, reason: 'Already processed', idempotent: true };
      }

      // Update order status and add history
      order.orderStatus = 'failed';
      order.history.push({
        orderStatus: 'failed',
        comment: `Payment failed via webhook. Payment ID: ${payment.id}. Error: ${payment.error_description || payment.error_code || 'Unknown error'}`,
        notify: false,
        createdAt: new Date(),
      });

      await order.save();

      // Reverse coupon usage if any coupon was applied
      if (order.coupon) {
        await CouponController.reverseCouponUsage(order._id);

        logControllerAction({} as Request, 'handlePaymentFailed', {
          webhookId,
          info: 'Coupon usage reversed',
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          couponId: order.coupon.toString(),
        });
      }

      // Send payment failure email notification
      try {
        // Get customer details for email
        const customer = await mongoose.model('Customer').findById(order.customer).lean();
        if (customer && !Array.isArray(customer)) {
          // Prepare order data for email
          const orderForEmail = {
            orderId: order.orderNumber || order._id.toString(),
            dateAdded: order.createdAt.toISOString(),
            total: order.orderTotal,
            paymentMethod: order.paymentMethod || 'Razorpay',
            items:
              order.products?.flatMap((product: any) =>
                (product.options || []).map((opt: any) => ({
                  name: product.product ? product.product.toString() : 'Product',
                  quantity: 1,
                  price: opt.price || 0,
                  subtotal: opt.price || 0,
                }))
              ) || [],
            quantity: order.products?.reduce(
              (sum: number, product: any) => sum + (product.options?.length || 0),
              0
            ),
          };

          const customerForEmail = {
            email: customer?.email || '',
            firstName: customer?.firstName || '',
            lastName: customer?.lastName || '',
          };

          const errorReason =
            payment.error_description || payment.error_code || 'Payment processing failed';

          await sendPaymentFailureEmail(orderForEmail, customerForEmail, errorReason);

          logControllerAction({} as Request, 'handlePaymentFailed', {
            webhookId,
            info: 'Payment failure email sent successfully',
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            customerEmail: customer?.email,
          });
        }
      } catch (emailErr) {
        logControllerAction({} as Request, 'handlePaymentFailed', {
          webhookId,
          warning: 'Failed to send payment failure email',
          error: emailErr instanceof Error ? emailErr.message : 'Unknown error',
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
        });
        // Continue processing even if email fails
      }

      logControllerAction({} as Request, 'handlePaymentFailed', {
        webhookId,
        success: true,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentId: payment.id,
        error: payment.error_description || payment.error_code,
        customerId: order.customer?.toString(),
      });

      return {
        processed: true,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentId: payment.id,
        status: 'failed',
        error: payment.error_description || payment.error_code,
      };
    } catch (error) {
      logControllerAction({} as Request, 'handlePaymentFailed', {
        webhookId,
        error: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      return {
        processed: false,
        reason: 'Processing error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async handleOrderPaid(payload: any, webhookId: string) {
    try {
      const order = payload.order?.entity;
      if (!order) {
        logControllerAction({} as Request, 'handleOrderPaid', {
          webhookId,
          error: 'Order entity not found in payload',
          payload: JSON.stringify(payload).substring(0, 500),
        });
        return { processed: false, reason: 'Order entity not found' };
      }

      // Extract order ID from multiple possible sources
      const orderId =
        order.notes?.orderId || order.id || order.notes?.order_id || order.metadata?.orderId;

      if (!orderId) {
        logControllerAction({} as Request, 'handleOrderPaid', {
          webhookId,
          error: 'Order ID not found in order',
          razorpayOrderId: order.id,
          order: JSON.stringify(order).substring(0, 500),
        });
        return { processed: false, reason: 'Order ID not found' };
      }

      // Validate order ID format
      if (!validateObjectId(orderId)) {
        logControllerAction({} as Request, 'handleOrderPaid', {
          webhookId,
          error: 'Invalid order ID format',
          orderId,
          razorpayOrderId: order.id,
        });
        return { processed: false, reason: 'Invalid order ID format' };
      }

      // Find order
      const dbOrder = await Order.findById(orderId);
      if (!dbOrder) {
        logControllerAction({} as Request, 'handleOrderPaid', {
          webhookId,
          error: `Order not found: ${orderId}`,
          razorpayOrderId: order.id,
        });
        return { processed: false, reason: 'Order not found' };
      }

      // Check if order is in a valid state for payment
      if (!['pending', 'authorized'].includes(dbOrder.orderStatus)) {
        logControllerAction({} as Request, 'handleOrderPaid', {
          webhookId,
          warning: `Order not in valid state for payment: ${dbOrder.orderStatus}`,
          orderId: dbOrder._id.toString(),
          orderNumber: dbOrder.orderNumber,
          razorpayOrderId: order.id,
          currentStatus: dbOrder.orderStatus,
        });
        return { processed: false, reason: `Order not in valid state: ${dbOrder.orderStatus}` };
      }

      // Check for duplicate processing (idempotency)
      const existingPaidEntry = dbOrder.history.find(
        h => h.orderStatus === 'paid' && h.comment?.includes(order.id)
      );

      if (existingPaidEntry) {
        logControllerAction({} as Request, 'handleOrderPaid', {
          webhookId,
          warning: 'Order payment already processed (idempotency check)',
          orderId: dbOrder._id.toString(),
          orderNumber: dbOrder.orderNumber,
          razorpayOrderId: order.id,
        });
        return { processed: true, reason: 'Already processed', idempotent: true };
      }

      // Update order status and add history
      dbOrder.orderStatus = 'paid';
      dbOrder.history.push({
        orderStatus: 'paid',
        comment: `Order paid via webhook. Razorpay Order ID: ${order.id}`,
        notify: true,
        createdAt: new Date(),
      });

      await dbOrder.save();

      // Record coupon usage if coupon was applied (only once)
      if (dbOrder.coupon) {
        const existingCouponUsage = await CouponUsage.findOne({ order: dbOrder._id });
        if (!existingCouponUsage) {
          const couponDiscount = dbOrder.totals?.find(t => t.code === 'couponDiscount')?.value || 0;

          await CouponUsage.create({
            coupon: dbOrder.coupon,
            customer: dbOrder.customer,
            order: dbOrder._id,
            discountAmount: couponDiscount,
            orderTotal: dbOrder.orderTotal,
            usedAt: new Date(),
          });

          logControllerAction({} as Request, 'handleOrderPaid', {
            webhookId,
            info: 'Coupon usage recorded',
            orderId: dbOrder._id.toString(),
            couponId: dbOrder.coupon.toString(),
            discountAmount: couponDiscount,
          });
        }
      }

      // Clear customer cart after successful payment
      const cartResult = await Cart.findOneAndUpdate(
        { customerId: dbOrder.customer },
        { $set: { items: [] } },
        { new: true }
      );

      logControllerAction({} as Request, 'handleOrderPaid', {
        webhookId,
        success: true,
        orderId: dbOrder._id.toString(),
        orderNumber: dbOrder.orderNumber,
        razorpayOrderId: order.id,
        cartCleared: !!cartResult,
        customerId: dbOrder.customer?.toString(),
      });

      return {
        processed: true,
        orderId: dbOrder._id.toString(),
        orderNumber: dbOrder.orderNumber,
        razorpayOrderId: order.id,
        status: 'paid',
      };
    } catch (error) {
      logControllerAction({} as Request, 'handleOrderPaid', {
        webhookId,
        error: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      return {
        processed: false,
        reason: 'Processing error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async handlePaymentAuthorized(payload: any, webhookId: string) {
    try {
      const payment = payload.payment?.entity;
      if (!payment) {
        logControllerAction({} as Request, 'handlePaymentAuthorized', {
          webhookId,
          error: 'Payment entity not found in payload',
          payload: JSON.stringify(payload).substring(0, 500),
        });
        return { processed: false, reason: 'Payment entity not found' };
      }

      // Extract order ID from multiple possible sources
      const orderId =
        payment.notes?.orderId ||
        payment.order_id ||
        payment.notes?.order_id ||
        payment.metadata?.orderId;

      if (!orderId) {
        logControllerAction({} as Request, 'handlePaymentAuthorized', {
          webhookId,
          error: 'Order ID not found in payment',
          paymentId: payment.id,
        });
        return { processed: false, reason: 'Order ID not found' };
      }

      // Validate order ID format
      if (!validateObjectId(orderId)) {
        logControllerAction({} as Request, 'handlePaymentAuthorized', {
          webhookId,
          error: 'Invalid order ID format',
          orderId,
          paymentId: payment.id,
        });
        return { processed: false, reason: 'Invalid order ID format' };
      }

      // Find order
      const order = await Order.findById(orderId);
      if (!order) {
        logControllerAction({} as Request, 'handlePaymentAuthorized', {
          webhookId,
          error: `Order not found: ${orderId}`,
          paymentId: payment.id,
        });
        return { processed: false, reason: 'Order not found' };
      }

      // Check if order is in a valid state for authorization
      if (order.orderStatus !== 'pending') {
        logControllerAction({} as Request, 'handlePaymentAuthorized', {
          webhookId,
          warning: `Order not in valid state for authorization: ${order.orderStatus}`,
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          paymentId: payment.id,
          currentStatus: order.orderStatus,
        });
        return { processed: false, reason: `Order not in valid state: ${order.orderStatus}` };
      }

      // Check for duplicate processing (idempotency)
      const existingAuthorizedEntry = order.history.find(
        h => h.orderStatus === 'authorized' && h.comment?.includes(payment.id)
      );

      if (existingAuthorizedEntry) {
        logControllerAction({} as Request, 'handlePaymentAuthorized', {
          webhookId,
          warning: 'Payment authorization already processed (idempotency check)',
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          paymentId: payment.id,
        });
        return { processed: true, reason: 'Already processed', idempotent: true };
      }

      // Update order status and add history
      order.orderStatus = 'authorized';
      order.history.push({
        orderStatus: 'authorized',
        comment: `Payment authorized via webhook. Payment ID: ${payment.id}`,
        notify: false,
        createdAt: new Date(),
      });

      await order.save();

      logControllerAction({} as Request, 'handlePaymentAuthorized', {
        webhookId,
        success: true,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentId: payment.id,
        customerId: order.customer?.toString(),
      });

      return {
        processed: true,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentId: payment.id,
        status: 'authorized',
      };
    } catch (error) {
      logControllerAction({} as Request, 'handlePaymentAuthorized', {
        webhookId,
        error: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      return {
        processed: false,
        reason: 'Processing error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async handlePaymentCaptureFailed(payload: any, webhookId: string) {
    try {
      const payment = payload.payment?.entity;
      if (!payment) {
        logControllerAction({} as Request, 'handlePaymentCaptureFailed', {
          webhookId,
          error: 'Payment entity not found in payload',
          payload: JSON.stringify(payload).substring(0, 500),
        });
        return { processed: false, reason: 'Payment entity not found' };
      }

      // Extract order ID from multiple possible sources
      const orderId =
        payment.notes?.orderId ||
        payment.order_id ||
        payment.notes?.order_id ||
        payment.metadata?.orderId;

      if (!orderId) {
        logControllerAction({} as Request, 'handlePaymentCaptureFailed', {
          webhookId,
          error: 'Order ID not found in payment',
          paymentId: payment.id,
        });
        return { processed: false, reason: 'Order ID not found' };
      }

      // Validate order ID format
      if (!validateObjectId(orderId)) {
        logControllerAction({} as Request, 'handlePaymentCaptureFailed', {
          webhookId,
          error: 'Invalid order ID format',
          orderId,
          paymentId: payment.id,
        });
        return { processed: false, reason: 'Invalid order ID format' };
      }

      // Find order
      const order = await Order.findById(orderId);
      if (!order) {
        logControllerAction({} as Request, 'handlePaymentCaptureFailed', {
          webhookId,
          error: `Order not found: ${orderId}`,
          paymentId: payment.id,
        });
        return { processed: false, reason: 'Order not found' };
      }

      // Check if order is in a valid state for capture failure
      if (!['authorized', 'pending'].includes(order.orderStatus)) {
        logControllerAction({} as Request, 'handlePaymentCaptureFailed', {
          webhookId,
          warning: `Order not in valid state for capture failure: ${order.orderStatus}`,
          orderId: order._id.toString(),
          paymentId: payment.id,
          currentStatus: order.orderStatus,
        });
        return { processed: false, reason: `Order not in valid state: ${order.orderStatus}` };
      }

      // Check for duplicate processing (idempotency)
      const existingCaptureFailedEntry = order.history.find(
        h =>
          h.orderStatus === 'failed' &&
          h.comment?.includes('capture failed') &&
          h.comment?.includes(payment.id)
      );

      if (existingCaptureFailedEntry) {
        logControllerAction({} as Request, 'handlePaymentCaptureFailed', {
          webhookId,
          warning: 'Payment capture failure already processed (idempotency check)',
          orderId: order._id.toString(),
          paymentId: payment.id,
        });
        return { processed: true, reason: 'Already processed', idempotent: true };
      }

      // Update order status and add history
      order.orderStatus = 'failed';
      order.history.push({
        orderStatus: 'failed',
        comment: `Payment capture failed via webhook. Payment ID: ${payment.id}. Error: ${payment.error_description || payment.error_code || 'Unknown error'}`,
        notify: false,
        createdAt: new Date(),
      });

      await order.save();

      // Reverse coupon usage if any coupon was applied
      if (order.coupon) {
        await CouponController.reverseCouponUsage(order._id);

        logControllerAction({} as Request, 'handlePaymentCaptureFailed', {
          webhookId,
          info: 'Coupon usage reversed',
          orderId: order._id.toString(),
          couponId: order.coupon.toString(),
        });
      }

      // Send payment failure email notification
      try {
        // Get customer details for email
        const customer = await mongoose.model('Customer').findById(order.customer).lean();
        if (customer && !Array.isArray(customer)) {
          // Prepare order data for email
          const orderForEmail = {
            orderId: order.orderNumber || order._id.toString(),
            dateAdded: order.createdAt.toISOString(),
            total: order.orderTotal,
            paymentMethod: order.paymentMethod || 'Razorpay',
            items:
              order.products?.flatMap((product: any) =>
                (product.options || []).map((opt: any) => ({
                  name: product.product ? product.product.toString() : 'Product',
                  quantity: 1,
                  price: opt.price || 0,
                  subtotal: opt.price || 0,
                }))
              ) || [],
            quantity: order.products?.reduce(
              (sum: number, product: any) => sum + (product.options?.length || 0),
              0
            ),
          };

          const customerForEmail = {
            email: customer?.email || '',
            firstName: customer?.firstName || '',
            lastName: customer?.lastName || '',
          };

          const errorReason = `Payment capture failed: ${payment.error_description || payment.error_code || 'Unknown error'}`;

          await sendPaymentFailureEmail(orderForEmail, customerForEmail, errorReason);

          logControllerAction({} as Request, 'handlePaymentCaptureFailed', {
            webhookId,
            info: 'Payment failure email sent successfully',
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            customerEmail: customer?.email,
          });
        }
      } catch (emailErr) {
        logControllerAction({} as Request, 'handlePaymentCaptureFailed', {
          webhookId,
          warning: 'Failed to send payment failure email',
          error: emailErr instanceof Error ? emailErr.message : 'Unknown error',
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
        });
        // Continue processing even if email fails
      }

      logControllerAction({} as Request, 'handlePaymentCaptureFailed', {
        webhookId,
        success: true,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentId: payment.id,
        error: payment.error_description || payment.error_code,
        customerId: order.customer?.toString(),
      });

      return {
        processed: true,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentId: payment.id,
        status: 'failed',
        error: payment.error_description || payment.error_code,
      };
    } catch (error) {
      logControllerAction({} as Request, 'handlePaymentCaptureFailed', {
        webhookId,
        error: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      return {
        processed: false,
        reason: 'Processing error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Create controller instance
const checkoutController = new CheckoutController();

// Export refactored methods
export const {
  startCheckout,
  createPaymentOrder,
  completeCheckout,
  getCheckoutStatus,
  cancelCheckout,
  updatePaymentFailed,
  retryPayment,
  handleWebhook,
} = checkoutController;

// Export all controllers
export default {
  startCheckout,
  createPaymentOrder,
  completeCheckout,
  getCheckoutStatus,
  cancelCheckout,
  updatePaymentFailed,
  retryPayment,
  handleWebhook,
};
