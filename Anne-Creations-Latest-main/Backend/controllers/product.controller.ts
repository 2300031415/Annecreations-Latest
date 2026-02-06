import { Request, Response } from 'express';
import mongoose from 'mongoose';

import ProductOption from '../models/option.model';
import Order from '../models/order.model';
import Product from '../models/product.model';
import Review from '../models/review.model';
import { IProductOption } from '../types/models/index';
import { BaseController } from '../utils/baseController';
import {
  getPaginationOptions,
  getSortOptions,
  sanitizeData,
  validateObjectId,
  createSafeSearchFilter,
  ensureLanguageId,
  logControllerAction,
  sendErrorResponse,
  escapeRegex,
} from '../utils/controllerUtils';
import { getDateRangeIST } from '../utils/dateUtils';
import { deleteFileIfExists, saveFileToDisk, getMimeTypeFromExtension } from '../utils/fileUtils';
import { formatProductResponse } from '../utils/responseFormatter';
import { generateProductPDF } from '../utils/pdfGenerator';

const publicProductPath = 'catalog/product';
const publicFilesPath = 'catalog/files';

class ProductController extends BaseController {
  constructor() {
    super('Product');
  }

  /**
   * Helper method to get purchased options grouped by product
   * @param customerId - Customer's ID
   * @returns Map of productId -> Set of purchased option IDs for that product
   */
  private async getPurchasedOptionsByProduct(
    customerId: string
  ): Promise<Map<string, Set<string>>> {
    const purchasedOrders = await Order.find({
      customer: new mongoose.Types.ObjectId(customerId),
      orderStatus: 'paid',
    })
      .select('products')
      .lean();

    const purchasedMap = new Map<string, Set<string>>();

    purchasedOrders.forEach(order => {
      order.products.forEach((product: any) => {
        const productId = product.product.toString();

        // Get or create the set for this product
        if (!purchasedMap.has(productId)) {
          purchasedMap.set(productId, new Set<string>());
        }

        const optionSet = purchasedMap.get(productId)!;
        product.options.forEach((option: any) => {
          optionSet.add(option.option.toString());
        });
      });
    });

    return purchasedMap;
  }

  /**
   * Helper method to add purchased status to product options
   * @param products - Array of products
   * @param purchasedByProduct - Map of productId -> Set of purchased option IDs
   * @returns Products with purchased flag added to each option
   */
  private addPurchasedStatusToOptions(
    products: any[],
    purchasedByProduct: Map<string, Set<string>>
  ): any[] {
    return products.map(product => {
      const productId = product._id?.toString() || product._id;
      const purchasedOptionsForProduct = purchasedByProduct.get(productId);

      if (product.options && Array.isArray(product.options)) {
        product.options = product.options.map((option: any) => {
          // Extract the option reference ID
          const optionId = option.option?._id?.toString() || option.option?.toString();

          // Check if this specific option was purchased for this specific product
          const isPurchased = purchasedOptionsForProduct
            ? purchasedOptionsForProduct.has(optionId)
            : false;

          return {
            ...option,
            purchased: isPurchased,
          };
        });
      }
      return product;
    });
  }

