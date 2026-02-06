import { Request, Response } from 'express';
import mongoose from 'mongoose';

import AuditLog from '../models/auditLog.model';
import Customer from '../models/customer.model';
import OnlineUser from '../models/onlineUser.model';
import Order from '../models/order.model';
import Product from '../models/product.model';
import SearchLog from '../models/searchLog.model';
import UserActivity from '../models/userActivity.model';
import { BaseController } from '../utils/baseController';
import { getPaginationOptions, getSortOptions, escapeRegex } from '../utils/controllerUtils';
import { getDateEndIST, getDateStartIST, getDateRangeDaysAgo } from '../utils/dateUtils';
import { getOrCreateBrowserId, isValidBrowserId } from '../utils/sessionUtils';

class AnalyticsController extends BaseController {
  constructor() {
    super('Analytics');
  }

  /**
   * Initialize browser session - get or generate browser ID
   * This should be called FIRST before any other API requests
   *
   * IMPORTANT: To prevent duplicate browserId cookies in incognito/new sessions:
   * - Frontend should call this endpoint FIRST on page load
   * - Wait for the response before making other API calls
   * - This ensures the browserId cookie is set before other requests
   * - Prevents race condition where multiple simultaneous requests generate different IDs
   *
   * @route GET /api/analytics/start
   * @returns {Object} success status
   */
  startSession = async (req: Request, res: Response) => {
    try {
      // Check if cookie already exists
      const cookieBrowserId = req.cookies?.browserId;

      if (!cookieBrowserId || !isValidBrowserId(cookieBrowserId)) {
        // Generate new browserId (this will also set the cookie)
        const browserId = getOrCreateBrowserId(req);

        // Note: Cookie is already set by getOrCreateBrowserId
        // We don't need to set it again here to avoid duplicate Set-Cookie headers

        // Only set cookie if it wasn't already set (safety check)
        if (!(req as any)._browserIdCookieSet) {
          // Clear any existing browserId cookies first to prevent duplicates
          res.clearCookie('browserId', { path: '/' });

          // Set as cookie for future requests
          res.cookie('browserId', browserId, {
            maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
            httpOnly: false,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
          });

          (req as any)._browserIdCookieSet = true;
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error in startSession:', error);
      res.status(500).json({ success: false });
    }
  };

  getOnlineUsers = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getOnlineUsers', 'admin', async () => {
      const filters: Record<string, any> = {};
      const { page, limit, skip } = getPaginationOptions(req);
      const sortOptions = getSortOptions(req, { lastActivity: -1 });

      // Apply filters
      if (req.query.userType) {
        filters.userType = req.query.userType;
      }

      // Get online users directly
      const users = await OnlineUser.find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('customer', 'firstName lastName email');

      // Get real-time stats - TTL index ensures only active users exist in database
      const [totalOnline, customersOnline, guestsOnline] = await Promise.all([
        OnlineUser.countDocuments({}),
        OnlineUser.countDocuments({ userType: 'customer' }),
        OnlineUser.countDocuments({ userType: 'guest' }),
      ]);

      const stats = { totalOnline, customersOnline, guestsOnline };

      const total = stats.totalOnline;

      // Format response with consistent structure
      const formattedUsers = users.map((user: any) => {
        const isCustomer = user.userType === 'customer' && user.customer;
        const customerData = user.customer as any;

        return {
          // Core identification
          _id: (user._id as { toString: () => string }).toString(),
          // User information (consistent format)
          displayName: isCustomer
            ? `${customerData?.firstName || ''} ${customerData?.lastName || ''}`.trim() ||
              'Customer'
            : 'Guest User',
          // Activity tracking
          source: user.source,
          lastActivity: user.lastActivity,
          loginTime: user.loginTime,
          totalPageViews: user.totalPageViews || 0,
          pageUrl: user.pageUrl,

          // Network information
          ipAddress: user.ipAddress,
          ipHistory: user.ipHistory || [],
          userAgent: user.userAgent,

          // Session information
          sessionHistory: user.sessionHistory || [],
          sessionPhases: user.sessionPhases || [],

          // Browsing analysis
          browsingAnalysis: {
            hasBrowsedAsGuest: ((user.guestPageViews as number) || 0) > 0,
            hasBrowsedAsCustomer: ((user.customerPageViews as number) || 0) > 0,
            pagesBeforeLogin:
              (user.sessionHistory as any[])?.filter(
                (entry: any) => entry.browsingPhase === 'guest'
              ).length || 0,
            pagesAfterLogin:
              (user.sessionHistory as any[])?.filter(
                (entry: any) => entry.browsingPhase === 'customer'
              ).length || 0,
            guestBrowsingDuration: (user.sessionPhases as any[])?.find(
              (phase: any) => phase.phase === 'guest'
            )
              ? user.loginTime
                ? new Date(user.loginTime as string).getTime() -
                  new Date((user.sessionPhases as any[])[0]?.startTime).getTime()
                : null
              : null,
          },
        };
      });

      const analytics = {
        totalOnline: stats.totalOnline,
        customersOnline: stats.customersOnline,
        guestsOnline: stats.guestsOnline,
      };

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      };

      return res.status(200).json({ users: formattedUsers, analytics, pagination });
    });
  };

  getUserActivity = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getUserActivity', 'admin', async () => {
      const { page, limit, skip } = getPaginationOptions(req);
      const filters: Record<string, unknown> = {};
      const sortOptions = getSortOptions(req, { lastActivity: -1 });

      if (req.query.customerId) {
        const customerId = req.query.customerId as string;
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
          return res.status(400).json({ message: 'Invalid customer ID format' });
        }
        filters.customer = new mongoose.Types.ObjectId(customerId);
      }

      if (req.query.action) {
        filters.action = req.query.action;
      }

      if (req.query.entityType) {
        filters.entityType = req.query.entityType;
      }

      if (req.query.ipAddress) {
        filters.ipAddress = req.query.ipAddress;
      }

      if (req.query.dateFrom || req.query.dateTo) {
        filters.lastActivity = {} as Record<string, unknown>;

        if (req.query.dateFrom) {
          (filters.lastActivity as Record<string, unknown>).$gte = getDateStartIST(
            req.query.dateFrom as string
          );
        }

        if (req.query.dateTo) {
          (filters.lastActivity as Record<string, unknown>).$lte = getDateEndIST(
            req.query.dateTo as string
          );
        }
      }

      const activities = await UserActivity.find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean();
      const total = await UserActivity.countDocuments(filters);

      // Get summary counts by action type
      const activityCounts = await UserActivity.aggregate([
        { $match: filters },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Format activities for response
      const formattedActivities = activities.map(activity => ({
        _id: activity._id.toString(),
        customer: activity.customer,
        action: activity.action,
        entityType: activity.entityType,
        productId: activity.productId,
        orderId: activity.orderId,
        categoryId: activity.categoryId,
        entityId: activity.entityId,
        activityData: activity.activityData,
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        browserId: activity.browserId,
        source: activity.source,
        lastActivity: activity.lastActivity,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
      }));

      const analytics = {
        total,
        byActivity: Object.fromEntries(activityCounts.map(item => [item._id, item.count])),
      };

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      };

      return res.status(200).json({ activities: formattedActivities, analytics, pagination });
    });
  };

  getSearchAnalytics = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getSearchAnalytics', 'admin', async () => {
      const days = parseInt(req.query.days as string) || 30;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Calculate date range using IST timezone
      const { startDate } = getDateRangeDaysAgo(days);

      // Apply filters
      const filters: Record<string, unknown> = {
        createdAt: { $gte: startDate },
      };

      if (req.query.query) {
        const escapedQuery = escapeRegex(req.query.query as string);
        filters.query = { $regex: escapedQuery, $options: 'i' };
      }

      // Get search logs with pagination
      const searches = await SearchLog.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const total = await SearchLog.countDocuments(filters);

      // Get popular search terms
      const popularSearches = await SearchLog.aggregate([
        { $match: filters },
        {
          $group: {
            _id: { $toLower: '$query' },
            count: { $sum: 1 },
            avgResults: { $avg: '$resultsCount' },
            lastSearched: { $max: '$createdAt' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            query: '$_id',
            count: 1,
            avgResults: { $round: ['$avgResults', 0] },
            lastSearched: 1,
          },
        },
      ]);

      // Get searches with zero results
      const zeroResultSearches = await SearchLog.aggregate([
        { $match: { ...filters, resultsCount: 0 } },
        {
          $group: {
            _id: { $toLower: '$query' },
            count: { $sum: 1 },
            lastSearched: { $max: '$createdAt' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            query: '$_id',
            count: 1,
            lastSearched: 1,
          },
        },
      ]);

      // Search trends by day
      const searchesByDay = await SearchLog.aggregate([
        { $match: filters },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            uniqueTerms: { $addToSet: { $toLower: '$query' } },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            count: 1,
            uniqueTerms: { $size: '$uniqueTerms' },
          },
        },
      ]);

      return res.status(200).json({
        period: `${days} days`,
        searches,
        summary: {
          totalSearches: total,
          popularSearches: popularSearches,
          zeroResultSearches: zeroResultSearches,
          searchesByDay: searchesByDay,
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    });
  };

  getAuditLogs = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getAuditLogs', 'admin', async () => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Apply filters if provided
      const filters: Record<string, unknown> = {};

      if (req.query.userId) {
        const userId = req.query.userId as string;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ message: 'Invalid user ID format' });
        }
        filters.userId = new mongoose.Types.ObjectId(userId);
      }

      if (req.query.userType) {
        filters.userType = req.query.userType;
      }

      if (req.query.action) {
        filters.action = req.query.action;
      }

      if (req.query.entityType) {
        filters.entityType = req.query.entityType;
      }

      if (req.query.entityId) {
        filters.entityId = req.query.entityId;
      }

      if (req.query.dateFrom || req.query.dateTo) {
        filters.createdAt = {} as Record<string, unknown>;

        if (req.query.dateFrom) {
          (filters.createdAt as Record<string, unknown>).$gte = getDateStartIST(
            req.query.dateFrom as string
          );
        }

        if (req.query.dateTo) {
          (filters.createdAt as Record<string, unknown>).$lte = getDateEndIST(
            req.query.dateTo as string
          );
        }
      }

      // Use direct find for all cases due to complex filtering requirements
      const auditLogs = await AuditLog.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      const total = await AuditLog.countDocuments(filters);

      // Get summary counts by action
      const actionCounts = await AuditLog.aggregate([
        { $match: filters },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Get summary counts by entity type
      const entityTypeCounts = await AuditLog.aggregate([
        { $match: filters },
        { $group: { _id: '$entityType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      const summary = {
        total,
        byAction: Object.fromEntries(actionCounts.map(item => [item._id, item.count])),
        byEntityType: Object.fromEntries(entityTypeCounts.map(item => [item._id, item.count])),
      };

      return res.status(200).json({
        audit_logs: auditLogs,
        summary,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    });
  };

  getSystemOverview = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getSystemOverview', 'admin', async () => {
      // Get current date and date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Count online users
      const activeThreshold = new Date(Date.now() - 5 * 60 * 1000);
      const [totalOnline, customersOnline, guestsOnline] = await Promise.all([
        OnlineUser.countDocuments({ lastActivity: { $gte: activeThreshold } }),
        OnlineUser.countDocuments({
          userType: 'customer',
          lastActivity: { $gte: activeThreshold },
        }),
        OnlineUser.countDocuments({ userType: 'guest', lastActivity: { $gte: activeThreshold } }),
      ]);

      const onlineStats = { totalOnline, customersOnline, guestsOnline };

      // Count total entities
      const totalProducts = await Product.countDocuments();
      const totalCustomers = await Customer.countDocuments();
      const totalOrders = await Order.countDocuments();

      // New entities in the last 30 days
      const newProducts = await Product.countDocuments({ date_added: { $gte: thirtyDaysAgo } });
      const newCustomers = await Customer.countDocuments({ date_added: { $gte: thirtyDaysAgo } });
      const newOrders = await Order.countDocuments({ date_added: { $gte: thirtyDaysAgo } });

      // Total searches in the last 30 days
      const totalSearches = await SearchLog.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

      // Most viewed products in the last 30 days
      const productViews = await UserActivity.aggregate([
        {
          $match: {
            action: 'view_product',
            entityType: 'Product',
            lastActivity: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: '$productId',
            views: { $sum: 1 },
          },
        },
        { $sort: { views: -1 } },
        { $limit: 5 },
      ]);

      // Enrich with product details
      const topProducts = await Promise.all(
        productViews.map(async item => {
          if (!item._id)
            return { productId: 'unknown', name: 'Unknown Product', views: item.views };

          const product = await Product.findById(item._id);
          if (!product) return { productId: item._id, name: 'Unknown Product', views: item.views };

          return {
            productId: product._id.toString(),
            name: product.model || 'Unknown Product',
            views: item.views,
          };
        })
      );

      return res.status(200).json({
        timestamp: new Date(),
        online: {
          total: onlineStats.totalOnline,
          customers: onlineStats.customersOnline,
          guests: onlineStats.guestsOnline,
        },
        totals: {
          products: totalProducts,
          customers: totalCustomers,
          orders: totalOrders,
          searches_30d: totalSearches,
        },
        new_30d: {
          products: newProducts,
          customers: newCustomers,
          orders: newOrders,
        },
        top_products: topProducts,
      });
    });
  };

  /**
   * Get detailed online user data with all tracked fields (admin only)
   */
  getOnlineUserDetails = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getOnlineUserDetails', 'admin', async () => {
      try {
        const users = await OnlineUser.find({})
          .sort({ lastActivity: -1 })
          .limit(50)
          .populate('customer', 'firstName lastName email');

        const total = await OnlineUser.countDocuments({});

        // Format response to show all tracked fields clearly
        const detailedUsers = users.map((user: any) => {
          const isCustomer = user.userType === 'customer' && user.customer;
          const customerData = user.customer as any;

          return {
            // Core identification
            _id: (user._id as { toString: () => string }).toString(),
            browserId: user.browserId,
            userType: user.userType,
            customerId: isCustomer ? customerData?._id?.toString() : null,

            // User information
            displayName: isCustomer
              ? `${customerData?.firstName || ''} ${customerData?.lastName || ''}`.trim() ||
                'Customer'
              : 'Guest User',
            email: isCustomer ? customerData?.email : null,

            // Enhanced activity tracking
            lastPageVisited: user.pageUrl || null,
            pageUrl: user.pageUrl, // Now stores referrer URL (where user came from)
            source: user.source,
            lastActivity: user.lastActivity,
            loginTime: user.loginTime,
            totalPageViews: user.totalPageViews || 0,
            guestPageViews: user.guestPageViews || 0,
            customerPageViews: user.customerPageViews || 0,
            sessionHistory: user.sessionHistory || [],
            sessionPhases: user.sessionPhases || [],

            // Network information
            ipAddress: user.ipAddress,
            ipHistory: user.ipHistory || [],
            userAgent: user.userAgent,

            // Status
            isActive:
              new Date().getTime() - new Date(user.lastActivity as string).getTime() <
              5 * 60 * 1000,
            isGuest: user.userType === 'guest',

            // Browsing analysis
            browsingAnalysis: {
              hasBrowsedAsGuest: ((user.guestPageViews as number) || 0) > 0,
              hasBrowsedAsCustomer: ((user.customerPageViews as number) || 0) > 0,
              pagesBeforeLogin:
                (user.sessionHistory as any[])?.filter(
                  (entry: any) => entry.browsingPhase === 'guest'
                ).length || 0,
              pagesAfterLogin:
                (user.sessionHistory as any[])?.filter(
                  (entry: any) => entry.browsingPhase === 'customer'
                ).length || 0,
              guestBrowsingDuration: (user.sessionPhases as any[])?.find(
                (phase: any) => phase.phase === 'guest'
              )
                ? user.loginTime
                  ? new Date(user.loginTime as string).getTime() -
                    new Date((user.sessionPhases as any[])[0]?.startTime).getTime()
                  : null
                : null,
            },

            // Metadata
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          };
        });

        // Get online stats
        const activeThreshold = new Date(Date.now() - 5 * 60 * 1000);
        const [totalOnline, customersOnline, guestsOnline] = await Promise.all([
          OnlineUser.countDocuments({ lastActivity: { $gte: activeThreshold } }),
          OnlineUser.countDocuments({
            userType: 'customer',
            lastActivity: { $gte: activeThreshold },
          }),
          OnlineUser.countDocuments({ userType: 'guest', lastActivity: { $gte: activeThreshold } }),
        ]);

        const stats = { totalOnline, customersOnline, guestsOnline };

        return res.status(200).json({
          message: 'Online user details retrieved successfully',
          data: {
            users: detailedUsers,
            total,
            stats: {
              totalOnline: stats.totalOnline,
              customersOnline: stats.customersOnline,
              guestsOnline: stats.guestsOnline,
            },
            fieldMapping: {
              customerId: 'customerId (ObjectId if logged in, null if guest)',
              lastPageVisited: 'pageUrl (string) - referrer URL (where user came from)',
              source: 'source (web|mobile)',
              lastActivity: 'lastActivity (Date) - when user was last active',
              ipAddress: 'ipAddress (string)',
              loginTime: 'loginTime (Date) - when user logged in',
              totalPageViews: 'totalPageViews (number) - total pages viewed in session',
              sessionHistory: 'sessionHistory (array) - complete URL history with timestamps',
              ipHistory: 'ipHistory (array) - all IPs used by this user',
            },
          },
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Error getting online user details:', error);
        return res.status(500).json({
          message: 'Failed to get online user details',
          error: 'DETAILS_ERROR',
        });
      }
    });
  };
}

// Create controller instance
const analyticsController = new AnalyticsController();

// Export all controller methods
export const {
  startSession,
  getOnlineUsers,
  getUserActivity,
  getSearchAnalytics,
  getAuditLogs,
  getSystemOverview,
  getOnlineUserDetails,
} = analyticsController;
