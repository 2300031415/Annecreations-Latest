import { Request, Response } from 'express';

import Customer from '../models/customer.model';
import OnlineUser from '../models/onlineUser.model';
import Order from '../models/order.model';
import { BaseController } from '../utils/baseController';
import { getDateRangeIST, getDateRangeDaysAgo, formatDateIST } from '../utils/dateUtils';

class DashboardController extends BaseController {
  constructor() {
    super('Dashboard');
  }

  getSalesRevenue = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getSalesRevenue', 'admin', async () => {
      // Show full revenue if no days parameter provided
      const daysParam = req.query.days as string;
      const days = daysParam ? parseInt(daysParam) : null;

      // Build date filter - only apply if days is specified
      const filters: Record<string, unknown> = {
        orderStatus: 'paid',
      };

      let period = 'All time';
      let startDateRange: Date | null = null;
      let endDateRange: Date | null = null;

      if (days !== null) {
        const dateRange = getDateRangeDaysAgo(days);
        startDateRange = dateRange.startDate;
        endDateRange = dateRange.endDate;
        filters.createdAt = { $gte: startDateRange, $lte: endDateRange };
        period = `${days} days`;
      }

      if (req.query.dateFrom || req.query.dateTo) {
        filters.createdAt = {} as Record<string, any>;

        const { startDate, endDate } = getDateRangeIST(
          req.query.dateFrom as string,
          req.query.dateTo as string
        );

        if (startDate) {
          startDateRange = startDate;
          console.log('startDateRange', startDate);
          (filters.createdAt as Record<string, any>).$gte = startDate;
        }
        if (endDate) {
          endDateRange = endDate;
          console.log('endDateRange', endDate);
          (filters.createdAt as Record<string, any>).$lte = endDate;
        }

        // Update period description when custom dates are provided
        if (req.query.dateFrom && req.query.dateTo) {
          period = `Custom range (${req.query.dateFrom} to ${req.query.dateTo})`;
        } else if (req.query.dateFrom) {
          period = `From ${req.query.dateFrom}`;
        } else if (req.query.dateTo) {
          period = `Until ${req.query.dateTo}`;
        }
      }

      console.log('filters', filters);

