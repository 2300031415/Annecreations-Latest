import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Coupon from '../models/coupon.model';
import CouponUsage from '../models/couponUsage.model';
import Order from '../models/order.model';
import { ICoupon } from '../types/models/coupon';
import { BaseController } from '../utils/baseController';
import {
  sendErrorResponse,
  sendResponse,
  logControllerAction,
  validateObjectId,
  escapeRegex,
} from '../utils/controllerUtils';
import { formatCouponResponse } from '../utils/responseFormatter';

class CouponController extends BaseController {
  constructor() {
    super('Coupon');
  }

  /**
   * Optimized single-query validation with atomic checks
   */
  private async validateCouponUsage(
    couponId: mongoose.Types.ObjectId,
    customerId: mongoose.Types.ObjectId,
    orderId: mongoose.Types.ObjectId
  ) {
    // Single aggregation to get all usage counts efficiently
    const usageStats = await CouponUsage.aggregate([
      {
        $facet: {
          totalUsage: [{ $match: { coupon: couponId } }, { $count: 'count' }],
          customerUsage: [
            { $match: { coupon: couponId, customer: customerId } },
            { $count: 'count' },
          ],
          orderUsage: [{ $match: { order: orderId } }, { $count: 'count' }],
        },
      },
    ]);

    const totalUsage = usageStats[0]?.totalUsage[0]?.count || 0;
    const customerUsage = usageStats[0]?.customerUsage[0]?.count || 0;
    const orderUsage = usageStats[0]?.orderUsage[0]?.count || 0;

    return {
      totalUsage,
      customerUsage,
      orderUsage,
    };
  }

  /**
   * Optimized coupon lookup
   */
  private async findValidCouponByCode(code: string) {
    const now = new Date();

    return await Coupon.findOne({
      code: code.toUpperCase(),
      status: true,
      $and: [
        {
          $or: [
            { dateStart: { $lte: now } },
            { dateStart: null },
            { dateStart: { $exists: false } },
          ],
        },
        { $or: [{ dateEnd: { $gte: now } }, { dateEnd: null }, { dateEnd: { $exists: false } }] },
      ],
    })
      .select(
        'name code type discount minAmount maxDiscount totalUses customerUses dateStart dateEnd'
      )
      .lean();
  }

