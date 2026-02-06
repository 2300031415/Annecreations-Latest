import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Cart from '../models/cart.model';
import Order from '../models/order.model';
import Product from '../models/product.model';
import { IProductItem } from '../types/models/index';
import { BaseController } from '../utils/baseController';
import { sendErrorResponse } from '../utils/controllerUtils';
import { ValidationHelpers } from '../utils/validationHelpers';

class CartController extends BaseController {
  constructor() {
    super('Cart');
  }

  getCart = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getCart', 'customer', async () => {
      const customerId = req.customer?.id;

      // Get or create cart
      let cart = await Cart.findOne({ customerId: new mongoose.Types.ObjectId(customerId) })
        .populate('items.product', 'productModel sku image description')
        .populate('items.options.option', 'name')
        .lean();

      if (!cart) {
        // Create empty cart
        const newCart = new Cart({
          customerId: new mongoose.Types.ObjectId(customerId),
          items: [],
        });
        await newCart.save();
        cart = await Cart.findById(newCart._id)
          .populate('items.product', 'productModel sku image description')
          .populate('items.options.option', 'name')
          .lean();
      }

      // Format cart for response
      const formattedCart = {
        _id: cart?._id.toString(),
        customerId: cart?.customerId,
        items: cart?.items?.map((item: IProductItem) => ({
          _id: item._id?.toString() || item.product.toString(),
          product: {
            ...(item.product as any),
            image: (item.product as any)?.image
              ? `image/${(item.product as any).image}`
              : (item.product as any)?.image,
          },
          options: item.options?.map((option: any) => ({
            option: option.option,
            price: option.price,
          })),
          subtotal: item.subtotal,
        })),
        itemCount: cart?.items?.length || 0,
        subtotal:
          cart?.items?.reduce((sum: number, item: IProductItem) => sum + item.subtotal, 0) || 0,
        createdAt: cart?.createdAt,
        updatedAt: cart?.updatedAt,
      };