      const result = await Order.aggregate([
        {
          $match: filters,
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$orderTotal' },
          },
        },
      ]);

      const response = {
        period,
        startDate: formatDateIST(startDateRange),
        endDate: formatDateIST(endDateRange),
        totalSales: result.length > 0 ? result[0].totalSales : 0,
        totalRevenue: result.length > 0 ? Number(result[0].totalRevenue.toFixed(2)) : 0,
      };

      return res.status(200).json(response);
    });
  };

  getNewOrders = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getNewOrders', 'admin', async () => {
      const days = parseInt(req.query.days as string) || 7;
      const { startDate, endDate } = getDateRangeDaysAgo(days);

      const orders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
        .sort({ createdAt: -1 })
        .populate('customer', 'firstName lastName')
        .lean();

      const response = {
        period: `${days} days`,
        startDate: startDate,
        endDate: endDate,
        totalOrders: orders.length,
        orders: orders.map((order: any) => ({
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          customer: order.customer
            ? `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`
            : 'Unknown',
          total: order.orderTotal,
          status: order.orderStatus,
          razorpayOrderId: order.razorpayOrderId || null,
          createdAt: order.createdAt,
        })),
      };

      return res.status(200).json(response);
    });
  };

  getNewCustomers = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getNewCustomers', 'admin', async () => {
      const days = parseInt(req.query.days as string) || 30; // Default to 30 days
      const { startDate, endDate } = getDateRangeDaysAgo(days);

      const totalCustomers = await Customer.countDocuments();

      const customers = await Customer.find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
        .sort({ createdAt: -1 })
        .lean();

      const response = {
        period: `${days} days`,
        startDate: startDate,
        endDate: endDate,
        totalNewCustomers: customers.length,
        totalCustomers,
        customers: customers.map(customer => ({
          customerId: customer._id.toString(),
          name: `${customer?.firstName} ${customer?.lastName}`,
          email: customer?.email,
          ipAddress: customer.ipAddress,
          createdAt: customer.createdAt,
        })),
      };

      return res.status(200).json(response);
    });
  };

  getOnlineCustomers = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getOnlineCustomers', 'admin', async () => {
      const totalOnline = await OnlineUser.countDocuments();
      const response = { totalOnline };

      return res.status(200).json(response);
    });
  };

  getYearlyRevenue = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getYearlyRevenue', 'admin', async () => {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      // Use UTC dates that represent IST boundaries
      // IST midnight of Jan 1 = UTC 18:30 of Dec 31 (previous year)
      const startDate = new Date(Date.UTC(year - 1, 11, 31, 18, 30, 0, 0));
      // IST end of Dec 31 = UTC 18:29:59.999 of Dec 31
      const endDate = new Date(Date.UTC(year, 11, 31, 18, 29, 59, 999));

      const monthlyRevenue = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: 'paid',
          },
        },
        {
          $addFields: {
            // Convert UTC to IST (UTC+5:30) by adding 19800000 milliseconds (5.5 hours)
            istDate: {
              $add: ['$createdAt', 19800000], // 5.5 hours in milliseconds
            },
          },
        },
        {
          $group: {
            _id: { $month: '$istDate' },
            revenue: { $sum: '$orderTotal' },
            orders: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      // Fill in missing months with zero values
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthData = monthlyRevenue.find(item => item._id === i + 1);
        return {
          month: i + 1,
          revenue: monthData ? Number(monthData.revenue.toFixed(2)) : 0,
          orders: monthData ? monthData.orders : 0,
        };
      });

      const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0);
      const totalOrders = monthlyData.reduce((sum, month) => sum + month.orders, 0);

      const response = {
        year,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        monthlyData,
      };

      return res.status(200).json(response);
    });
  };

  getTopProducts = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getTopProducts', 'admin', async () => {
      const days = parseInt(req.query.days as string) || 30;
      const limit = parseInt(req.query.limit as string) || 10;
      const { startDate, endDate } = getDateRangeDaysAgo(days);

      const topProducts = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: 'paid',
          },
        },
        {
          $unwind: '$products',
        },
        {
          $addFields: {
            'products.totalPrice': {
              $sum: '$products.options.price',
            },
          },
        },
        {
          $project: {
            product: '$products.product',
            totalPrice: '$products.totalPrice',
            optionsCount: {
              $cond: {
                if: { $isArray: '$products.options' },
                then: { $size: '$products.options' },
                else: 0,
              },
            },
          },
        },
        {
          $group: {
            _id: '$product',
            totalSold: { $sum: '$optionsCount' },
            totalRevenue: { $sum: '$totalPrice' },
          },
        },
        {
          $sort: { totalSold: -1 },
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productDetails',
          },
        },
        {
          $unwind: '$productDetails',
        },
        {
          $project: {
            productId: '$_id',
            name: '$productDetails.productModel',
            sku: '$productDetails.sku',
            image: {
              $cond: {
                if: { $ne: ['$productDetails.image', null] },
                then: { $concat: ['image/', '$productDetails.image'] },
                else: null,
              },
            },
            totalSold: 1,
            totalRevenue: { $round: ['$totalRevenue', 2] },
          },
        },
      ]);

      const response = {
        period: `${days} days`,
        topProducts,
      };

      return res.status(200).json(response);
    });
  };

  getRecentOrders = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getRecentOrders', 'admin', async () => {
      const limit = parseInt(req.query.limit as string) || 10;

      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('customer', 'firstName lastName email')
        .lean();

      const response = {
        recentOrders: recentOrders.map((order: any) => ({
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          customer: order.customer
            ? {
                id: order.customer._id.toString(),
                name: `${order.customer.firstName} ${order.customer.lastName}`,
                email: order.customer.email,
              }
            : null,
          total: order.orderTotal,
          status: order.orderStatus,
          razorpayOrderId: order.razorpayOrderId || null,
          createdAt: order.createdAt,
        })),
      };

      return res.status(200).json(response);
    });
  };
}

// Create controller instance
const dashboardController = new DashboardController();

// Export all controller methods
export const {
  getSalesRevenue,
  getNewOrders,
  getNewCustomers,
  getOnlineCustomers,
  getYearlyRevenue,
  getTopProducts,
  getRecentOrders,
} = dashboardController;

// Export default for backward compatibility
export default {
  getSalesRevenue,
  getNewOrders,
  getNewCustomers,
  getOnlineCustomers,
  getYearlyRevenue,
  getTopProducts,
  getRecentOrders,
};