  /**
   * Optimized usage statistics with single aggregation
   */
  private async getCouponStats(couponId: mongoose.Types.ObjectId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [stats] = await CouponUsage.aggregate([
      { $match: { coupon: couponId } },
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalUsage: { $sum: 1 },
                totalDiscount: { $sum: '$discountAmount' },
              },
            },
          ],
          customerStats: [
            {
              $group: {
                _id: '$customer',
                count: { $sum: 1 },
                totalDiscount: { $sum: '$discountAmount' },
                lastUsed: { $max: '$usedAt' },
              },
            },
            {
              $lookup: {
                from: 'customers',
                localField: '_id',
                foreignField: '_id',
                as: 'customer',
                pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
              },
            },
            { $unwind: '$customer' },
            { $sort: { count: -1 } },
            { $limit: 50 },
          ],
          recentUsage: [
            { $match: { usedAt: { $gte: thirtyDaysAgo } } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$usedAt' } },
                count: { $sum: 1 },
                totalDiscount: { $sum: '$discountAmount' },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    return {
      totalUsage: stats?.totalStats[0]?.totalUsage || 0,
      totalDiscount: stats?.totalStats[0]?.totalDiscount || 0,
      customerUsageStats: stats?.customerStats || [],
      usageOverTime: stats?.recentUsage || [],
    };
  }

  /**
   * Helper method to reverse coupon usage when orders are cancelled/refunded
   */
  static async reverseCouponUsage(orderId: mongoose.Types.ObjectId): Promise<void> {
    try {
      // Find and delete coupon usage record
      const deletedUsage = await CouponUsage.findOneAndDelete({ order: orderId });
      if (deletedUsage) {
        console.log(`Reversed coupon usage for order ${orderId}, coupon: ${deletedUsage.coupon}`);
      }

      // Clear coupon from order and reset totals to original amount
      const order = await Order.findById(orderId);
      if (order && order.coupon) {
        // Calculate original total from products
        const originalTotal = order.products.reduce(
          (sum: number, item: { subtotal?: number }) => sum + (item.subtotal || 0),
          0
        );

        await Order.findByIdAndUpdate(
          orderId,
          {
            $unset: { coupon: 1 },
            $set: {
              totals: [
                {
                  code: 'subtotal',
                  value: originalTotal,
                  sortOrder: 1,
                },
                {
                  code: 'total',
                  value: originalTotal,
                  sortOrder: 2,
                },
              ],
              orderTotal: originalTotal,
            },
            $push: {
              history: {
                orderStatus: 'cancelled',
                comment: `Coupon removed and order total reset to original amount: ${originalTotal.toFixed(2)}`,
                notify: false,
                createdAt: new Date(),
              },
            },
          },
          { new: true }
        );
      }
    } catch (error) {
      console.error(`Error reversing coupon usage for order ${orderId}:`, error);
      // Don't throw error - this shouldn't break the order cancellation process
    }
  }

  getAllCoupons = async (req: Request, res: Response) => {
    await this.getResources(req, res, Coupon, 'getAllCoupons', 'admin', {
      filters: this.buildCouponFilters(req),
      responseFields: formatCouponResponse,
    });
  };

  getCouponByCode = async (req: Request, res: Response) => {
    const code = req.params.code;

    const now = new Date();
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      status: true,
      $and: [
        {
          $or: [
            { dateStart: { $lte: now } },
            { dateStart: null },
            { dateStart: { $exists: false } },
          ],
        },
        { $or: [{ dateEnd: { $gte: now } }, { dateEnd: null }, { dateEnd: { $exists: false } }] },
      ],
    }).lean();

    if (!coupon) {
      sendErrorResponse(res, 404, 'Coupon not found or expired');
      return;
    }

    // For security, return limited information if not admin
    if (!req.admin) {
      const limitedCoupon = {
        _id: coupon._id.toString(),
        name: coupon.name,
        code: coupon.code,
        type: coupon.type,
        discount: coupon.discount,
        dateEnd: coupon.dateEnd,
      };
      return res.status(200).json(limitedCoupon);
    }