      return res.status(200).json(formattedCart);
    });
  };

  addToCart = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'addToCart', 'customer', async () => {
      const customerId = req.customer?.id;
      const { productId, options = [] } = req.body;
      // Note: No quantity handling for digital products - each product option is unique

      if (!productId || !ValidationHelpers.isValidObjectId(productId)) {
        return sendErrorResponse(res, 400, 'Valid product ID is required');
      }

      if (options && options.length === 0) {
        return sendErrorResponse(res, 400, 'Options are required');
      }

      // Check if product exists and is active
      const product = await Product.findById(productId).populate('options.option', 'name');
      if (!product) {
        return sendErrorResponse(res, 404, 'Product not found');
      }

      if (!product.status) {
        return sendErrorResponse(res, 400, 'Product is not available');
      }

      // Check if customer has already purchased any of these options
      // This prevents users from adding already-purchased digital products to cart
      const purchasedOptionsAgg = await Order.aggregate([
        {
          $match: {
            customer: new mongoose.Types.ObjectId(customerId),
            orderStatus: 'paid',
            'products.product': new mongoose.Types.ObjectId(productId),
          },
        },
        {
          $unwind: '$products',
        },
        {
          $match: {
            'products.product': new mongoose.Types.ObjectId(productId),
          },
        },
        {
          $unwind: '$products.options',
        },
        {
          $group: {
            _id: null,
            purchasedOptions: { $addToSet: '$products.options.option' },
          },
        },
      ]);

      if (purchasedOptionsAgg.length > 0) {
        const purchasedOptions = new Set<string>(
          purchasedOptionsAgg[0].purchasedOptions.map((opt: any) => opt.toString())
        );

        // Get the option reference IDs for the requested options
        const requestedProductOptions = product.options.filter((option: any) =>
          options.map(String).includes(option._id.toString())
        );

        const requestedOptionIds = requestedProductOptions.map(
          (option: any) => option.option._id?.toString() || option.option.toString()
        );

        // Check if any of the requested options have already been purchased
        const duplicateOptions = requestedOptionIds.filter((optionId: string) =>
          purchasedOptions.has(optionId)
        );

        if (duplicateOptions.length > 0) {
          return sendErrorResponse(
            res,
            409,
            'You have already purchased some of these product options. Please check your orders or downloads.'
          );
        }
      }

      // Get or create cart
      let cart = await Cart.findOne({ customerId: new mongoose.Types.ObjectId(customerId) });

      if (!cart) {
        cart = new Cart({
          customerId: new mongoose.Types.ObjectId(customerId),
          items: [],
        });
      }

      // Check if product already exists in cart
      const existingItemIndex = cart.items?.findIndex(
        (item: IProductItem) => item.product.toString() === productId
      );

      if (existingItemIndex !== -1 && existingItemIndex !== undefined) {
        // Silently merge options - if option already exists in cart, just merge them (removes duplicates automatically)
        const existingOptionIds = cart.items[existingItemIndex].options.map((option: any) =>
          option._id.toString()
        );

        // Merge all options (Set automatically removes duplicates)
        const allOptionsIds = Array.from(new Set([...existingOptionIds, ...options.map(String)]));

        cart.items[existingItemIndex].options = product.options.filter((item: any) =>
          allOptionsIds.includes(item._id.toString())
        );

        // Recalculate subtotal
        cart.items[existingItemIndex].subtotal = cart.items[existingItemIndex].options.reduce(
          (sum: number, option: any) => sum + option.price,
          0
        );
      } else {
        // Add new item to cart
        const cartOptions = product.options.filter((item: any) =>
          options.map(String).includes(item._id.toString())
        );

        const subtotal = cartOptions.reduce((sum: number, option: any) => sum + option.price, 0);

        cart.items?.push({
          _id: new mongoose.Types.ObjectId(),
          product: new mongoose.Types.ObjectId(productId),
          options: cartOptions,
          subtotal,
        });
      }

      const savedCart = await cart.save();

      const response = {
        message: 'Item added to cart successfully',
        cart: {
          id: savedCart._id,
          itemCount: savedCart.items?.length || 0,
          subtotal:
            savedCart.items?.reduce((sum: number, item: IProductItem) => sum + item.subtotal, 0) ||
            0,
        },
      };

      return res.status(200).json(response);
    });
  };

  updateCart = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'updateCart', 'customer', async () => {
      const customerId = req.customer?.id;
      const itemId = req.params.itemId;
      const { options } = req.body;

      if (!ValidationHelpers.isValidObjectId(itemId)) {
        return sendErrorResponse(res, 400, 'Invalid item ID');
      }

      const cart = await Cart.findOne({ customerId: new mongoose.Types.ObjectId(customerId) });

      if (!cart) {
        return sendErrorResponse(res, 404, 'Cart not found');
      }

      const itemIndex = cart.items?.findIndex(
        (item: IProductItem) => item.product?.toString() === itemId
      );

      if (itemIndex === -1 || itemIndex === undefined) {
        return sendErrorResponse(res, 404, 'Cart item not found');
      }

      const productId = cart.items[itemIndex].product;
      // Check if product exists and is active
      const product = await Product.findById(productId);
      if (!product) {
        return sendErrorResponse(res, 404, 'Product not found');
      }

      if (!product.status) {
        return sendErrorResponse(res, 400, 'Product is not available');
      }

      // Check if customer has already purchased any of these options
      // This prevents users from updating cart to include already-purchased digital products
      if (options && Array.isArray(options)) {
        const purchasedOptionsAgg = await Order.aggregate([
          {
            $match: {
              customer: new mongoose.Types.ObjectId(customerId),
              orderStatus: 'paid',
              'products.product': new mongoose.Types.ObjectId(productId.toString()),
            },
          },
          {
            $unwind: '$products',
          },
          {
            $match: {
              'products.product': new mongoose.Types.ObjectId(productId.toString()),
            },
          },
          {
            $unwind: '$products.options',
          },
          {
            $group: {
              _id: null,
              purchasedOptions: { $addToSet: '$products.options.option' },
            },
          },
        ]);

        if (purchasedOptionsAgg.length > 0) {
          const purchasedOptions = new Set<string>(
            purchasedOptionsAgg[0].purchasedOptions.map((opt: any) => opt.toString())
          );

          // get the option reference from the product options
          const productOptionReferences = product.options.map((option: any) =>
            option.option.toString()
          );

          // Check if any of the requested options have already been purchased
          const duplicateOptions = productOptionReferences.filter((optionId: string) =>
            purchasedOptions.has(optionId)
          );

          if (duplicateOptions.length > 0) {
            return sendErrorResponse(
              res,
              409,
              'You have already purchased some of these product options. Please check your orders or downloads.'
            );
          }
        }
      }

      // Update item options
      if (options && Array.isArray(options)) {
        const cartOptions = product.options.filter((item: any) =>
          options.map(String).includes(item.option.toString())
        );

        cart.items[itemIndex].options = cartOptions;
        cart.items[itemIndex].subtotal = cartOptions.reduce(
          (sum: number, option: any) => sum + option.price,
          0
        );
      }

      const savedCart = await cart.save();

      const response = {
        message: 'Cart item updated successfully',
        cart: {
          id: savedCart._id,
          itemCount: savedCart.items?.length || 0,
          subtotal:
            savedCart.items?.reduce((sum: number, item: IProductItem) => sum + item.subtotal, 0) ||
            0,
        },
      };

      return res.status(200).json(response);
    });
  };

  removeFromCart = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'removeFromCart', 'customer', async () => {
      const customerId = req.customer?.id;
      const itemId = req.params.itemId;

      if (!ValidationHelpers.isValidObjectId(itemId)) {
        return sendErrorResponse(res, 400, 'Invalid item ID');
      }

      const cart = await Cart.findOne({ customerId: new mongoose.Types.ObjectId(customerId) });

      if (!cart) {
        return sendErrorResponse(res, 404, 'Cart not found');
      }

      const itemIndex = cart.items?.findIndex(
        (item: IProductItem) => item.product?.toString() === itemId
      );

      if (itemIndex === -1 || itemIndex === undefined) {
        return sendErrorResponse(res, 404, 'Cart item not found');
      }

      // Remove item
      cart.items.splice(itemIndex, 1);

      const savedCart = await cart.save();

      const response = {
        message: 'Item removed from cart successfully',
        cart: {
          id: savedCart._id,
          itemCount: savedCart.items?.length || 0,
          subtotal:
            savedCart.items?.reduce((sum: number, item: IProductItem) => sum + item.subtotal, 0) ||
            0,
        },
      };

      return res.status(200).json(response);
    });
  };

  clearCart = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'clearCart', 'customer', async () => {
      const customerId = req.customer?.id;

      const cart = await Cart.findOne({ customerId: new mongoose.Types.ObjectId(customerId) });

      if (!cart) {
        return res.status(200).json({ message: 'Cart is already empty' });
      }

      // Clear all items
      cart.items = [];
      await cart.save();

      const response = {
        message: 'Cart cleared successfully',
        cart: {
          id: cart._id,
          itemCount: 0,
          subtotal: 0,
        },
      };

      return res.status(200).json(response);
    });
  };
}

// Create controller instance
const cartController = new CartController();

// Export all controller methods
export const { getCart, addToCart, updateCart, removeFromCart, clearCart } = cartController;

// Export default for backward compatibility
export default {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
};