  /**
   * Helper method to attach review stats to products
   * @param products - Array of products
   * @returns Products with averageRating and reviewCount added
   */
  private async attachReviewStats(products: any[]): Promise<any[]> {
    if (!products || products.length === 0) return products;

    const productIds = products.map(p => p._id);
    const reviewStats = await Review.aggregate([
      { $match: { product: { $in: productIds }, status: true } },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    const reviewStatsMap = new Map();
    reviewStats.forEach(stat => {
      reviewStatsMap.set(stat._id.toString(), {
        averageRating: parseFloat(stat.averageRating.toFixed(1)),
        reviewCount: stat.count,
      });
    });

    return products.map(product => {
      const stats = reviewStatsMap.get(product._id.toString()) || {
        averageRating: 0,
        reviewCount: 0,
      };
      return {
        ...product,
        ...stats,
      };
    });
  }

  getAllProducts = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getAllProducts', 'public', async () => {
      const { page, limit, skip } = getPaginationOptions(req);
      const sortOptions = getSortOptions(req, { createdAt: -1 });
      const sortField = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;

      // Build filters with admin vs public logic
      const filters = this.buildProductFilters(req);

      // Handle language filtering
      if (req.query.lang) {
        const langCode = (req.query.lang as string).toLowerCase();
        let language = await mongoose.model('Language').findOne({ code: langCode });

        // If exact match not found, try prefix match (e.g., 'en' matches 'en-gb')
        if (!language) {
          language = await mongoose.model('Language').findOne({ code: new RegExp(`^${langCode}(-|$)`, 'i') });
        }

        if (language) {
          filters.languageId = language._id;
        } else {
          return res.status(404).json({ message: `Language '${langCode}' not found` });
        }
      }

      // Handle 'type' or 'tab' query param for sorting/filtering
      const type = (req.query.type || req.query.tab) as string;
      if (type) {
        if (type === 'new') {
          // Strictly "New" arrivals - within last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          filters.createdAt = { $gte: thirtyDaysAgo };
          sortOptions.createdAt = -1;
        } else if (type === 'best') {
          // Public-facing weekly best sellers (pre-calculated by scheduler)
          filters.isBestSeller = true;
          sortOptions.weeklySalesCount = -1;
        } else if (type === 'best-selling' || type === 'most-bought') {
          sortOptions.salesCount = -1;
        } else if (type === 'todays-deals' || type === 'deals' || type === 'sale') {
          filters.$or = [
            { todayDeal: true, todayDealExpiry: { $gt: new Date() } },
            { activeDiscount: true }
          ];
          sortOptions.createdAt = -1; // Default to newest deals first
        } else if (type === 'free') {
          // Free designs: price is 0
          filters.$or = [
            { 'options.price': { $lte: 0 } },
            { 'options.price': { $exists: false } },
            { options: { $size: 0 } }
          ];
        }
      }

      // Check if sorting by sales count
      const sortBySales = (req.admin && sortField === 'salesCount') || type === 'best-selling' || type === 'most-bought';

      let products: any[];
      let total: number;

      if (sortBySales) {
        // Get all product IDs that match filters
        const matchingProducts = await Product.find(filters).select('_id').lean();
        const productIds = matchingProducts.map(p => p._id);
        total = productIds.length;

        // Get sales count for each product using aggregation
        // Apply date range filter to orders if provided
        const orderMatchFilter: any = {
          orderStatus: 'paid',
        };

        if (req.query.dateFrom || req.query.dateTo) {
          const { startDate, endDate } = getDateRangeIST(
            req.query.dateFrom as string,
            req.query.dateTo as string
          );

          if (startDate && endDate) {
            orderMatchFilter.createdAt = { $gte: startDate, $lte: endDate };
          } else if (startDate) {
            orderMatchFilter.createdAt = { $gte: startDate };
          } else if (endDate) {
            orderMatchFilter.createdAt = { $lte: endDate };
          }
        }

        const salesData = await Order.aggregate([
          {
            $match: orderMatchFilter,
          },
          {
            $unwind: '$products',
          },
          {
            $match: {
              'products.product': { $in: productIds },
            },
          },
          {
            $project: {
              product: '$products.product',
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
              salesCount: { $sum: '$optionsCount' },
            },
          },
        ]);

        // Create a map of productId -> salesCount
        const salesMap = new Map<string, number>();
        salesData.forEach((item: { _id: mongoose.Types.ObjectId; salesCount: number }) => {
          salesMap.set(item._id.toString(), item.salesCount);
        });

        // Sort product IDs by sales count first, then by secondary sort options
        const sortedProductIds = matchingProducts
          .map(p => {
            const productId = p._id.toString();
            return {
              _id: productId,
              salesCount: salesMap.get(productId) || 0,
            };
          })
          .sort((a, b) => {
            // Primary sort: sales count
            const salesDiff =
              sortOrder === 1 ? a.salesCount - b.salesCount : b.salesCount - a.salesCount;
            if (salesDiff !== 0) {
              return salesDiff;
            }
            // Secondary sort: apply sortOptions (e.g., createdAt)
            // Since we're working with IDs, we'll apply secondary sort after fetching products
            return 0;
          })
          .map(p => p._id);

        // Apply pagination to sorted IDs
        const paginatedProductIds = sortedProductIds.slice(skip, skip + limit);

        // Fetch full product data for paginated IDs
        const productDocs = await Product.find({
          _id: { $in: paginatedProductIds },
        })
          .populate('categories', 'name')
          .populate('languageId', 'name code')
          .populate('options.option', 'name sortOrder status')
          .lean();

        // Create a map of fetched products by ID for quick lookup
        const productMap = new Map<string, any>();
        productDocs.forEach((product: any) => {
          productMap.set(product._id.toString(), product);
        });

        // Reorder products according to paginatedProductIds order and add salesCount
        products = paginatedProductIds.map((productId: string) => {
          const product = productMap.get(productId);
          return {
            ...product,
            salesCount: salesMap.get(productId) || 0,
          };
        });

        // Apply secondary sorting from sortOptions (e.g., createdAt) for products with same sales count
        // Extract the secondary sort field and order from sortOptions
        const secondarySortField =
          Object.keys(sortOptions).find(key => key !== 'salesCount') || 'createdAt';
        const secondarySortOrder = sortOptions[secondarySortField] || -1;

        products.sort((a: any, b: any) => {
          // Primary sort: sales count
          const salesDiff =
            sortOrder === 1 ? a.salesCount - b.salesCount : b.salesCount - a.salesCount;
          if (salesDiff !== 0) {
            return salesDiff;
          }
          // Secondary sort: apply sortOptions (e.g., createdAt) when sales count is equal
          const aValue = a[secondarySortField];
          const bValue = b[secondarySortField];

          if (aValue === undefined && bValue === undefined) return 0;
          if (aValue === undefined) return 1;
          if (bValue === undefined) return -1;

          if (aValue < bValue) return secondarySortOrder === 1 ? -1 : 1;
          if (aValue > bValue) return secondarySortOrder === 1 ? 1 : -1;
          return 0;
        });
      } else {
        // Standard sorting (createdAt or other fields)
        products = await Product.find(filters)
          .populate('categories', 'name')
          .populate('languageId', 'name code')
          .populate('options.option', 'name sortOrder status')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean();

        total = await Product.countDocuments(filters);

        // Get sales count for products if admin is making the request
        if (req.admin && products.length > 0) {
          const productIds = products.map(p => p._id);

          // Apply date range filter to orders if provided
          const orderMatchFilter: any = {
            orderStatus: 'paid',
          };

          if (req.query.dateFrom || req.query.dateTo) {
            const { startDate, endDate } = getDateRangeIST(
              req.query.dateFrom as string,
              req.query.dateTo as string
            );

            if (startDate && endDate) {
              orderMatchFilter.createdAt = { $gte: startDate, $lte: endDate };
            } else if (startDate) {
              orderMatchFilter.createdAt = { $gte: startDate };
            } else if (endDate) {
              orderMatchFilter.createdAt = { $lte: endDate };
            }
          }

          const salesData = await Order.aggregate([
            {
              $match: orderMatchFilter,
            },
            {
              $unwind: '$products',
            },
            {
              $match: {
                'products.product': { $in: productIds },
              },
            },
            {
              $project: {
                product: '$products.product',
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
                salesCount: { $sum: '$optionsCount' },
              },
            },
          ]);

          // Create a map of productId -> salesCount
          const salesMap = new Map<string, number>();
          salesData.forEach((item: { _id: mongoose.Types.ObjectId; salesCount: number }) => {
            salesMap.set(item._id.toString(), item.salesCount);
          });

          // Add sales count to each product
          products = products.map((product: any) => ({
            ...product,
            salesCount: salesMap.get(product._id.toString()) || 0,
          }));
        }
      }

      // Get purchased options by product if customer is logged in
      let purchasedByProduct: Map<string, Set<string>> = new Map();
      if (req.customer?.id) {
        purchasedByProduct = await this.getPurchasedOptionsByProduct(req.customer.id);
      }

      // Get review stats for products
      products = await this.attachReviewStats(products);

      // Format products for response
      let formattedProducts = await Promise.all(
        products.map(async (product: any) => await formatProductResponse(product))
      );

      // Add purchased status to each option
      formattedProducts = this.addPurchasedStatusToOptions(formattedProducts, purchasedByProduct);

      // Add sales count to formatted products if admin (salesCount might be lost in formatProductResponse)
      if (req.admin) {
        formattedProducts = formattedProducts.map((formatted: any, index: number) => {
          const originalProduct = products[index];
          return {
            ...formatted,
            salesCount: originalProduct.salesCount || 0,
          };
        });
      }

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      };

      return res.status(200).json({ data: formattedProducts, pagination });
    });
  };

  getAllProductsByCategoryId = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getAllProductsByCategoryId', 'public', async () => {
      const categoryId = req.params.categoryId;
      if (!validateObjectId(categoryId)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }

      const { page, limit, skip } = getPaginationOptions(req);
      const filters: Record<string, any> = {};
      if (!req.admin) {
        filters.status = true;
      }

      // Price filtering
      const priceRanges = req.query.priceRanges; // Expecting array of strings like "100-200", "500+"

      if (priceRanges) {
        filters['options.price'] = {};
        const priceConditions: any[] = [];

        const ranges = Array.isArray(priceRanges) ? priceRanges : [priceRanges];
        ranges.forEach((range: any) => {
          if (range === '500+') {
            priceConditions.push({ 'options.price': { $gte: 500 } });
          } else {
            const [min, max] = range.split('-').map(Number);
            if (!isNaN(min) && !isNaN(max)) {
              priceConditions.push({ 'options.price': { $gte: min, $lte: max } });
            }
          }
        });

        if (priceConditions.length > 0) {
          filters.$or = priceConditions;
          delete filters['options.price'];
        }
      }

      // Category filtering (Multi-select)
      const categoryIds = req.query.categories;
      if (categoryIds) {
        const ids = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
        const validIds = ids.filter((id: any) => validateObjectId(id)).map((id: any) => new mongoose.Types.ObjectId(id));
        if (validIds.length > 0) {
          // If we are in a specific category page (categoryId param), we should probably include it
          // OR if the user selects other categories, maybe we show products from ANY of them.
          // Requirement: "Category multi-select checkboxes".
          // Usually this means "Show products that are in Category A OR Category B".
          // But we are already scoped to `categoryId` from params.
          // If the user selects categories in the sidebar, do we widen the search or narrow it?
          // Typically in a category page, selecting sub-categories narrows it.
          // But if these are top-level categories, it might widen it.
          // Let's assume the user wants to see products from the main category AND (any of the selected sub-categories OR just any of the selected categories).
          // Given the prompt "Category multi-select checkboxes", it implies we might be selecting *other* categories.
          // However, since we are inside `getAllProductsByCategoryId`, the base scope is `categoryId`.
          // Let's assume we want products that match `categoryId` AND are also in one of the selected `categoryIds` (intersection)
          // OR if the UI implies switching categories, it might be a global search.
          // But for this specific endpoint, let's stick to intersection if it makes sense, or union if the UI allows selecting siblings.
          // Let's go with: Products must be in `categoryId` AND (if `categoryIds` provided, must be in one of them).
          // Wait, if `categoryIds` contains `categoryId`, it's redundant.
          // If the sidebar allows selecting *other* categories, maybe we should use `$in`.

          // Let's treat `categoryId` as the "primary" context.
          // If `categoryIds` are provided, we filter products that are ALSO in these categories.
          filters.categories = { $all: [new mongoose.Types.ObjectId(categoryId)], $in: validIds };
        } else {
          filters.categories = new mongoose.Types.ObjectId(categoryId);
        }
      } else {
        filters.categories = new mongoose.Types.ObjectId(categoryId);
      }

      // Handle 'tab' or 'type' query param
      const tab = (req.query.tab || req.query.type) as string;
      if (tab === 'todays-deals') {
        filters.$or = [
          { todayDeal: true, todayDealExpiry: { $gt: new Date() } },
          { activeDiscount: true }
        ];
      } else if (tab === 'new') {
        req.query.sortBy = 'createdAt';
        req.query.sortOrder = 'desc';
      } else if (tab === 'best-selling' || tab === 'most-bought') {
        req.query.sortBy = 'salesCount';
        req.query.sortOrder = 'desc';
      }

      const sortOptions = getSortOptions(req, { createdAt: -1 });

      // Check if category exists and get products
      const products = await Product.find(filters)
        .populate('categories', 'name')
        .populate('languageId', 'name code')
        .populate('options.option', 'name sortOrder status')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Product.countDocuments(filters);

      // Get purchased options by product if customer is logged in
      let purchasedByProduct: Map<string, Set<string>> = new Map();
      if (req.customer?.id) {
        purchasedByProduct = await this.getPurchasedOptionsByProduct(req.customer.id);
      }

      // Get review stats for products
      const productsWithStats = await this.attachReviewStats(products);

      // Format products for response
      let formattedProducts = productsWithStats.map((product: any) => ({
        _id: product._id.toString(),
        productModel: product.productModel,
        sku: product.sku,
        description: product.description,
        stitches: product.stitches,
        dimensions: product.dimensions,
        colourNeedles: product.colourNeedles,
        options: product.options,
        image: product.image ? `image/${product.image}` : product.image,
        status: product.status,
        seo: product.seo,
        categories: product.categories?.map((cat: any) => ({
          _id: cat._id.toString(),
          name: cat.name,
        })),
        language: product.languageId,
        averageRating: product.averageRating || 0,
        reviewCount: product.reviewCount || 0,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));

      // Add purchased status to each option
      formattedProducts = this.addPurchasedStatusToOptions(formattedProducts, purchasedByProduct);

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      };

      return res.status(200).json({ data: formattedProducts, pagination });
    });
  };

  getProductById = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getProductById', 'public', async () => {
      const productIdentifier = req.params.id;
      if (!productIdentifier || productIdentifier.trim().length === 0) {
        return res.status(400).json({ message: 'Product identifier is required' });
      }

      // Build query filters - support both productId (_id) and productModel (backward compatibility)
      const filters: Record<string, any> = {};

      // Check if the identifier is a valid MongoDB ObjectId
      if (validateObjectId(productIdentifier)) {
        filters._id = new mongoose.Types.ObjectId(productIdentifier);
      } else {
        // Fallback to productModel search (backward compatibility)
        filters.productModel = productIdentifier.trim();
      }

      // For non-admin users, only show active products
      if (!req.admin) {
        filters.status = true;
      }

      const product = await Product.findOne(filters)
        .populate('categories', 'name')
        .populate('languageId', 'name code')
        .populate('options.option', 'name sortOrder status')
        .lean();

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Check if customer has purchased any of the product options
      let purchasedOptions: string[] = [];
      if (req.customer?.id) {
        const customerId = new mongoose.Types.ObjectId(req.customer.id);
        const currentProductId = product._id;
        const purchasedOrders = await Order.find({
          customer: customerId,
          orderStatus: 'paid',
          'products.product': currentProductId,
        })
          .select('products')
          .lean();

        // Extract purchased option IDs ONLY for the current product
        purchasedOptions = purchasedOrders.flatMap(order =>
          order.products
            .filter((product: any) => product.product.toString() === currentProductId.toString())
            .flatMap((product: any) =>
              product.options.map((option: any) => option.option.toString())
            )
        );
      }

      // Increment view count
      await Product.findByIdAndUpdate(product._id, { $inc: { viewed: 1 } });

      // Get review stats
      const reviewStats = await Review.aggregate([
        { $match: { product: product._id, status: true } },
        {
          $group: {
            _id: '$product',
            averageRating: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
      ]);

      const averageRating = reviewStats.length > 0 ? parseFloat(reviewStats[0].averageRating.toFixed(1)) : 0;
      const reviewCount = reviewStats.length > 0 ? reviewStats[0].count : 0;

      // Format product for response
      const productResponse = formatProductResponse(product as any, true);

      // Add purchased status to each option
      if (productResponse.options && Array.isArray(productResponse.options)) {
        productResponse.options = productResponse.options.map((option: any) => ({
          ...option,
          purchased: purchasedOptions.includes(
            option.option._id?.toString() || option.option.toString()
          ),
        }));
      }

      // Add review stats to response
      const responseWithReviews = {
        ...productResponse,
        averageRating,
        reviewCount,
      };

      return res.status(200).json(responseWithReviews);
    });
  };

  getRelatedProducts = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getRelatedProducts', 'public', async () => {
      const productIdentifier = req.params.id;
      if (!productIdentifier || productIdentifier.trim().length === 0) {
        return res.status(400).json({ message: 'Product identifier is required' });
      }

      const { page, limit, skip } = getPaginationOptions(req);

      // Build query filters - support both productId (_id) and productModel (backward compatibility)
      const productQueryFilters: Record<string, any> = {};

      if (validateObjectId(productIdentifier)) {
        productQueryFilters._id = new mongoose.Types.ObjectId(productIdentifier);
      } else {
        productQueryFilters.productModel = productIdentifier.trim();
      }

      const product = await Product.findOne(productQueryFilters).populate('categories');

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // STRICT MODE: Use ONLY the first category (Primary Category)
      // This prevents "related products" from becoming "random products" if the item is in generic categories like "Our Designs"
      const primaryCategoryId = product.categories?.[0]?._id;

      if (!primaryCategoryId) {
        // Fallback if no categories
        return res.status(200).json({ data: [], pagination: { page, limit, total: 0, pages: 0 } });
      }

      const filters = {
        status: true,
        categories: primaryCategoryId, // Must match this specific category
        _id: { $ne: product._id }, // Exclude current product
      };

      const relatedProducts = await Product.find(filters)
        .populate('categories', 'name')
        .populate('options.option', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Product.countDocuments(filters);

      // Get purchased options by product if customer is logged in
      let purchasedByProduct: Map<string, Set<string>> = new Map();
      if (req.customer?.id) {
        purchasedByProduct = await this.getPurchasedOptionsByProduct(req.customer.id);
      }

      // Get review stats for products
      const productsWithStats = await this.attachReviewStats(relatedProducts);

      let formattedProducts = productsWithStats.map((product: any) => ({
        _id: product._id,
        productModel: product.productModel,
        sku: product.sku,
        description: product.description,
        stitches: product.stitches,
        dimensions: product.dimensions,
        colourNeedles: product.colourNeedles,
        status: product.status,
        image: product.image ? `image/${product.image}` : product.image,
        averageRating: product.averageRating || 0,
        reviewCount: product.reviewCount || 0,
        createdAt: product.createdAt,
        options: product.options,
      }));

      // Add purchased status to each option
      formattedProducts = this.addPurchasedStatusToOptions(formattedProducts, purchasedByProduct);

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      };

      return res.status(200).json({ data: formattedProducts, pagination });
    });
  };

  getAllOptions = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getAllOptions', 'admin', async () => {
      const options = await ProductOption.find({}).lean();
      return res.status(200).json(options);
    });
  };

  createProduct = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'createProduct', 'admin', async () => {
      // Sanitize input data
      const sanitizedData = sanitizeData(req.body);

      // Check if SKU already exists
      const existingProduct = await Product.findOne({ productModel: sanitizedData.productModel });
      if (existingProduct) {
        return res.status(409).json({ message: 'productModel already exists' });
      }

      // Set default language if not provided
      // Get languageId - use provided one or default to English
      const languageId = await ensureLanguageId(req.body.languageId);
      sanitizedData.languageId = languageId;

      // Handle file uploads
      let imagePath: string | undefined;
      let additionalImages: Array<{ image: string; sortOrder: number }> = [];
      let options: IProductOption[] = [];

      // Type guard for multer.fields() structure
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      // Handle main image (single file)
      if (files?.image && files.image.length > 0) {
        imagePath = saveFileToDisk(files.image[0], publicProductPath);
      }

      // Handle additional images (multiple files)
      if (files?.additionalImages && files.additionalImages.length > 0) {
        additionalImages = files.additionalImages.map(
          (file: Express.Multer.File, index: number) => ({
            image: saveFileToDisk(file, publicProductPath),
            sortOrder: index,
          })
        );
      }

      // Handle options with uploaded files
      if (sanitizedData.options && Array.isArray(sanitizedData.options)) {
        options = sanitizedData.options.map((option: any, index: number) => {
          const optionData: Partial<IProductOption> = {
            option: option.option,
            price: option.price || 0,
            downloadCount: 0,
          };

          // Get the specific option file for this index
          const optionFileKey = `options[${index}].file`;
          const optionFiles = files?.[optionFileKey] || [];

          if (optionFiles.length > 0) {
            optionData.uploadedFilePath = saveFileToDisk(optionFiles[0], publicFilesPath);
            optionData.fileSize = optionFiles[0].size;
            optionData.mimeType =
              optionFiles[0].mimetype || getMimeTypeFromExtension(optionFiles[0].originalname);
          }

          return optionData;
        });
      }

      // Validate digital product requirements
      if (options.length === 0) {
        return res.status(400).json({
          message: 'Products must have at least one option with a downloadable file',
        });
      }

      const hasValidFiles = options.some((option: any) => option.uploadedFilePath);
      if (!hasValidFiles) {
        return res.status(400).json({
          message: 'Digital products must have at least one option with a downloadable file',
        });
      }

      // Set SEO metaTitle to productModel if not provided
      if (
        !sanitizedData.seo ||
        !sanitizedData.seo.metaTitle ||
        sanitizedData.seo.metaTitle.trim() === ''
      ) {
        if (!sanitizedData.seo) {
          sanitizedData.seo = {};
        }
        sanitizedData.seo.metaTitle = sanitizedData.productModel;
      }

      // Create product
      const product = new Product({
        ...sanitizedData,
        ...(imagePath && { image: imagePath }),
        ...(additionalImages.length > 0 && { additionalImages }),
        ...(options.length > 0 && { options }),
        status: sanitizedData.status !== undefined ? sanitizedData.status : true,
        sortOrder: sanitizedData.sortOrder || 0,
      });

      await product.save();

      // Return product data with proper image URLs
      const productResponse = {
        _id: product._id,
        productModel: product.productModel,
        sku: product.sku,
        status: product.status,
        image: product.image ? `image/${product.image}` : product.image,
        additionalImages: product.additionalImages?.map((img: any) => ({
          ...img,
          image: img.image ? `image/${img.image}` : img.image,
        })),
        options: product.options?.map((option: any) => ({
          option: option.option,
          price: option.price,
          fileSize: option.fileSize,
          mimeType: option.mimeType,
          downloadCount: option.downloadCount,
        })),
        createdAt: product.createdAt,
      };

      return res.status(201).json(productResponse);
    });
  };

  updateProduct = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'updateProduct', 'admin', async () => {
      const productId = req.params.id;
      if (!validateObjectId(productId)) {
        return sendErrorResponse(res, 400, 'Invalid product ID format');
      }

      // Get existing product to delete old files
      const existingProduct = await Product.findById(productId);
      if (!existingProduct) {
        return sendErrorResponse(res, 404, 'Product not found');
      }

      const updateData = sanitizeData(req.body);

      // Parse flat options structure into array (e.g., "options[0].option" -> options[0].option)
      const optionsMap: { [key: number]: Record<string, unknown> } = {};
      Object.keys(updateData).forEach(key => {
        const optionMatch = key.match(/^options\[(\d+)\]\.(\w+)$/);
        if (optionMatch) {
          const index = parseInt(optionMatch[1], 10);
          const field = optionMatch[2];
          if (!optionsMap[index]) {
            optionsMap[index] = {};
          }
          optionsMap[index][field] = updateData[key];
          delete updateData[key]; // Remove flat key
        }
      });

      // Convert options map to array if any options were found
      if (Object.keys(optionsMap).length > 0) {
        updateData.options = Object.keys(optionsMap)
          .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
          .map(key => optionsMap[parseInt(key, 10)]);
      }

      // Remove _id from update data to prevent changing primary key
      delete updateData._id;

      // Check SKU uniqueness if SKU is being updated
      // if (updateData.sku && updateData.sku !== existingProduct.sku) {
      //   const existingSkuProduct = await Product.findOne({
      //     sku: updateData.sku,
      //     _id: { $ne: productId }, // Exclude current product
      //   });
      //   if (existingSkuProduct) {
      //     return sendErrorResponse(res, 409, 'SKU already exists');
      //   }
      // }

      // Check product model uniqueness if product model is being updated
      if (updateData.productModel && updateData.productModel !== existingProduct.productModel) {
        const existingModelProduct = await Product.findOne({
          productModel: updateData.productModel,
          _id: { $ne: productId }, // Exclude current product
        });
        if (existingModelProduct) {
          return sendErrorResponse(res, 409, 'Product model already exists');
        }
      }

      // Ensure language ID exists or use default
      if (updateData.languageId) {
        updateData.languageId = await ensureLanguageId(updateData.languageId);
      }

      // Handle file uploads
      let imagePath: string | undefined;
      let additionalImages: Array<{ image: string; sortOrder: number }> = [];
      let options: IProductOption[] = [];

      // Handle deletion of existing images first
      if (updateData.deletedExistingImages && Array.isArray(updateData.deletedExistingImages)) {
        updateData.deletedExistingImages.forEach((imagePathToDelete: string) => {
          // Remove the 'image/' prefix if present to get the actual file path
          const actualPath = imagePathToDelete.startsWith('image/')
            ? imagePathToDelete.substring(6)
            : imagePathToDelete;
          deleteFileIfExists(actualPath);
        });
      }

      // Handle main image
      if (req.files && (req.files as any).image && (req.files as any).image[0]) {
        // Delete old main image if exists
        if (existingProduct.image) {
          deleteFileIfExists(existingProduct.image);
        }
        imagePath = saveFileToDisk((req.files as any).image[0], publicProductPath);
      } else if (
        updateData.deletedExistingImages &&
        Array.isArray(updateData.deletedExistingImages)
      ) {
        // Check if main image was deleted
        const mainImageDeleted = updateData.deletedExistingImages.some((deletedPath: string) => {
          const actualPath = deletedPath.startsWith('image/')
            ? deletedPath.substring(6)
            : deletedPath;
          return actualPath === existingProduct.image;
        });

        if (mainImageDeleted) {
          imagePath = undefined; // Remove main image
        } else {
          imagePath = existingProduct.image; // Keep existing main image
        }
      } else {
        // Preserve existing image path if no new image uploaded and no deletions
        imagePath = existingProduct.image;
      }

      // Handle additional images
      if (req.files && (req.files as any).additionalImages) {
        // Start with existing images (filtered by deletions if any)
        let existingImages = existingProduct.additionalImages || [];

        // If there are deleted images, filter them out first
        if (updateData.deletedExistingImages && Array.isArray(updateData.deletedExistingImages)) {
          const deletedPaths = updateData.deletedExistingImages.map((deletedPath: string) => {
            return deletedPath.startsWith('image/') ? deletedPath.substring(6) : deletedPath;
          });

          existingImages = existingImages.filter((img: { image: string }) => {
            return !deletedPaths.includes(img.image);
          });
        }

        // Add new uploaded images
        const newImages = (req.files as any).additionalImages.map(
          (file: Express.Multer.File, index: number) => ({
            image: saveFileToDisk(file, publicProductPath),
            sortOrder: existingImages.length + index, // Continue sort order from existing images
          })
        );

        // Combine existing and new images
        additionalImages = [...existingImages, ...newImages];
      } else if (
        updateData.deletedExistingImages &&
        Array.isArray(updateData.deletedExistingImages)
      ) {
        // Filter out deleted additional images
        const deletedPaths = updateData.deletedExistingImages.map((deletedPath: string) => {
          return deletedPath.startsWith('image/') ? deletedPath.substring(6) : deletedPath;
        });

        additionalImages = (existingProduct.additionalImages || []).filter(
          (img: { image: string }) => {
            return !deletedPaths.includes(img.image);
          }
        );
      } else {
        // Preserve existing additional images if no new images uploaded and no deletions
        additionalImages = existingProduct.additionalImages || [];
      }

      // Handle options with uploaded files
      if (updateData.options && Array.isArray(updateData.options)) {
        // Validate that there's at least one option
        if (updateData.options.length === 0) {
          return sendErrorResponse(res, 400, 'Product must have at least one option');
        }

        // Validate option count limit
        if (updateData.options.length > 10) {
          return sendErrorResponse(res, 400, 'Maximum 10 options allowed per product');
        }

        try {
          // Type guard for multer.fields() structure
          const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

          options = updateData.options.map((option: IProductOption, index: number) => {
            // Validate required fields for all options
            if (!option.option) {
              throw new Error(`Option ID is required for option at index ${index}`);
            }
            if (option.price === undefined || option.price < 0) {
              throw new Error(`Valid price is required for option at index ${index}`);
            }

            const optionData: Partial<IProductOption> = {
              option: option.option,
              price: option.price,
              downloadCount: option.downloadCount || 0,
              fileSize: option.fileSize || 0,
              mimeType: option.mimeType || 'application/octet-stream',
            };

            // Convert option.option to ObjectId for comparison
            const optionObjectId = new mongoose.Types.ObjectId(option.option);
            const isNewOption = !existingProduct.options.find(
              (o: IProductOption) => o.option.toString() === optionObjectId.toString()
            );

            // For new options, file is required
            if (isNewOption) {
              // Handle uploaded file for new option - use the correct field name pattern
              const optionFileKey = `options[${index}].file`;
              const optionFiles = files?.[optionFileKey] || [];

              if (optionFiles.length > 0) {
                optionData.uploadedFilePath = saveFileToDisk(optionFiles[0], publicFilesPath);
                optionData.fileSize = optionFiles[0].size;
                optionData.mimeType =
                  optionFiles[0].mimetype || getMimeTypeFromExtension(optionFiles[0].originalname);
              } else {
                throw new Error(
                  `File is required for new option at index ${index}. Expected field: ${optionFileKey}. Available file keys: ${Object.keys(files || {}).join(', ')}`
                );
              }
            } else {
              const existingOption = existingProduct.options.find(
                (o: IProductOption) => o.option.toString() === optionObjectId.toString()
              );

              if (!existingOption) {
                throw new Error(`Existing option not found for option at index ${index}`);
              }

              // Preserve existing file data
              optionData.uploadedFilePath = existingOption.uploadedFilePath;
              optionData.fileSize = existingOption.fileSize;
              optionData.mimeType = existingOption.mimeType;
              optionData.downloadCount = existingOption.downloadCount || 0;

              // Handle new file upload for existing option - use the correct field name pattern
              const optionFileKey = `options[${index}].file`;
              const optionFiles = files?.[optionFileKey] || [];

              if (optionFiles.length > 0) {
                // Delete old file if exists
                if (existingOption.uploadedFilePath) {
                  deleteFileIfExists(existingOption.uploadedFilePath);
                }

                // Save new file
                optionData.uploadedFilePath = saveFileToDisk(optionFiles[0], publicFilesPath);
                optionData.fileSize = optionFiles[0].size;
                optionData.mimeType =
                  optionFiles[0].mimetype || getMimeTypeFromExtension(optionFiles[0].originalname);
              }
            }

            return optionData;
          });
        } catch (error) {
          return sendErrorResponse(
            res,
            400,
            error instanceof Error ? error.message : 'Invalid option data'
          );
        }
      } else {
        // Preserve existing options if no new options provided
        options = existingProduct.options || [];
      }

      // Update product with file paths
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          ...updateData,
          ...(imagePath !== undefined && { image: imagePath }),
          ...(additionalImages !== undefined && { additionalImages }),
          ...(options.length > 0 && { options }),
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate('categories', 'name');

      if (!updatedProduct) {
        return sendErrorResponse(res, 404, 'Product not found');
      }

      // Return sanitized product data without exposing uploadedFilePath
      const sanitizedProduct = {
        _id: updatedProduct._id,
        productModel: updatedProduct.productModel,
        sku: updatedProduct.sku,
        status: updatedProduct.status,
        image: updatedProduct.image ? `image/${updatedProduct.image}` : updatedProduct.image,
        categories: updatedProduct.categories,
        options: updatedProduct.options?.map((option: IProductOption) => ({
          option: option.option,
          price: option.price,
          downloadCount: option.downloadCount,
          fileSize: option.fileSize,
          mimeType: option.mimeType,
        })),
        createdAt: updatedProduct.createdAt,
        updatedAt: updatedProduct.updatedAt,
      };

      return res.status(200).json(sanitizedProduct);
    });
  };

  deleteProduct = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'deleteProduct', 'admin', async () => {
      const productId = req.params.id;
      if (!validateObjectId(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      // Get product first to delete associated files
      const productToDelete = await Product.findById(productId);
      if (!productToDelete) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Delete main image if exists
      if (productToDelete.image) {
        deleteFileIfExists(productToDelete.image);
      }

      // Delete additional images if they exist
      if (productToDelete.additionalImages && productToDelete.additionalImages.length > 0) {
        productToDelete.additionalImages.forEach((img: any) => {
          if (img.image) {
            deleteFileIfExists(img.image);
          }
        });
      }

      // Delete option files if they exist
      if (productToDelete.options && productToDelete.options.length > 0) {
        productToDelete.options.forEach((option: any) => {
          if (option.uploadedFilePath) {
            deleteFileIfExists(option.uploadedFilePath);
          }
        });
      }

      // Now delete the product
      const deletedProduct = await Product.findByIdAndDelete(productId);

      if (!deletedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      return res.status(200).json({
        _id: deletedProduct._id,
        productModel: deletedProduct.productModel,
      });
    });
  };

  advancedProductSearch = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'advancedProductSearch', 'admin', async () => {
      const { page, limit, skip } = getPaginationOptions(req);
      const sortOptions = getSortOptions(req, { createdAt: -1 });

      // Build search query
      const query: any = {};

      if (req.body.search) {
        // Use safe search filter
        const searchFilter = createSafeSearchFilter(req.body.search, [
          'productModel',
          'sku',
          'stitches',
        ]);
        Object.assign(query, searchFilter);
      }

      if (req.body.categoryId && validateObjectId(req.body.categoryId)) {
        query.categories = new mongoose.Types.ObjectId(req.body.categoryId);
      }

      if (req.body.status !== undefined) {
        query.status = req.body.status === 'true';
      }

      const products = await Product.find(query)
        .populate('categories', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Product.countDocuments(query);

      const formattedProducts = products.map(product => ({
        _id: product._id,
        productModel: product.productModel,
        sku: product.sku,
        stitches: product.stitches,
        status: product.status,
        categories: product.categories,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      };

      return res.status(200).json({ data: formattedProducts, pagination });
    });
  };

  /**
   * Private helper method to build product-specific filters
   */
  private buildProductFilters(req: Request): Record<string, any> {
    const filters: Record<string, any> = {};

    // Enhanced product-specific filters
    if (req.query.category) {
      const categoryId = req.query.category as string;
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        filters.categories = new mongoose.Types.ObjectId(categoryId);
      }
    }

    if (req.query.search) {
      const searchTerm = req.query.search as string;
      if (searchTerm) {
        // Escape regex special characters
        const escapedSearch = escapeRegex(searchTerm);
        filters.$or = [
          { productModel: { $regex: escapedSearch, $options: 'i' } },
          { sku: { $regex: escapedSearch, $options: 'i' } },
          { description: { $regex: escapedSearch, $options: 'i' } },
        ];
      }
    }

    // Category filter - support multiple categories
    if (req.query.categories) {
      const categoryIds = (req.query.categories as string).split(',').filter(validateObjectId);
      if (categoryIds.length > 0) {
        filters.categories = { $in: categoryIds };
      }
    } else if (req.query.category && validateObjectId(req.query.category as string)) {
      filters.categories = req.query.category;
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      const priceFilter: any = {};
      if (req.query.minPrice) {
        const minPrice = parseFloat(req.query.minPrice as string);
        if (!isNaN(minPrice)) {
          priceFilter.$gte = minPrice;
        }
      }
      if (req.query.maxPrice) {
        const maxPrice = parseFloat(req.query.maxPrice as string);
        if (!isNaN(maxPrice)) {
          priceFilter.$lte = maxPrice;
        }
      }
      if (Object.keys(priceFilter).length > 0) {
        filters['options.price'] = priceFilter;
      }
    }

    // Handle "on sale" filter
    if (req.query.onSale === 'true') {
      filters.$or = filters.$or || [];
      filters.$or.push(
        { todayDeal: true, todayDealExpiry: { $gt: new Date() } },
        { activeDiscount: true }
      );
    }

    // Default status filter for public access
    if (!req.admin) {
      filters.status = true;
    }

    return filters;
  }

  compareProducts = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'compareProducts', 'public', async () => {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length < 2 || ids.length > 3) {
        return res.status(400).json({
          message: 'Please select between 2 and 3 products to compare.',
        });
      }

      // Validate ObjectIds
      const validIds = ids.filter((id) => validateObjectId(id));
      if (validIds.length !== ids.length) {
        return res.status(400).json({ message: 'Invalid product IDs provided.' });
      }

      const products = await Product.find({
        _id: { $in: validIds },
        status: true,
      })
        .populate('categories', 'name')
        .populate('options.option', 'name')
        .lean();

      if (products.length === 0) {
        return res.status(404).json({ message: 'No products found to compare.' });
      }

      // Format products for comparison - returning only schema fields
      const formattedProducts = products.map((product: any) => ({
        _id: product._id,
        productModel: product.productModel,
        sku: product.sku,
        description: product.description,
        image: product.image ? `image/${product.image}` : product.image,
        stitches: product.stitches,
        dimensions: product.dimensions,
        colourNeedles: product.colourNeedles,
        categories: product.categories?.map((cat: any) => cat.name).join(', '),
        price: product.options?.length > 0 ? Math.min(...product.options.map((o: any) => o.price || 0)) : 0,
        averageRating: product.averageRating || 0, // Will be 0 unless we attach stats, which is fine for now
      }));

      return res.status(200).json(formattedProducts);
    });
  };

  downloadProductPDF = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'downloadProductPDF', 'public', async () => {
      try {
        const id = req.params.id;

        if (!validateObjectId(id)) {
          sendErrorResponse(res, 400, 'Invalid product ID format');
          return;
        }

        const product = await Product.findById(id).lean();
        if (!product) {
          sendErrorResponse(res, 404, 'Product not found');
          return;
        }

        const productData = {
          productModel: product.productModel,
          stitches: product.stitches,
          dimensions: product.dimensions,
          colourNeedles: product.colourNeedles,
          image: product.image,
          additionalImages: product.additionalImages || [],
        };

        const pdfBuffer = await generateProductPDF(productData as any);

        const filename = `${product.productModel.replace(/\s+/g, '_')}_details.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);
      } catch (error) {
        console.error('Error in downloadProductPDF:', error);
        sendErrorResponse(res, 500, 'Failed to generate product PDF');
      }
    });
  };
}

// Create controller instance
const productController = new ProductController();

// Export refactored methods
export const {
  getAllProducts,
  getAllProductsByCategoryId,
  getProductById,
  getRelatedProducts,
  getAllOptions,
  createProduct,
  updateProduct,
  deleteProduct,
  advancedProductSearch,
  compareProducts,
  downloadProductPDF,
} = productController;

// Export default for backward compatibility
export default {
  // Public methods
  getAllProducts,
  getAllProductsByCategoryId,
  getProductById,
  getRelatedProducts,

  // Admin methods
  createProduct,
  updateProduct,
  deleteProduct,
  advancedProductSearch,
  getAllOptions,
  compareProducts,
  downloadProductPDF,
};
