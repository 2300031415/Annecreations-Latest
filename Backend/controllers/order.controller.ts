import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Customer from '../models/customer.model';
import Order from '../models/order.model';
import Product from '../models/product.model';
import { IOrder, IProductItem } from '../types/models/index';
import { BaseController } from '../utils/baseController';
import {
  getPaginationOptions,
  getSortOptions,
  sendResponse,
  sendErrorResponse,
  escapeRegex,
} from '../utils/controllerUtils';
import { getDateRangeIST } from '../utils/dateUtils';
import { formatOrderResponse } from '../utils/responseFormatter';

import { CouponController } from './coupon.controller';

class OrderController extends BaseController {
  constructor() {
    super('Order');
  }

  getAllOrders = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getAllOrders', 'admin', async () => {
      try {
        const { page, limit, skip } = getPaginationOptions(req);
        const sortOptions = getSortOptions(req, { createdAt: -1 });

        // Use regular find query with populate
        const filters = await this.buildOrderFilters(req);
        const orders = await Order.find(filters)
          .populate('customer', 'firstName lastName email mobile')
          .populate('products.product', 'productModel sku image price description')
          .populate('products.options.option', 'name')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean();

        const total = await Order.countDocuments(filters);

        const formattedOrders = orders.map((order: any) => formatOrderResponse(order, true));
        const pagination = {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        };

        return res.status(200).json({ data: formattedOrders, pagination });
      } catch (error) {
        console.error('Error in getAllOrders:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  };

  getOrderById = async (req: Request, res: Response) => {
    await this.getResourceById(req, res, Order, 'getOrderById', 'admin', {
      populate: ['customer', 'products.product', 'products.options.option'],
      responseFields: (order: any) => formatOrderResponse(order, true), // includePrivate = true for admin
    });
  };

  updateOrderStatus = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'updateOrderStatus', 'admin', async () => {
      try {
        const orderId = req.params.id;
        const { orderStatus, comment, notify } = req.body;

        // Validate order ID
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
          return res.status(400).json({ error: 'Invalid order ID' });
        }

        // Validate order status
        const validStatuses = ['pending', 'paid', 'cancelled', 'refunded', 'failed'];
        if (!orderStatus || !validStatuses.includes(orderStatus)) {
          return res.status(400).json({
            error: 'Valid order status is required',
            validStatuses,
          });
        }

        // Find the existing order
        const existingOrder = await Order.findById(orderId);
        if (!existingOrder) {
          return res.status(404).json({ error: 'Order not found' });
        }

        // Handle coupon usage reversal for cancelled/refunded orders
        if ((orderStatus === 'cancelled' || orderStatus === 'refunded') && existingOrder.coupon) {
          await CouponController.reverseCouponUsage(existingOrder._id);
        }

        // Increment salesCount for products if order is marked as paid
        if (orderStatus === 'paid' && existingOrder.orderStatus !== 'paid') {
          const productUpdates = existingOrder.products.map((p: any) =>
            Product.findByIdAndUpdate(p.product, { $inc: { salesCount: 1 } })
          );
          await Promise.all(productUpdates);
        }

        // Prepare history entry
        const historyEntry = {
          orderStatus,
          comment: comment ? comment + ' (Status updated by admin)' : 'Status updated by admin',
          notify: notify !== undefined ? notify : true,
          createdAt: new Date(),
        };

        // Update the order
        const updatedOrder = await Order.findByIdAndUpdate(
          orderId,
          {
            orderStatus,
            $push: { history: historyEntry },
          },
          { new: true }
        )
          .populate('customer', 'firstName lastName email')
          .populate('products.product', 'model sku image')
          .populate('products.options.option', 'name')
          .populate('coupon', 'name code discount')
          .lean();

        if (!updatedOrder) {
          return res.status(404).json({ error: 'Order not found after update' });
        }

        // Format response
        const response = formatOrderResponse(updatedOrder, true);

        return res.status(200).json({
          message: 'Order status updated successfully',
          order: response,
        });
      } catch (error) {
        console.error('Error updating order status:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  };

  /**
   * Private helper method to build order-specific filters
   */
  private async buildOrderFilters(req: Request): Promise<Record<string, any>> {
    const filters: Record<string, any> = {};

    if (req.query.paymentCode) {
      filters.paymentCode = req.query.paymentCode;
    }

    if (req.query.status) {
      const statusValue = req.query.status as string;
      // Handle multiple statuses separated by comma
      if (statusValue.includes(',')) {
        const statuses = statusValue
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0);
        if (statuses.length > 0) {
          filters.orderStatus = { $in: statuses };
        }
      } else {
        filters.orderStatus = statusValue.trim();
      }
    }

    if (req.query.customer) {
      const customerId = req.query.customer as string;
      if (mongoose.Types.ObjectId.isValid(customerId)) {
        filters.customer = new mongoose.Types.ObjectId(customerId);
      }
    }

    if (req.query.dateFrom || req.query.dateTo) {
      const { startDate, endDate } = getDateRangeIST(
        req.query.dateFrom as string,
        req.query.dateTo as string
      );

      filters.createdAt = {};
      if (startDate) {
        filters.createdAt.$gte = startDate;
      }
      if (endDate) {
        filters.createdAt.$lte = endDate;
      }
    }

    const searchTerm = req.query.search || req.query.searchTerm;
    const { searchField } = req.query;

    if (searchTerm) {
      const regex = new RegExp(searchTerm as string, 'i');

      if (searchField) {
        switch (searchField) {
          case 'id':
            filters.orderNumber = regex;
            break;

          case 'razorpayOrderId':
            filters.razorpayOrderId = regex;
            break;

          case 'customer':
          case 'name': {
            const customers = await Customer.find({
              $or: [{ firstName: regex }, { lastName: regex }],
            }).select('_id');

            if (customers.length === 0) {
              // No customers found, return empty result
              filters._id = { $in: [] };
            } else {
              filters.customer = { $in: customers.map(c => c._id) };
            }
            break;
          }

          case 'email': {
            const customers = await Customer.find({ email: regex }).select('_id');

            if (customers.length === 0) {
              // No customers found, return empty result
              filters._id = { $in: [] };
            } else {
              filters.customer = { $in: customers.map(c => c._id) };
            }
            break;
          }

          case 'phone': {
            const customers = await Customer.find({ mobile: regex }).select('_id');

            if (customers.length === 0) {
              // No customers found, return empty result
              filters._id = { $in: [] };
            } else {
              filters.customer = { $in: customers.map(c => c._id) };
            }
            break;
          }

          default:
            // Ignore invalid field, or throw an error
            break;
        }
      } else {
        // 🔎 Global search
        const customers = await Customer.find({
          $or: [{ firstName: regex }, { lastName: regex }, { email: regex }, { mobile: regex }],
        }).select('_id');

        if (customers.length === 0) {
          // No customers found, search by order number and razorpay order id
          filters.$or = [{ orderNumber: regex }, { razorpayOrderId: regex }];
        } else {
          filters.$or = [
            { orderNumber: regex },
            { razorpayOrderId: regex },
            { customer: { $in: customers.map(c => c._id) } },
          ];
        }
      }
    }

    return filters;
  }

  getCustomerOrders = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getCustomerOrders', 'customer', async () => {
      const customerId = req.customer?.id;
      const { page, limit, skip } = getPaginationOptions(req);
      const filters: Record<string, any> = {
        customer: new mongoose.Types.ObjectId(customerId),
        orderStatus: 'paid',
      };
      const sortOptions = getSortOptions(req, { createdAt: -1 });

      // Apply additional filters
      if (req.query.status) {
        filters.orderStatus = req.query.status;
      }

      if (req.query.dateFrom || req.query.dateTo) {
        const { startDate, endDate } = getDateRangeIST(
          req.query.dateFrom as string,
          req.query.dateTo as string
        );

        filters.createdAt = {};
        if (startDate) {
          filters.createdAt.$gte = startDate;
        }
        if (endDate) {
          filters.createdAt.$lte = endDate;
        }
      }

      // Apply search functionality
      const searchTerm = req.query.search;
      let matchingProductIds: string[] = [];

      if (searchTerm) {
        const escapedSearch = escapeRegex(searchTerm as string);
        const regex = new RegExp(escapedSearch, 'i');

        // Search by order number
        const orderNumberFilter = { orderNumber: regex };

        // Search by product names - find products that match the search term
        const matchingProducts = await Product.find({
          $or: [{ productModel: regex }],
        }).select('_id');

        if (matchingProducts.length > 0) {
          // Store matching product IDs for filtering response
          matchingProductIds = matchingProducts.map(p => p._id.toString());

          // If products found, search orders that contain these products
          const productFilter = {
            'products.product': { $in: matchingProducts.map(p => p._id) },
          };

          // Combine order number and product filters with OR
          filters.$or = [orderNumberFilter, productFilter];
        } else {
          // If no products found, only search by order number
          filters.orderNumber = regex;
        }
      }

      const orders = await Order.find(filters)
        .populate('products.product', 'productModel sku image')
        .populate('products.options.option', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Order.countDocuments(filters);

      // Format orders for response
      const formattedOrders = orders.map((order: IOrder) => {
        // Filter products to only show matching ones if search by product was performed
        let orderProducts = order.products || [];
        if (matchingProductIds.length > 0) {
          orderProducts = orderProducts.filter((product: IProductItem) =>
            matchingProductIds.includes((product.product as any)?._id?.toString())
          );
        }

        return {
          _id: order._id.toString(),
          orderStatus: order.orderStatus,
          orderNumber: order.orderNumber,
          totalAmount: order.orderTotal,
          payment: {
            firstName: order.paymentFirstName,
            lastName: order.paymentLastName,
            company: order.paymentCompany,
            address1: order.paymentAddress1,
            address2: order.paymentAddress2,
            city: order.paymentCity,
            postcode: order.paymentPostcode,
            country: order.paymentCountry,
            zone: order.paymentZone,
            addressFormat: order.paymentAddressFormat,
            method: order.paymentMethod,
            code: order.paymentCode,
          },
          products: orderProducts.map((product: IProductItem) => ({
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
            subtotal:
              product.options?.reduce((sum: number, option: any) => sum + (option.price || 0), 0) ||
              0,
          })),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        };
      });

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      };

      return res.status(200).json({ data: formattedOrders, pagination });
    });
  };

