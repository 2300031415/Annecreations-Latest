import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Category from '../models/category.model';
import Product from '../models/product.model';
import { ICategory } from '../types/models/index';
import { BaseController } from '../utils/baseController';
import {
  logControllerAction,
  sendErrorResponse,
  sendResponse,
  validateObjectId,
  ensureLanguageId,
  escapeRegex,
} from '../utils/controllerUtils';
import { deleteFileIfExists, saveFileToDisk } from '../utils/fileUtils';
import { generateCategoryPDFCatalog } from '../utils/pdfGenerator';
import { formatCategoryResponse } from '../utils/responseFormatter';

const publicPath = 'catalog/category';

class CategoryController extends BaseController {
  constructor() {
    super('Category');
  }

  getAllCategories = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getAllCategories', 'public', async () => {
      const filters = this.buildCategoryFilters(req);

      // Get all categories without pagination
      const query = Category.find(filters).populate('languageId');

      const documents = await query.lean();

      // Format documents for response with product count
      const formattedDocuments = await Promise.all(
        documents.map(async doc => await this.formatCategoryWithCount(doc))
      );

      // Send response without pagination
      res.status(200).json({
        data: formattedDocuments,
        count: formattedDocuments.length,
      });
    });
  };

  getCategoryById = async (req: Request, res: Response) => {
    await this.getResourceById(req, res, Category, 'getCategoryById', 'public', {
      populate: 'languageId',
      responseFields: formatCategoryResponse,
    });
  };

  createCategory = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'createCategory', 'admin', async () => {
      try {
        // Validate required fields
        const validationError = this.validateCategoryData(req.body);
        if (validationError) {
          sendErrorResponse(res, validationError.statusCode, validationError.message);
          return;
        }

        // Get languageId - use provided one or default to English
        const languageId = await ensureLanguageId(req.body.languageId);

        // Handle image upload
        let imagePath: string | undefined;
        if (req.file) {
          imagePath = saveFileToDisk(req.file, publicPath);
        }

        // Apply defaults and formatting
        const categoryData = {
          ...req.body,
          name: req.body.name.trim(),
          description: req.body.description?.trim(),
          languageId,
          image: imagePath,
          sortOrder: req.body.sortOrder || 0,
          status: req.body.status !== undefined ? req.body.status : true,
        };

        const category = new Category(categoryData);
        await category.save();

        const response = formatCategoryResponse(category);
        sendResponse(res, 201, response);
      } catch (error) {
        console.error('Error in createCategory:', error);
        throw new Error('Internal server error');
      }
    });
  };

  updateCategory = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'updateCategory', 'admin', async () => {
      try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          sendErrorResponse(res, 400, 'Invalid ID format');
          return;
        }

        // Get existing category
        const existingCategory = await Category.findById(id);
        if (!existingCategory) {
          sendErrorResponse(res, 404, 'Category not found');
          return;
        }

        // Validate update data
        const validationError = this.validateCategoryData(req.body, true);
        if (validationError) {
          sendErrorResponse(res, validationError.statusCode, validationError.message);
          return;
        }

        // Handle image upload
        let imagePath: string | undefined;
        if (req.file) {
          // Delete old image if exists
          if (existingCategory.image) {
            deleteFileIfExists(existingCategory.image);
          }
          imagePath = saveFileToDisk(req.file, publicPath);
        }

        // Parse SEO data if it's a string
        let seoData = req.body.seo;
        if (typeof seoData === 'string') {
          try {
            seoData = JSON.parse(seoData);
          } catch {
            // Ignore parsing errors for SEO data
          }
        }

        // Clean up string fields
        const updateData = {
          ...req.body,
          ...(req.body.name && { name: req.body.name.trim() }),
          ...(req.body.description && { description: req.body.description.trim() }),
          ...(imagePath && { image: imagePath }),
          ...(seoData && {
            metaTitle: seoData.metaTitle?.trim(),
            metaDescription: seoData.metaDescription?.trim(),
            metaKeyword: seoData.metaKeyword?.trim(),
          }),
        };

        const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        }).populate('languageId');

        if (!updatedCategory) {
          sendErrorResponse(res, 404, 'Category not found');
          return;
        }

        const response = formatCategoryResponse(updatedCategory);
        sendResponse(res, 200, response);
      } catch (error) {
        console.error('Error in updateCategory:', error);
        throw new Error('Internal server error');
      }
    });
  };

  deleteCategory = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'deleteCategory', 'admin', async () => {
      try {
        const { sendErrorResponse, sendResponse } = await import('../utils/controllerUtils');

        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          sendErrorResponse(res, 400, 'Invalid ID format');
          return;
        }

        const category = await Category.findById(id);
        if (!category) {
          sendErrorResponse(res, 404, 'Category not found');
          return;
        }

        // Check if category has products
        const productCount = await Product.countDocuments({ categories: id });
        if (productCount > 0) {
          sendErrorResponse(res, 400, `Cannot delete category with ${productCount} products`);
          return;
        }

        // Delete image if exists
        if (category.image) {
          deleteFileIfExists(category.image);
        }

        await Category.findByIdAndDelete(id);
        sendResponse(res, 200, { message: 'Category deleted successfully' });
      } catch (error) {
        console.error('Error in deleteCategory:', error);
        throw new Error('Internal server error');
      }
    });
  };

  downloadCategoryCatalog = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'downloadCategoryCatalog', 'public', async () => {
      try {
        const id = req.params.id;

        // Validate category ID
        if (!validateObjectId(id)) {
          sendErrorResponse(res, 400, 'Invalid category ID format');
          return;
        }

        logControllerAction(req, 'downloadCategoryCatalog', {
          categoryId: id,
          action: 'Generating PDF catalog',
        });

        // Get category
        const category = await Category.findById(id).lean();
        if (!category) {
          sendErrorResponse(res, 404, 'Category not found');
          return;
        }

        if (!category.status) {
          sendErrorResponse(res, 404, 'Category is not active');
          return;
        }

        // Get all active products for this category
        const products = await Product.find({
          categories: id,
          status: true,
        })
          .sort({ sortOrder: 1, productModel: 1 })
          .lean();

        if (products.length === 0) {
          sendErrorResponse(res, 404, 'No products found in this category');
          return;
        }

        // Transform products for PDF generation
        const productsForCatalog = products.map(product => ({
          productModel: product.productModel,
          stitches: product.stitches,
          dimensions: product.dimensions,
          colourNeedles: product.colourNeedles,
          image: product.image,
          additionalImages: product.additionalImages || [],
        }));

        // Generate PDF
        const pdfBuffer = await generateCategoryPDFCatalog({
          categoryName: category.name,
          products: productsForCatalog,
        });

        // Generate sanitized filename
        const sanitizedCategoryName = category.name
          .replace(/[^a-zA-Z0-9\s-]/g, '')
          .replace(/\s+/g, '_')
          .toLowerCase();
        const timestamp = Date.now();
        const filename = `${sanitizedCategoryName}_catalog_${timestamp}.pdf`;

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Send PDF buffer
        res.send(pdfBuffer);

        logControllerAction(req, 'downloadCategoryCatalog', {
          categoryId: id,
          categoryName: category.name,
          productCount: products.length,
          filename,
          fileSize: pdfBuffer.length,
        });
      } catch (error) {
        console.error('❌ Error in downloadCategoryCatalog:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        sendErrorResponse(res, 500, 'Failed to generate PDF catalog', errorMessage);
      }
    });
  };

  /**
   * Private helper method to build category-specific filters
   */
  private buildCategoryFilters(req: Request): Record<string, unknown> {
    const filters: Record<string, unknown> = {};

    // Enhanced category-specific filters
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      const escapedSearch = escapeRegex(searchTerm);
      filters.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    if (req.query.status !== undefined) {
      filters.status = req.query.status === 'true';
    }

    // Default status filter for public access
    if (!req.admin) {
      filters.status = true;
    }

    return filters;
  }

  /**
   * Private helper method to format category with product count
   */
  private formatCategoryWithCount = async (category: ICategory) => {
    const productCount = await Product.countDocuments({
      categories: category._id,
      status: true,
    });

    return {
      ...formatCategoryResponse(category),
      productCount,
    };
  };

  private validateCategoryData(
    data: any,
    isUpdate = false
  ): { statusCode: number; message: string } | null {
    // For updates, only validate fields that are provided
    if (isUpdate) {
      if (
        data.name !== undefined &&
        (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0)
      ) {
        return { statusCode: 400, message: 'Category name must be a non-empty string' };
      }
      if (
        data.description !== undefined &&
        data.description &&
        typeof data.description !== 'string'
      ) {
        return { statusCode: 400, message: 'Description must be a string' };
      }
    } else {
      // For creation, name is required
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        return {
          statusCode: 400,
          message: 'Category name is required and must be a non-empty string',
        };
      }
      if (data.description && typeof data.description !== 'string') {
        return { statusCode: 400, message: 'Description must be a string' };
      }
    }

    return null;
  }
}

// Create controller instance
const categoryController = new CategoryController();

// Export all controller methods
export const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  downloadCategoryCatalog,
} = categoryController;

// Export default for backward compatibility
export default {
  // Public methods
  getAllCategories,
  getCategoryById,
  downloadCategoryCatalog,

  // Admin methods
  createCategory,
  updateCategory,
  deleteCategory,
};