    // Return full details for admin
    return res.status(200).json(formatCouponResponse(coupon));
  };

  createCoupon = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'createCoupon', 'admin', async () => {
      try {
        // Validate required fields
        const validationError = this.validateCouponData(req.body);
        if (validationError) {
          sendErrorResponse(res, validationError.statusCode, validationError.message);
          return;
        }

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({ code: req.body.code.toUpperCase() });
        if (existingCoupon) {
          sendErrorResponse(res, 409, 'Coupon code already exists');
          return;
        }

        // Additional validation for usage limits
        const totalUses = req.body.totalUses || 0;
        const customerUses = req.body.customerUses || 0;

        if (totalUses > 0 && customerUses > 0 && customerUses > totalUses) {
          sendErrorResponse(res, 400, 'Customer uses cannot be greater than total uses');
          return;
        }

        // For fixed discount coupons, ensure discount doesn't exceed minimum amount
        if (req.body.type === 'F' && req.body.discount > (req.body.minAmount || 0)) {
          sendErrorResponse(res, 400, 'Fixed discount amount cannot exceed minimum order amount');
          return;
        }

        // Apply defaults and formatting
        const couponData = {
          ...req.body,
          code: req.body.code.trim().toUpperCase(),
          name: req.body.name.trim(),
          logged: req.body.logged || false,
          minAmount: req.body.minAmount || 0,
          maxDiscount: req.body.maxDiscount || 0,
          totalUses,
          customerUses,
          status: req.body.status !== undefined ? req.body.status : true,
          autoApply: req.body.autoApply || false,
        };

        // Handle date fields with validation
        if (req.body.dateStart) {
          const startDate = new Date(req.body.dateStart);
          if (isNaN(startDate.getTime())) {
            sendErrorResponse(res, 400, 'Invalid dateStart format. Please provide a valid date.');
            return;
          }
          couponData.dateStart = startDate;
        }
        if (req.body.dateEnd) {
          const endDate = new Date(req.body.dateEnd);
          if (isNaN(endDate.getTime())) {
            sendErrorResponse(res, 400, 'Invalid dateEnd format. Please provide a valid date.');
            return;
          }
          couponData.dateEnd = endDate;
        }

        // Validate date relationship
        if (
          couponData.dateStart &&
          couponData.dateEnd &&
          couponData.dateEnd <= couponData.dateStart
        ) {
          sendErrorResponse(res, 400, 'End date must be after start date');
          return;
        }

        // If autoApply is being set to true, deactivate all other auto-apply coupons
        if (couponData.autoApply === true) {
          await Coupon.updateMany({ autoApply: true }, { autoApply: false });
        }

        const coupon = new Coupon(couponData);
        await coupon.save();

        const response = formatCouponResponse(coupon);
        sendResponse(res, 201, response);
      } catch (error) {
        console.error('Error in createCoupon:', error);
        throw new Error('Internal server error');
      }
    });
  };

  updateCoupon = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'updateCoupon', 'admin', async () => {
      try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          sendErrorResponse(res, 400, 'Invalid ID format');
          return;
        }

        // Get existing coupon first
        const existingCoupon = await Coupon.findById(id);
        if (!existingCoupon) {
          sendErrorResponse(res, 404, 'Coupon not found');
          return;
        }

        // Validate update data
        const validationError = this.validateCouponData(req.body, true);
        if (validationError) {
          sendErrorResponse(res, validationError.statusCode, validationError.message);
          return;
        }

        // Validate usage limit relationships
        const totalUses =
          req.body.totalUses !== undefined ? req.body.totalUses : existingCoupon.totalUses;
        const customerUses =
          req.body.customerUses !== undefined ? req.body.customerUses : existingCoupon.customerUses;

        if (totalUses > 0 && customerUses > 0 && customerUses > totalUses) {
          sendErrorResponse(res, 400, 'Customer uses cannot be greater than total uses');
          return;
        }

        // Check usage limits against current usage if being modified
        if (req.body.totalUses !== undefined || req.body.customerUses !== undefined) {
          const currentTotalUsage = await CouponUsage.getTotalUsageCount(existingCoupon._id);

          // Check if new totalUses is less than current usage
          if (
            req.body.totalUses !== undefined &&
            req.body.totalUses > 0 &&
            req.body.totalUses < currentTotalUsage
          ) {
            sendErrorResponse(
              res,
              400,
              `Cannot set total uses to ${req.body.totalUses}. Coupon has already been used ${currentTotalUsage} times.`
            );
            return;
          }

          // Check if new customerUses would invalidate existing customer usage
          if (req.body.customerUses !== undefined && req.body.customerUses > 0) {
            // Find the customer with the highest usage count
            const usageStats = await CouponUsage.aggregate([
              { $match: { coupon: existingCoupon._id } },
              { $group: { _id: '$customer', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 1 },
            ]);

            if (usageStats.length > 0 && req.body.customerUses < usageStats[0].count) {
              sendErrorResponse(
                res,
                400,
                `Cannot set customer uses to ${req.body.customerUses}. Some customers have already used this coupon ${usageStats[0].count} times.`
              );
              return;
            }
          }
        }

        // Check if code is being changed and if it already exists
        if (req.body.code && req.body.code !== existingCoupon.code) {
          const codeExists = await Coupon.findOne({
            code: req.body.code.toUpperCase(),
            _id: { $ne: id },
          });
          if (codeExists) {
            sendErrorResponse(res, 409, 'Coupon code already exists');
            return;
          }
          req.body.code = req.body.code.trim().toUpperCase();
        }

        // Clean up string fields
        if (req.body.name) req.body.name = req.body.name.trim();

        // Handle date fields with validation
        if (req.body.dateStart) {
          const startDate = new Date(req.body.dateStart);
          if (isNaN(startDate.getTime())) {
            sendErrorResponse(res, 400, 'Invalid dateStart format. Please provide a valid date.');
            return;
          }
          req.body.dateStart = startDate;
        }
        if (req.body.dateEnd) {
          const endDate = new Date(req.body.dateEnd);
          if (isNaN(endDate.getTime())) {
            sendErrorResponse(res, 400, 'Invalid dateEnd format. Please provide a valid date.');
            return;
          }
          req.body.dateEnd = endDate;
        }

        // Validate date relationship
        const finalStartDate = req.body.dateStart || existingCoupon.dateStart;
        const finalEndDate = req.body.dateEnd || existingCoupon.dateEnd;

        if (finalStartDate && finalEndDate && finalEndDate <= finalStartDate) {
          sendErrorResponse(res, 400, 'End date must be after start date');
          return;
        }

        // For fixed discount coupons, ensure discount doesn't exceed minimum amount
        const finalMinAmount =
          req.body.minAmount !== undefined ? req.body.minAmount : existingCoupon.minAmount;
        const finalDiscount =
          req.body.discount !== undefined ? req.body.discount : existingCoupon.discount;
        const finalType = req.body.type !== undefined ? req.body.type : existingCoupon.type;

        if (finalType === 'F' && finalDiscount > finalMinAmount) {
          sendErrorResponse(res, 400, 'Fixed discount amount cannot exceed minimum order amount');
          return;
        }

        // If autoApply is being set to true, deactivate all other auto-apply coupons
        if (req.body.autoApply === true) {
          await Coupon.updateMany({ _id: { $ne: id }, autoApply: true }, { autoApply: false });
        }

        // Update the coupon fields
        Object.assign(existingCoupon, req.body);

        // Save the coupon
        const updatedCoupon = await existingCoupon.save();

        if (!updatedCoupon) {
          sendErrorResponse(res, 404, 'Failed to update coupon');
          return;
        }

        const response = formatCouponResponse(updatedCoupon);
        sendResponse(res, 200, response);
      } catch (error) {
        console.error('Error in updateCoupon:', error);
        throw new Error('Internal server error');
      }
    });
  };

  deleteCoupon = async (req: Request, res: Response) => {
    await this.deleteResource(req, res, Coupon, 'deleteCoupon', 'admin');
  };

  getCouponUsageStats = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getCouponUsageStats', 'admin', async () => {
      const couponId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(couponId)) {
        return sendErrorResponse(res, 400, 'Invalid coupon ID');
      }

      const coupon = await Coupon.findById(couponId);
      if (!coupon) {
        return sendErrorResponse(res, 404, 'Coupon not found');
      }

      // Get optimized usage statistics
      const stats = await this.getCouponStats(coupon._id);

      const response = {
        coupon: {
          _id: coupon._id,
          name: coupon.name,
          code: coupon.code,
          totalUses: coupon.totalUses,
          customerUses: coupon.customerUses,
        },
        statistics: {
          totalUsage: stats.totalUsage,
          totalDiscount: stats.totalDiscount,
          remainingUses:
            coupon.totalUses > 0 ? Math.max(0, coupon.totalUses - stats.totalUsage) : 'unlimited',
          customerUsageStats: stats.customerUsageStats.map(
            (stat: {
              customer: {
                _id: mongoose.Types.ObjectId;
                firstName?: string;
                lastName?: string;
                email?: string;
              };
              count: number;
              totalDiscount: number;
              lastUsed: Date;
            }) => ({
              customer: {
                _id: stat.customer._id,
                firstName: stat.customer?.firstName,
                lastName: stat.customer?.lastName,
                email: stat.customer?.email,
              },
              usageCount: stat.count,
              totalDiscount: stat.totalDiscount,
              lastUsed: stat.lastUsed,
            })
          ),
          usageOverTime: stats.usageOverTime,
        },
      };

      return res.status(200).json(response);
    });
  };

  applyCoupon = async (req: Request, res: Response) => {
    try {
      // Log the controller action
      logControllerAction(req, 'applyCoupon', { code: req.body.code, orderId: req.body.orderId });

      // Authorization check
      if (!req.customer) {
        return sendErrorResponse(res, 403, 'Customer access required');
      }

      const { code, orderId } = req.body;

      if (!code) {
        return sendErrorResponse(res, 400, 'Coupon code is required');
      }

      // Sanitize and validate coupon code
      const sanitizedCode = code.toString().trim().toUpperCase();
      if (sanitizedCode.length === 0 || sanitizedCode.length > 50) {
        return sendErrorResponse(res, 400, 'Invalid coupon code format');
      }

      if (!orderId) {
        return sendErrorResponse(res, 400, 'Order ID is required');
      }

      // Find the order
      const order = await Order.findById(orderId);
      if (!order) {
        return sendErrorResponse(res, 404, 'Order not found');
      }

      // Verify customer owns this order
      if (order.customer?.toString() !== req.customer.id) {
        return sendErrorResponse(res, 403, 'Not authorized to modify this order');
      }

      // Check if order is in pending status
      if (order.orderStatus !== 'pending') {
        return sendErrorResponse(res, 400, 'Coupon can only be applied to pending orders');
      }

      // Find active coupon using optimized lookup
      const coupon = await this.findValidCouponByCode(sanitizedCode);
      if (!coupon) {
        return sendErrorResponse(res, 404, 'Coupon not found or expired');
      }

      // Validate usage with optimized single query
      const customerId = new mongoose.Types.ObjectId(req.customer.id);
      const orderObjectId = new mongoose.Types.ObjectId(orderId);
      const usageValidation = await this.validateCouponUsage(coupon._id, customerId, orderObjectId);

      // Check if order already has a coupon
      if (usageValidation.orderUsage > 0) {
        return sendErrorResponse(res, 400, 'A coupon has already been applied to this order');
      }

      // Calculate subtotal from products by summing option prices
      const subtotal = order.products.reduce((sum, product) => {
        let productSubtotal = 0;

        // Sum prices from all options for this product
        if (product.options && Array.isArray(product.options)) {
          product.options.forEach((option: { price?: number }) => {
            if (option.price && typeof option.price === 'number' && !isNaN(option.price)) {
              productSubtotal += option.price;
            }
          });
        }

        return sum + productSubtotal;
      }, 0);

      // Validate subtotal calculation
      if (isNaN(subtotal) || subtotal <= 0) {
        return sendErrorResponse(
          res,
          400,
          'Invalid order subtotal. Please ensure all products have valid prices.'
        );
      }

      // Check if coupon is valid for this amount
      if (subtotal < coupon.minAmount) {
        return sendErrorResponse(res, 400, `Minimum order amount of ${coupon.minAmount} required`);
      }

      // For fixed discount coupons, ensure discount doesn't exceed minimum amount
      if (coupon.type === 'F' && coupon.discount > coupon.minAmount) {
        return sendErrorResponse(
          res,
          400,
          `Fixed discount amount (${coupon.discount}) cannot exceed minimum order amount (${coupon.minAmount})`
        );
      }

      // Additional validation: ensure order subtotal is sufficient for the discount
      if (coupon.type === 'F' && subtotal < coupon.discount) {
        return sendErrorResponse(
          res,
          400,
          `Order subtotal (${subtotal}) is less than the fixed discount amount (${coupon.discount})`
        );
      }

      // Check if coupon limit has been reached
      if (coupon.totalUses > 0 && usageValidation.totalUsage >= coupon.totalUses) {
        return sendErrorResponse(
          res,
          400,
          `Coupon usage limit has been reached. Total uses: ${usageValidation.totalUsage}/${coupon.totalUses}`
        );
      }

      // Check if customer has reached the usage limit
      if (coupon.customerUses > 0 && usageValidation.customerUsage >= coupon.customerUses) {
        return sendErrorResponse(
          res,
          400,
          `You have already used this coupon ${usageValidation.customerUsage} time(s). Maximum uses per customer: ${coupon.customerUses}`
        );
      }

      // Calculate discount based on subtotal
      let discount = 0;
      if (coupon.type === 'P') {
        discount = (subtotal * coupon.discount) / 100;
      } else {
        discount = coupon.discount;
      }

      // Apply max discount limit if set
      if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }

      const discountAmount = Math.min(discount, subtotal);
      const finalTotal = Math.max(0, subtotal - discountAmount); // Ensure final total is never negative

      // Validate calculated values before updating
      if (isNaN(discountAmount) || isNaN(finalTotal)) {
        return sendErrorResponse(res, 500, 'Error calculating discount amounts. Please try again.');
      }

      // Apply mode: update the order with the coupon
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            coupon: coupon._id,
            orderTotal: finalTotal,
            totals: [
              {
                code: 'subtotal',
                value: subtotal,
                sortOrder: 1,
              },
              {
                code: 'couponDiscount',
                value: discountAmount,
                sortOrder: 2,
              },
              {
                code: 'total',
                value: finalTotal,
                sortOrder: 3,
              },
            ],
          },
        },
        { new: true }
      );

      const response = {
        coupon: {
          _id: coupon._id.toString(),
          name: coupon.name,
          code: coupon.code,
          type: coupon.type,
          discount: coupon.discount,
        },
        calculation: {
          originalTotal: subtotal,
          discountAmount: Math.abs(discountAmount || 0),
          finalTotal: updatedOrder?.orderTotal || finalTotal,
        },
        order: {
          _id: order._id.toString(),
          orderNumber: order.orderNumber,
          orderTotal: updatedOrder?.orderTotal || order.orderTotal,
          totals: updatedOrder?.totals || order.totals,
          coupon: updatedOrder?.coupon?.toString() || null,
        },
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error('Apply coupon error:', error);

      // Log failed coupon application attempt
      logControllerAction(req, 'applyCoupon_failed', {
        code: req.body.code,
        orderId: req.body.orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return sendErrorResponse(res, 500, 'Internal server error');
    }
  };

  /**
   * Apply auto-apply coupon to an order (Customer)
   * GET /api/coupons/auto-apply/:orderId
   */
  applyAutoApplyCoupon = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'applyAutoApplyCoupon', 'customer', async () => {
      const { orderId } = req.params;
      const customerId = req.customer?.id;

      // Validate order ID
      if (!validateObjectId(orderId)) {
        return res.status(400).json({
          applied: false,
          reason: 'Invalid order ID format',
          coupon: null,
          error: 'Invalid order ID format',
        });
      }

      // Find the order
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          applied: false,
          reason: 'Order not found',
          coupon: null,
          error: 'Order not found',
        });
      }

      // Verify customer owns this order
      if (order.customer?.toString() !== customerId) {
        return res.status(403).json({
          applied: false,
          reason: 'Not authorized to modify this order',
          coupon: null,
          error: 'Not authorized to modify this order',
        });
      }

      // Check if order already has a coupon
      if (order.coupon) {
        // Fetch the already applied coupon details
        const appliedCoupon = await Coupon.findById(order.coupon).lean();

        if (appliedCoupon) {
          // Find discount amount from totals
          const couponDiscount = order.totals?.find(
            (total: { code: string; value?: number }) => total.code === 'couponDiscount'
          );
          const discountAmount = couponDiscount?.value || 0;

          // Calculate subtotal from products
          const subtotal = order.products.reduce((sum, product) => {
            let productSubtotal = 0;
            if (product.options && Array.isArray(product.options)) {
              product.options.forEach((option: { price?: number }) => {
                if (option.price && typeof option.price === 'number' && !isNaN(option.price)) {
                  productSubtotal += option.price;
                }
              });
            }
            return sum + productSubtotal;
          }, 0);

          const originalAmount = subtotal;
          const finalAmount = order.orderTotal;

          return res.status(200).json({
            applied: true,
            coupon: {
              reason: `Coupon "${appliedCoupon.code}" applied! You saved ₹${discountAmount.toFixed(2)}`,
              code: appliedCoupon.code,
              name: appliedCoupon.name,
              type: appliedCoupon.type,
              discount: appliedCoupon.discount,
              discountAmount,
            },
            calculation: {
              originalAmount,
              discountAmount,
              finalAmount,
            },
            order: {
              orderId: order._id,
              orderNumber: order.orderNumber,
              orderTotal: finalAmount,
            },
          });
        }
      }

      // Check if order is in pending status
      if (order.orderStatus !== 'pending') {
        return res.status(400).json({
          applied: false,
          reason: 'Coupon can only be applied to pending orders',
          coupon: null,
          error: 'Coupon can only be applied to pending orders',
        });
      }

      // Fetch auto-apply coupon
      const autoApplyCoupon = await Coupon.findAutoApply();

      if (!autoApplyCoupon) {
        return res.status(200).json({
          applied: false,
          reason: 'No auto-apply coupon available',
          coupon: null,
        });
      }

      // Calculate subtotal from products by summing option prices
      const subtotal = order.products.reduce((sum, product) => {
        let productSubtotal = 0;

        // Sum prices from all options for this product
        if (product.options && Array.isArray(product.options)) {
          product.options.forEach((option: { price?: number }) => {
            if (option.price && typeof option.price === 'number' && !isNaN(option.price)) {
              productSubtotal += option.price;
            }
          });
        }

        return sum + productSubtotal;
      }, 0);

      // Validate coupon eligibility
      const isEligible = await this.validateAutoApplyCouponForOrder(
        autoApplyCoupon,
        subtotal,
        order.customer as mongoose.Types.ObjectId
      );

      if (!isEligible.valid) {
        return res.status(200).json({
          applied: false,
          reason: isEligible.reason,
          coupon: {
            code: autoApplyCoupon.code,
            name: autoApplyCoupon.name,
          },
        });
      }

      // Calculate discount
      let discount = 0;
      if (autoApplyCoupon.type === 'P') {
        discount = (subtotal * autoApplyCoupon.discount) / 100;
      } else {
        discount = autoApplyCoupon.discount;
      }

      // Apply max discount limit if set
      if (autoApplyCoupon.maxDiscount > 0 && discount > autoApplyCoupon.maxDiscount) {
        discount = autoApplyCoupon.maxDiscount;
      }

      const couponDiscount = Math.min(discount, subtotal);
      const finalTotal = Math.max(0, subtotal - couponDiscount);

      // Update order with coupon
      const updatedTotals = [
        {
          code: 'subtotal' as const,
          value: subtotal,
          sortOrder: 1,
        },
        {
          code: 'couponDiscount' as const,
          value: couponDiscount,
          sortOrder: 2,
        },
        {
          code: 'total' as const,
          value: finalTotal,
          sortOrder: 3,
        },
      ];

      order.coupon = autoApplyCoupon._id;
      order.orderTotal = finalTotal;
      order.totals = updatedTotals;
      order.history.push({
        orderStatus: 'pending',
        comment: `Auto-applied coupon: ${autoApplyCoupon.code} - Discount: ${couponDiscount.toFixed(2)}`,
        notify: false,
        createdAt: new Date(),
      });

      await order.save();

      logControllerAction(req, 'applyAutoApplyCoupon - Success', {
        orderId,
        customerId,
        couponCode: autoApplyCoupon.code,
        discountAmount: couponDiscount,
        finalTotal,
      });

      return res.status(200).json({
        applied: true,
        coupon: {
          reason: `Coupon "${autoApplyCoupon.code}" applied! You saved ₹${couponDiscount.toFixed(2)}`,
          code: autoApplyCoupon.code,
          name: autoApplyCoupon.name,
          type: autoApplyCoupon.type,
          discount: autoApplyCoupon.discount,
          discountAmount: couponDiscount,
        },
        calculation: {
          originalAmount: subtotal,
          discountAmount: couponDiscount,
          finalAmount: finalTotal,
        },
        order: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderTotal: finalTotal,
        },
      });
    });
  };

  /**
   * Validate if auto-apply coupon is eligible for the order
   * @private
   */
  private async validateAutoApplyCouponForOrder(
    coupon: ICoupon,
    orderTotal: number,
    customerId: mongoose.Types.ObjectId
  ): Promise<{ valid: boolean; reason?: string }> {
    // Check minimum amount
    if (orderTotal < coupon.minAmount) {
      const amountNeeded = (coupon.minAmount - orderTotal).toFixed(2);
      const discountDisplay = coupon.type === 'P' ? `${coupon.discount}%` : `₹${coupon.discount}`;
      return {
        valid: false,
        reason: `Add ₹${amountNeeded} more to get ${discountDisplay} discount.`,
      };
    }

    // Check if user needs to be logged in
    if (coupon.logged && !customerId) {
      return { valid: false, reason: 'Coupon requires authentication' };
    }

    // Check total usage limit
    if (coupon.totalUses > 0) {
      const totalUsage = await CouponUsage.countDocuments({ coupon: coupon._id });
      if (totalUsage >= coupon.totalUses) {
        return { valid: false, reason: 'Coupon usage limit reached' };
      }
    }

    // Check customer usage limit
    if (coupon.customerUses > 0) {
      const customerUsage = await CouponUsage.countDocuments({
        coupon: coupon._id,
        customer: customerId,
      });
      if (customerUsage >= coupon.customerUses) {
        return { valid: false, reason: 'You have already used this coupon maximum times' };
      }
    }

    return { valid: true };
  }

  private buildCouponFilters(req: Request): Record<string, unknown> {
    const filters: Record<string, unknown> = {};

    // Enhanced coupon-specific filters
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      const escapedSearch = escapeRegex(searchTerm);
      filters.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { code: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    if (req.query.status !== undefined) {
      filters.status = req.query.status === 'true';
    }

    if (req.query.type) {
      filters.type = req.query.type;
    }

    return filters;
  }

  private validateCouponData(
    data: {
      name?: string;
      code?: string;
      discount?: number;
      type?: string;
      [key: string]: unknown;
    },
    isUpdate = false
  ): { statusCode: number; message: string } | null {
    // For updates, only validate fields that are provided
    if (isUpdate) {
      if (
        data.name !== undefined &&
        (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0)
      ) {
        return { statusCode: 400, message: 'Coupon name must be a non-empty string' };
      }
      if (
        data.code !== undefined &&
        (!data.code || typeof data.code !== 'string' || data.code.trim().length === 0)
      ) {
        return { statusCode: 400, message: 'Coupon code must be a non-empty string' };
      }
      if (
        data.discount !== undefined &&
        (typeof data.discount !== 'number' || data.discount <= 0)
      ) {
        return { statusCode: 400, message: 'Discount amount must be a positive number' };
      }
      if (data.type !== undefined && !['F', 'P'].includes(data.type)) {
        return { statusCode: 400, message: 'Valid coupon type (F or P) is required' };
      }
    } else {
      // For creation, all fields are required
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        return {
          statusCode: 400,
          message: 'Coupon name is required and must be a non-empty string',
        };
      }
      if (!data.code || typeof data.code !== 'string' || data.code.trim().length === 0) {
        return {
          statusCode: 400,
          message: 'Coupon code is required and must be a non-empty string',
        };
      }
      if (!data.discount || typeof data.discount !== 'number' || data.discount <= 0) {
        return {
          statusCode: 400,
          message: 'Discount amount is required and must be a positive number',
        };
      }
      if (!data.type || !['F', 'P'].includes(data.type)) {
        return { statusCode: 400, message: 'Valid coupon type (F or P) is required' };
      }
    }

    return null;
  }
}

// Create controller instance
const couponController = new CouponController();

// Export the class for static method access
export { CouponController };

// Export all controller methods
export const {
  getAllCoupons,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponUsageStats,
  applyCoupon,
  applyAutoApplyCoupon,
} = couponController;

// Export default for backward compatibility
export default {
  // Admin methods
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponUsageStats,

  // Public methods
  getCouponByCode,
  applyCoupon,
  applyAutoApplyCoupon,
};
