import { createReadStream } from 'fs';
import path from 'path';

import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Order from '../models/order.model';
import Product from '../models/product.model';
import { IProductOption } from '../types/models/index';
import { BaseController } from '../utils/baseController';
class DownloadController extends BaseController {
  constructor() {
    super('Download');
  }

  downloadFile = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'downloadFile', 'customer', async () => {
      const customerId = req.customer?.id;
      const productId = req.params.productId;
      const optionId = req.params.optionId;

      // Validate ObjectIds
      if (
        !mongoose.Types.ObjectId.isValid(productId) ||
        !mongoose.Types.ObjectId.isValid(optionId)
      ) {
        res.status(400).json({
          success: false,
          message: 'Invalid product or option ID',
        });
        return;
      }

      // Check if customer has purchased this product
      const hasPurchased = await this.verifyCustomerPurchase(customerId || '', productId, optionId);

      if (!hasPurchased) {
        res.status(403).json({
          success: false,
          message: 'You must purchase this product to download files',
        });
        return;
      }

      // Find the product and option
      const product = await Product.findById(productId).populate('options.option', 'name').lean();

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      // Find the specific option
      const productOption = product.options?.find(
        (option: IProductOption) => option.option._id.toString() === optionId
      );

      if (!productOption || !productOption.uploadedFilePath) {
        res.status(404).json({
          success: false,
          message: 'No downloadable file found for this option',
        });
        return;
      }

      const filePath = productOption.uploadedFilePath;
      const fileName = path.basename(filePath);
      console.log(filePath);
      console.log(fileName);

      const fullFilePath = path.join(process.cwd(), filePath);

      // Check if file exists
      const fs = await import('fs');
      if (!fs.existsSync(fullFilePath)) {
        res.status(404).json({
          success: false,
          message: 'File not found on server',
        });
        return;
      }

      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', (productOption as any).mimeType || 'application/octet-stream');

      // Add file size header if available
      if ((productOption as any).fileSize) {
        res.setHeader('Content-Length', (productOption as any).fileSize);
      }

      // Increment download count
      await Product.updateOne(
        { _id: productId, 'options.option': optionId },
        { $inc: { 'options.$.downloadCount': 1 } }
      );

      // Create read stream and pipe to response
      const fileStream = createReadStream(fullFilePath);
      fileStream.pipe(res);

      // Handle stream errors
      fileStream.on('error', error => {
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error reading file',
          });
        }
      });
    });
  };

  /**
   * Private method to verify customer purchase for download access
   */
  private async verifyCustomerPurchase(customerId: string, productId: string, optionId: string) {
    try {
      // Validate ObjectIds
      if (
        !mongoose.Types.ObjectId.isValid(customerId) ||
        !mongoose.Types.ObjectId.isValid(productId) ||
        !mongoose.Types.ObjectId.isValid(optionId)
      ) {
        return false;
      }

      // Check if customer has paid orders containing this product
      const order = await Order.findOne({
        customer: new mongoose.Types.ObjectId(customerId),
        orderStatus: 'paid',
        'products.product': new mongoose.Types.ObjectId(productId),
        'products.options.option': new mongoose.Types.ObjectId(optionId),
      }).lean();

      return !!order;
    } catch (error) {
      return false;
    }
  }
}

// Create controller instance
const downloadController = new DownloadController();

// Export all controller methods
export const { downloadFile } = downloadController;

// Export default for backward compatibility
export default {
  downloadFile,
};
