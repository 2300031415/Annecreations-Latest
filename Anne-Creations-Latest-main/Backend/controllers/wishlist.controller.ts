import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Product from '../models/product.model';
import Wishlist from '../models/wishlist.model';
import { IProduct } from '../types/models/index';
import { BaseController } from '../utils/baseController';
import { logControllerAction } from '../utils/controllerUtils';
import { formatWishlistResponse } from '../utils/responseFormatter';

class WishlistController extends BaseController {
  constructor() {
    super('Wishlist');
  }

  getWishlist = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getWishlist', 'customer', async () => {
      const customerId = req.customer?.id;

      // Find or create wishlist
      let wishlist = await Wishlist.findOne({
        customerId: new mongoose.Types.ObjectId(customerId),
      });
      if (!wishlist) {
        wishlist = new Wishlist({ customerId: customerId, items: [] });
        await wishlist.save();
      }

      // Get product details
      const productIds = wishlist.items.map(item => item.product);
      const products = await Product.find({
        _id: { $in: productIds },
        status: true,
      })
        .populate('categories', 'name')
        .populate('options.option', 'name')
        .lean();

      // Format response using utility function
      const formattedProducts = products.map((product: IProduct) => {
        const wishlistItem = wishlist.items.find(
          item => item.product.toString() === product._id.toString()
        );

        return formatWishlistResponse(product, wishlistItem?.createdAt);
      });

      const response = {
        count: formattedProducts.length,
        products: formattedProducts,
      };

      res.status(200).json({
        success: true,
        data: response,
        message: 'Wishlist retrieved successfully',
      });
    });
  };

  addToWishlist = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'addToWishlist', 'customer', async () => {
      // Log the controller action
      logControllerAction(req, 'addToWishlist', { productId: req.body.productId });

      const customerId = req.customer?.id;
      const { productId } = req.body;

      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        res.status(400).json({
          success: false,
          message: 'Valid product ID is required',
        });
        return;
      }

      // Validate product exists
      const product = await Product.findOne({
        _id: new mongoose.Types.ObjectId(productId.toString()),
        status: true,
      }).lean();

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      // Find or create wishlist
      let wishlist = await Wishlist.findOne({
        customerId: new mongoose.Types.ObjectId(customerId),
      });
      if (!wishlist) {
        wishlist = new Wishlist({ customerId: customerId, items: [] });
      }

      // Check if product already in wishlist
      const exists = wishlist.items.some(item => item.product.toString() === productId);
      if (exists) {
        res.status(200).json({
          success: true,
          message: 'Product already in wishlist',
        });
        return;
      }

      console.log('exists', exists);
      console.log('wishlist', wishlist);

      console.log('productId', productId);
      // Add to wishlist
      wishlist.items.push({
        product: new mongoose.Types.ObjectId(productId),
      });

      await wishlist.save();

      const response = {
        message: 'Product added to wishlist successfully',
        wishlist: {
          id: wishlist._id,
          itemCount: wishlist.items.length,
        },
      };

      res.status(200).json({
        success: true,
        data: response,
        message: 'Product added to wishlist successfully',
      });
    });
  };

  removeFromWishlist = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'removeFromWishlist', 'customer', async () => {
      // Log the controller action
      logControllerAction(req, 'removeFromWishlist', { productId: req.params.productId });

      const customerId = req.customer?.id;
      const productId = req.params.productId;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid product ID',
        });
        return;
      }

      // Find wishlist
      const wishlist = await Wishlist.findOne({
        customerId: new mongoose.Types.ObjectId(customerId),
      });
      if (!wishlist) {
        res.status(404).json({
          success: false,
          message: 'Wishlist not found',
        });
        return;
      }

      // Remove product from wishlist
      const initialLength = wishlist.items.length;
      wishlist.items = wishlist.items.filter(item => item.product.toString() !== productId);

      if (wishlist.items.length === initialLength) {
        res.status(404).json({
          success: false,
          message: 'Product not found in wishlist',
        });
        return;
      }

      await wishlist.save();

      const response = {
        message: 'Product removed from wishlist successfully',
        wishlist: {
          id: wishlist._id,
          itemCount: wishlist.items.length,
        },
      };

      res.status(200).json({
        success: true,
        data: response,
        message: 'Product removed from wishlist successfully',
      });
    });
  };
}

// Create controller instance
const wishlistController = new WishlistController();

// Export all controller methods
export const { getWishlist, addToWishlist, removeFromWishlist } = wishlistController;

// Export default for backward compatibility
export default {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
