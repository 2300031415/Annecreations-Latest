import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Category from '../models/category.model';
import Product from '../models/product.model';
import SearchLog from '../models/searchLog.model';
import { IProduct } from '../types/models/index';
import { BaseController } from '../utils/baseController';
import { escapeRegex } from '../utils/controllerUtils';
import { getDateRangeDaysAgo } from '../utils/dateUtils';

class SearchController extends BaseController {
  constructor() {
    super('Search');
  }

  getSearchSuggestions = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getSearchSuggestions', 'public', async () => {
      const query = (req.query.q as string) || '';
      const status = req.query.status as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 6; // Default to 6 for instant search
      const skip = (page - 1) * limit;

      // Build filters
      const filters: Record<string, any> = {};

      // Status filter
      if (status !== undefined) {
        filters.status = status === 'true';
      } else {
        filters.status = true;
      }

      // Text search (Regex for partial match support in instant search)
      if (query && query.trim()) {
        const escapedQuery = escapeRegex(query.trim());
        filters.$or = [
          { productModel: { $regex: escapedQuery, $options: 'i' } },
          { sku: { $regex: escapedQuery, $options: 'i' } },
          { description: { $regex: escapedQuery, $options: 'i' } },
          { 'seo.metaKeyword': { $regex: escapedQuery, $options: 'i' } }, // Search tags
        ];
      }

      // Category search integration
      if (query && query.trim()) {
        const escapedQuery = escapeRegex(query.trim());
        const categories = await Category.find({
          name: { $regex: escapedQuery, $options: 'i' },
        })
          .select('name')
          .limit(10);

        if (categories && categories.length > 0) {
          const categoryIds = categories.map(category => category._id);
          filters.$or = filters.$or || [];
          filters.$or.push({ categories: { $in: categoryIds } });
        }
      }

      // Get total count
      const totalProducts = await Product.countDocuments(filters);

      // Get products
      const products = await Product.find(filters)
        .populate('categories', 'name')
        .populate('options.option', 'name')
        .sort({ viewed: -1, salesCount: -1 }) // Sort by popularity/relevance proxy
        .skip(skip)
        .limit(limit)
        .lean();

      // Format products for response
      const formattedProducts = products.map((product: any) => {
        // Get price (min price from options)
        let price = 0;
        if (product.options && product.options.length > 0) {
          const prices = product.options.map((opt: any) => opt.price).filter((p: number) => p !== undefined && p !== null);
          if (prices.length > 0) {
            price = Math.min(...prices);
          }
        }

        // Get category name
        const category = product.categories && product.categories.length > 0
          ? product.categories[0].name
          : 'Uncategorized';

        return {
          _id: product._id.toString(),
          productModel: product.productModel,
          sku: product.sku,
          image: product.image ? `image/${product.image}` : product.image,
          category,
          price,
          slug: product.productModel // Assuming productModel is used for URL
        };
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalProducts / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      // Log search
      if (query && query.trim()) {
        try {
          await SearchLog.create({
            searchTerm: query.trim(),
            customerId: req.customer?.id ? new mongoose.Types.ObjectId(req.customer.id) : undefined,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            resultsCount: products.length,
            searchTime: Date.now(),
          });
        } catch (logError) {
          console.warn('Failed to log search query:', logError);
        }
      }

      return res.status(200).json({
        products: formattedProducts,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts,
          limit,
          hasNextPage,
          hasPrevPage,
        },
      });
    });
  };

  getPopularSearches = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getPopularSearches', 'public', async () => {
      const limit = parseInt(req.query.limit as string) || 10;

      const popularSearches = await SearchLog.aggregate([
        { $match: { searchTerm: { $exists: true, $ne: '' } } },
        { $group: { _id: '$searchTerm', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]);

      const response = {
        popularSearches: popularSearches.map(item => ({
          query: item._id,
          count: item.count,
        })),
      };

      return res.status(200).json(response);
    });
  };

  getSearchAnalytics = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getSearchAnalytics', 'admin', async () => {
      const days = parseInt(req.query.days as string) || 30;
      const { startDate } = getDateRangeDaysAgo(days);

      // Get search statistics
      const searchStats = await SearchLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            totalSearches: { $sum: 1 },
            averageResults: { $avg: '$resultsCount' },
            averageTime: { $avg: '$searchTime' },
          },
        },
      ]);

      // Get searches by day
      const searchesByDay = await SearchLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            avgResults: { $avg: '$resultsCount' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get zero-result searches
      const zeroResultSearches = await SearchLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            resultsCount: 0,
          },
        },
        {
          $group: {
            _id: '$searchTerm',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      const stats = searchStats[0] || {
        totalSearches: 0,
        averageResults: 0,
        averageTime: 0,
      };

      const response = {
        period: `${days} days`,
        overview: {
          totalSearches: stats.totalSearches,
          averageResults: Math.round(stats.averageResults || 0),
          averageTime: Math.round(stats.averageTime || 0),
        },
        searchesByDay: searchesByDay.map(day => ({
          date: day._id,
          count: day.count,
          avgResults: Math.round(day.avgResults || 0),
        })),
        zeroResultSearches: zeroResultSearches.map(item => ({
          query: item._id,
          count: item.count,
        })),
      };

      return res.status(200).json(response);
    });
  };

  getVisualSearch = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getVisualSearch', 'public', async () => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 8;
      const skip = (page - 1) * limit;

      const products = await Product.find({ status: true })
        .populate('categories', 'name')
        .sort({ viewed: -1, rating: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalProducts = await Product.countDocuments({ status: true });

      const formattedProducts = products.map((product: any) => ({
        _id: product._id.toString(),
        productModel: product.productModel,
        sku: product.sku,
        image: product.image ? `image/${product.image}` : product.image,
        category: product.categories?.[0]?.name || 'Design',
        price: product.options?.[0]?.price || 0,
        slug: product.productModel
      }));

      return res.status(200).json({
        products: formattedProducts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalProducts / limit),
          totalProducts,
          limit,
        },
      });
    });
  };
}

const searchController = new SearchController();

export const { getSearchSuggestions, getPopularSearches, getSearchAnalytics, getVisualSearch } = searchController;

export default {
  getSearchSuggestions,
  getPopularSearches,
  getSearchAnalytics,
  getVisualSearch,
};