  getOrderDetails = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getOrderDetails', 'customer', async () => {
      const orderId = req.params.id;
      const customerId = req.customer?.id;

      const order = await Order.findOne({
        _id: orderId,
        customer: new mongoose.Types.ObjectId(customerId),
      })
        .populate('products.product', 'productModel sku image price description')
        .populate('languageId', 'name code')
        .lean();

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Format order for response
      const orderResponse = {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        customer: order.customer,
        payment: {
          firstName: order.paymentFirstName,
          lastName: order.paymentLastName,
          company: order.paymentCompany,
          address1: order.paymentAddress1,
          address2: order.paymentAddress2,
          city: order.paymentCity,
          postcode: order.paymentPostcode,
          country: order.paymentCountry,
          zone: order.paymentZone,
          addressFormat: order.paymentAddressFormat,
          method: order.paymentMethod,
          code: order.paymentCode,
        },
        total: order.orderTotal,
        orderStatus: order.orderStatus,
        languageId: order.languageId,
        ip: order.ipAddress,
        forwardedIp: order.forwardedIp,
        userAgent: order.userAgent,
        acceptLanguageId: order.acceptLanguageId,
        products:
          order.products?.map((product: any) => ({
            product: product.product,
            options: product.options?.map((option: any) => ({
              option: option.option,
              price: option.price,
              fileSize: option.fileSize,
              mimeType: option.mimeType,
              downloadCount: option.downloadCount,
            })),
            subtotal:
              product.options?.reduce((sum: number, option: any) => sum + (option.price || 0), 0) ||
              0,
          })) || [],
        product_count: order.products?.length || 0,
        totals: order.totals || [],
        history: order.history || [],
        coupon: order.coupon,
        couponDiscount: order.coupon,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };

