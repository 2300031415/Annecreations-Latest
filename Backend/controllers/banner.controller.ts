import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Banner from '../models/banner.model';
import { BaseController } from '../utils/baseController';
import {
  sendErrorResponse,
  sendResponse,
  validateObjectId,
  logControllerAction,
} from '../utils/controllerUtils';
import { deleteFileIfExists, saveFileToDisk } from '../utils/fileUtils';
import { formatBannerResponse } from '../utils/responseFormatter';

const publicPath = 'catalog/banners';

class BannerController extends BaseController {
  constructor() {
    super('Banner');
  }

  /**
   * Get all banners (Public - only active banners)
   */
  getAllBanners = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getAllBanners', 'public', async () => {
      try {
        logControllerAction(req, 'getAllBanners', { action: 'Fetching public banners' });

        // Get banners with active images
        const banners = await Banner.find({
          'images.status': true,
        })
          .sort({ sortOrder: 1 })
          .lean();

        // Format banners for public response
        const formattedBanners = banners
          .map(banner => formatBannerResponse(banner, true))
          .filter((banner: { images: string[] }) => banner.images.length > 0);

        sendResponse(res, 200, {
          data: formattedBanners,
          count: formattedBanners.length,
        });
      } catch (error) {
        console.error('❌ Error in getAllBanners:', error);
        throw new Error('Internal server error');
      }
    });
  };

  /**
   * Get all banners with admin access (includes inactive)
   */
  getAllBannersAdmin = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getAllBannersAdmin', 'admin', async () => {
      try {
        logControllerAction(req, 'getAllBannersAdmin', { action: 'Fetching all banners (admin)' });

        const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 }).lean();

        // Format banners for admin response (includes all images with status)
        const formattedBanners = banners.map(banner => formatBannerResponse(banner, false));

        sendResponse(res, 200, {
          data: formattedBanners,
          count: formattedBanners.length,
        });
      } catch (error) {
        console.error('❌ Error in getAllBannersAdmin:', error);
        throw new Error('Internal server error');
      }
    });
  };

  /**
   * Get banner by ID
   */
  getBannerById = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getBannerById', 'admin', async () => {
      try {
        const id = req.params.id;

        if (!validateObjectId(id)) {
          sendErrorResponse(res, 400, 'Invalid banner ID format');
          return;
        }

        logControllerAction(req, 'getBannerById', { bannerId: id });

        const banner = await Banner.findById(id).lean();

        if (!banner) {
          sendErrorResponse(res, 404, 'Banner not found');
          return;
        }

        // Format banner for admin response
        const formattedBanner = formatBannerResponse(banner, false);
        sendResponse(res, 200, formattedBanner);
      } catch (error) {
        console.error('❌ Error in getBannerById:', error);
        throw new Error('Internal server error');
      }
    });
  };

  /**
   * Create banner with images
   */
  createBanner = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'createBanner', 'admin', async () => {
      try {
        // Validate required fields
        if (!req.body.title || req.body.title.trim().length === 0) {
          sendErrorResponse(res, 400, 'Title is required');
          return;
        }

        // Handle file uploads
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const images: Array<{ image: string; status: boolean }> = [];
        const deviceType = req.body.deviceType;

        if (!deviceType || !['mobile', 'web'].includes(deviceType)) {
          sendErrorResponse(res, 400, 'deviceType is required and must be "mobile" or "web"');
          return;
        }

        if (files) {
          // Process images based on deviceType
          const fieldName = deviceType === 'mobile' ? 'mobileImages' : 'webImages';
          if (files[fieldName]) {
            for (const file of files[fieldName]) {
              const imagePath = saveFileToDisk(file, `${publicPath}/${deviceType}`);
              images.push({
                image: imagePath,
                status: true, // New images are active by default
              });
            }
          }
        }

        // Create banner
        const bannerData = {
          title: req.body.title.trim(),
          description: req.body.description?.trim(),
          deviceType,
          images,
          sortOrder: req.body.sortOrder ? parseInt(req.body.sortOrder) : 0,
        };

        const banner = new Banner(bannerData);
        await banner.save();

        logControllerAction(req, 'createBanner', {
          bannerId: banner._id,
          title: banner.title,
        });

        // Format banner for response
        const formattedBanner = formatBannerResponse(banner.toObject(), false);
        sendResponse(res, 201, formattedBanner);
      } catch (error) {
        console.error('Error in createBanner:', error);
        throw new Error('Internal server error');
      }
    });
  };

  /**
   * Delete banner
   */
  deleteBanner = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'deleteBanner', 'admin', async () => {
      try {
        const id = req.params.id;

        if (!validateObjectId(id)) {
          sendErrorResponse(res, 400, 'Invalid banner ID format');
          return;
        }

        const banner = await Banner.findById(id);
        if (!banner) {
          sendErrorResponse(res, 404, 'Banner not found');
          return;
        }

        // Delete all associated images from filesystem
        const imagesToDelete = (banner.images || []).map(img => img.image);

        for (const imagePath of imagesToDelete) {
          deleteFileIfExists(imagePath);
        }

        await Banner.findByIdAndDelete(id);

        logControllerAction(req, 'deleteBanner', {
          bannerId: banner._id,
          title: banner.title,
        });

        sendResponse(res, 200, {
          message: 'Banner deleted successfully',
          _id: banner._id,
          title: banner.title,
        });
      } catch (error) {
        console.error('❌ Error in deleteBanner:', error);
        throw new Error('Internal server error');
      }
    });
  };

  /**
   * Delete specific images from a banner
   */
  deleteImages = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'deleteImages', 'admin', async () => {
      try {
        const id = req.params.id;
        const { imagePaths } = req.body;

        if (!validateObjectId(id)) {
          sendErrorResponse(res, 400, 'Invalid banner ID format');
          return;
        }

        if (!imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
          sendErrorResponse(res, 400, 'imagePaths must be a non-empty array');
          return;
        }

        const banner = await Banner.findById(id);
        if (!banner) {
          sendErrorResponse(res, 404, 'Banner not found');
          return;
        }

        // Delete specified images from filesystem
        for (const imagePath of imagePaths) {
          const imgObj = banner.images.find(
            (img: { image: string; status: boolean }) => img.image === imagePath
          );
          if (imgObj) {
            deleteFileIfExists(imagePath);
          }
        }

        // Remove from array
        banner.images = banner.images.filter(
          (img: { image: string; status: boolean }) => !imagePaths.includes(img.image)
        );

        await banner.save();

        logControllerAction(req, 'deleteImages', {
          bannerId: banner._id,
          deletedCount: imagePaths.length,
        });

        // Format banner for response
        const formattedBanner = formatBannerResponse(banner.toObject(), false);

        sendResponse(res, 200, {
          message: 'Images deleted successfully',
          banner: formattedBanner,
        });
      } catch (error) {
        console.error('❌ Error in deleteImages:', error);
        throw new Error('Internal server error');
      }
    });
  };

  /**
   * Update image status (activate/deactivate specific images)
   */
  updateImageStatus = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'updateImageStatus', 'admin', async () => {
      try {
        const id = req.params.id;
        const { imageId, status } = req.body;

        if (!validateObjectId(id)) {
          sendErrorResponse(res, 400, 'Invalid banner ID format');
          return;
        }

        if (!imageId) {
          sendErrorResponse(res, 400, 'imageId is required');
          return;
        }

        if (typeof status !== 'boolean') {
          sendErrorResponse(res, 400, 'status must be a boolean');
          return;
        }

        const banner = await Banner.findById(id);
        if (!banner) {
          sendErrorResponse(res, 404, 'Banner not found');
          return;
        }

        // Find and update the image status
        const imageIndex = banner.images.findIndex(
          (img: { _id?: mongoose.Types.ObjectId }) => img._id?.toString() === imageId
        );

        if (imageIndex === -1) {
          sendErrorResponse(res, 404, 'Image not found in banner');
          return;
        }

        banner.images[imageIndex].status = status;

        await banner.save();

        logControllerAction(req, 'updateImageStatus', {
          bannerId: banner._id,
          imageId,
          status,
        });

        // Format banner for response
        const formattedBanner = formatBannerResponse(banner.toObject(), false);

        sendResponse(res, 200, {
          message: 'Image status updated successfully',
          banner: formattedBanner,
        });
      } catch (error) {
        console.error('❌ Error in updateImageStatus:', error);
        throw new Error('Internal server error');
      }
    });
  };
}

// Create controller instance
const bannerController = new BannerController();

// Export all controller methods
export const {
  getAllBanners,
  getAllBannersAdmin,
  getBannerById,
  createBanner,
  deleteBanner,
  deleteImages,
  updateImageStatus,
} = bannerController;

// Export default for backward compatibility
export default {
  // Public methods
  getAllBanners,

  // Admin methods
  getAllBannersAdmin,
  getBannerById,
  createBanner,
  deleteBanner,
  deleteImages,
  updateImageStatus,
};