      return res.status(200).json(orderResponse);
    });
  };

  getOrderAnalytics = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getOrderAnalytics', 'admin', async () => {
      const { startDate, endDate } = getDateRangeIST(
        req.query.dateFrom as string,
        req.query.dateTo as string
      );

      const dateFrom = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const dateTo = endDate || new Date();

      // Get order statistics
      const totalOrders = await Order.countDocuments({
        createdAt: { $gte: dateFrom, $lte: dateTo },
      });

      const totalRevenue = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: dateFrom, $lte: dateTo },
            orderStatus: { $in: ['paid'] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' },
          },
        },
      ]);

      const ordersByStatus = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: dateFrom, $lte: dateTo },
          },
        },
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
          },
        },
      ]);

      const dailyOrders = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: dateFrom, $lte: dateTo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      const analytics = {
        period: {
          from: dateFrom,
          to: dateTo,
        },
        summary: {
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          averageOrderValue: totalOrders > 0 ? (totalRevenue[0]?.total || 0) / totalOrders : 0,
        },
        ordersByStatus: ordersByStatus.reduce(
          (acc, item) => {
            acc[item._id] = item.count;
            return acc;
          },
          {} as Record<string, number>
        ),
        dailyOrders,
      };

      return res.status(200).json(analytics);
    });
  };

  getCustomersByProductModel = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getCustomersByProductModel', 'admin', async () => {
      try {
        const { productModel } = req.query;

        const sortOptions = getSortOptions(req, { createdAt: -1 });

        if (!productModel) {
          sendErrorResponse(res, 400, 'Product model is required');
          return;
        }

        // First, get the product ID from product model
        const product = await Product.findOne({ productModel: productModel }).select('_id');
        if (!product) {
          sendErrorResponse(res, 404, 'Product model not found');
          return;
        }

        // Get all orders with customer data for this product
        const orders = await Order.find({
          orderStatus: 'paid',
          'products.product': product._id,
        })
          .populate('customer', 'firstName lastName email mobile')
          .select('customer orderNumber createdAt updatedAt')
          .sort(sortOptions)
          .lean();

        // Create array with all orders (including duplicates for same customer)
        const customersByProduct = orders
          .filter((order: any) => order.customer)
          .map((order: any) => ({
            _id: order._id,
            orderNumber: order.orderNumber,
            firstName: order.customer?.firstName,
            lastName: order.customer?.lastName,
            email: order.customer?.email,
            mobile: order.customer.mobile,
            orderCreatedAt: order.createdAt,
            orderUpdatedAt: order.updatedAt,
          }));

        const response = {
          productModel,
          totalCustomers: customersByProduct.length,
          customers: customersByProduct,
        };

        sendResponse(res, 200, response);
      } catch (error) {
        console.error('Error getting customers by product model:', error);
        sendErrorResponse(res, 500, 'Internal server error');
      }
    });
  };

  getOrderStatuses = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getOrderStatuses', 'public', async () => {
      const statuses = [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'paid', label: 'Paid' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'refunded', label: 'Refunded' },
        { value: 'failed', label: 'Failed' },
      ];

      return res.status(200).json(statuses);
    });
  };
}

// Create controller instance
const orderController = new OrderController();

// Export refactored methods
export const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getCustomerOrders,
  getOrderDetails,
  getOrderAnalytics,
  getCustomersByProductModel,
  getOrderStatuses,
} = orderController;

// Export all controllers
export default {
  // Customer methods
  getCustomerOrders,
  getOrderDetails,

  // Admin methods
  getAllOrders,
  updateOrderStatus,
  getOrderAnalytics,
  getCustomersByProductModel,
  getOrderStatuses,
};
