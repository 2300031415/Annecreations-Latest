import { Request, Response } from 'express';

import Popup from '../models/popup.model';
import { IPopupButton } from '../types/models/popup';
import { BaseController } from '../utils/baseController';
import {
  logControllerAction,
  sendErrorResponse,
  sendResponse,
  validateObjectId,
} from '../utils/controllerUtils';
import { deleteFileIfExists, saveFileToDisk } from '../utils/fileUtils';
import { formatPopupResponse } from '../utils/responseFormatter';

const publicPath = 'catalog/popups';

class PopupController extends BaseController {
  constructor() {
    super('Popup');
  }

  /**
   * Get active popup (Public - for frontend display)
   * GET /api/popups/active
   */
  getActivePopup = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getActivePopup', 'public', async () => {
      try {
        // Get device type from query parameter or user agent
        const deviceType =
          (req.query.deviceType as string) ||
          (req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop');

        logControllerAction(req, 'getActivePopup', {
          action: 'Fetching active popup',
          deviceType,
        });

        const popup = await Popup.getActivePopup(deviceType);

        if (!popup) {
          sendResponse(res, 200, {
            data: null,
            message: 'No active popup available',
          });
          return;
        }

        sendResponse(res, 200, {
          data: formatPopupResponse(popup, true), // true for public API
        });
      } catch (error) {
        console.error('❌ Error in getActivePopup:', error);
        sendErrorResponse(res, 500, 'Failed to fetch active popup');
      }
    });
  };

  /**
   * Get all popups (Admin)
   * GET /api/popups
   */
  getAllPopups = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getAllPopups', 'admin', async () => {
      try {
        logControllerAction(req, 'getAllPopups', { action: 'Fetching all popups' });

        const popups = await Popup.find().sort({ sortOrder: 1, createdAt: -1 }).lean();

        // Format popups for admin response
        const formattedPopups = popups.map(popup => formatPopupResponse(popup, false)); // false for admin API

        sendResponse(res, 200, {
          data: formattedPopups,
          count: formattedPopups.length,
        });
      } catch (error) {
        console.error('❌ Error in getAllPopups:', error);
        sendErrorResponse(res, 500, 'Failed to fetch popups');
      }
    });
  };

  /**
   * Get popup by ID (Admin)
   * GET /api/popups/:id
   */
  getPopupById = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getPopupById', 'admin', async () => {
      try {
        const id = req.params.id;

        if (!validateObjectId(id)) {
          sendErrorResponse(res, 400, 'Invalid popup ID format');
          return;
        }

        logControllerAction(req, 'getPopupById', { popupId: id });

        const popup = await Popup.findById(id).lean();

        if (!popup) {
          sendErrorResponse(res, 404, 'Popup not found');
          return;
        }

        sendResponse(res, 200, {
          data: formatPopupResponse(popup, false), // false for admin API
        });
      } catch (error) {
        console.error('❌ Error in getPopupById:', error);
        sendErrorResponse(res, 500, 'Failed to fetch popup');
      }
    });
  };

  /**
   * Create new popup (Admin)
   * POST /api/popups
   */
  createPopup = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'createPopup', 'admin', async () => {
      try {
        logControllerAction(req, 'createPopup', { action: 'Creating new popup' });

        const { title, content, displayFrequency, sortOrder, status, deviceType } = req.body;

        // Validate required fields
        if (!title || !content) {
          sendErrorResponse(res, 400, 'Title and content are required');
          return;
        }

        // Handle image upload if present
        let imagePath: string | undefined;
        if (req.file) {
          imagePath = saveFileToDisk(req.file, publicPath);
        }

        // Parse buttons if provided
        let buttons: IPopupButton[] = [];
        if (req.body.buttons) {
          try {
            buttons = JSON.parse(req.body.buttons);
          } catch {
            sendErrorResponse(res, 400, 'Invalid buttons format');
            return;
          }
        }

        // Create popup data
        const popupData = {
          title: title.trim(),
          content: content.trim(),
          image: imagePath,
          buttons,
          displayFrequency: displayFrequency || 'once',
          sortOrder: sortOrder ? parseInt(sortOrder) : 0,
          status: status === 'true' || status === true,
          deviceType: deviceType || 'all',
        };

        const popup = new Popup(popupData);
        await popup.save();

        logControllerAction(req, 'createPopup', {
          popupId: popup._id,
          title: popup.title,
          status: popup.status,
        });

        sendResponse(res, 201, {
          data: formatPopupResponse(popup.toObject(), false), // false for admin API
          message: 'Popup created successfully',
        });
      } catch (error) {
        console.error('❌ Error in createPopup:', error);
        sendErrorResponse(
          res,
          500,
          'Failed to create popup',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });
  };

  /**
   * Update popup (Admin)
   * PATCH /api/popups/:id
   */
  updatePopup = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'updatePopup', 'admin', async () => {
      try {
        const id = req.params.id;

        if (!validateObjectId(id)) {
          sendErrorResponse(res, 400, 'Invalid popup ID format');
          return;
        }

        logControllerAction(req, 'updatePopup', { popupId: id });

        const popup = await Popup.findById(id);

        if (!popup) {
          sendErrorResponse(res, 404, 'Popup not found');
          return;
        }

        const { title, content, displayFrequency, sortOrder, status, deviceType } = req.body;

        // Update fields if provided
        if (title !== undefined) popup.title = title.trim();
        if (content !== undefined) popup.content = content.trim();
        if (displayFrequency !== undefined) popup.displayFrequency = displayFrequency;
        if (sortOrder !== undefined) popup.sortOrder = parseInt(sortOrder);
        if (status !== undefined) popup.status = status === 'true' || status === true;
        if (deviceType !== undefined) popup.deviceType = deviceType;

        // Handle image upload
        if (req.file) {
          // Delete old image if exists
          if (popup.image) {
            deleteFileIfExists(popup.image);
          }
          popup.image = saveFileToDisk(req.file, publicPath);
        }

        // Parse buttons if provided
        if (req.body.buttons) {
          try {
            popup.buttons = JSON.parse(req.body.buttons);
          } catch {
            sendErrorResponse(res, 400, 'Invalid buttons format');
            return;
          }
        }

        await popup.save();

        logControllerAction(req, 'updatePopup', {
          popupId: popup._id,
          title: popup.title,
          status: popup.status,
        });

        sendResponse(res, 200, {
          data: formatPopupResponse(popup.toObject(), false), // false for admin API
          message: 'Popup updated successfully',
        });
      } catch (error) {
        console.error('❌ Error in updatePopup:', error);
        sendErrorResponse(
          res,
          500,
          'Failed to update popup',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });
  };

  /**
   * Delete popup (Admin)
   * DELETE /api/popups/:id
   */
  deletePopup = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'deletePopup', 'admin', async () => {
      try {
        const id = req.params.id;

        if (!validateObjectId(id)) {
          sendErrorResponse(res, 400, 'Invalid popup ID format');
          return;
        }

        const popup = await Popup.findById(id).lean();

        if (!popup) {
          sendErrorResponse(res, 404, 'Popup not found');
          return;
        }

        // Delete image if exists
        if (popup.image) {
          deleteFileIfExists(popup.image);
        }

        await Popup.findByIdAndDelete(id);

        logControllerAction(req, 'deletePopup', {
          popupId: popup._id,
          title: popup.title,
        });

        sendResponse(res, 200, {
          message: 'Popup deleted successfully',
          _id: popup._id,
          title: popup.title,
        });
      } catch (error) {
        console.error('❌ Error in deletePopup:', error);
        sendErrorResponse(
          res,
          500,
          'Failed to delete popup',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });
  };

  /**
   * Toggle popup status (Admin)
   * PATCH /api/popups/:id/toggle-status
   */
  togglePopupStatus = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'togglePopupStatus', 'admin', async () => {
      try {
        const id = req.params.id;

        if (!validateObjectId(id)) {
          sendErrorResponse(res, 400, 'Invalid popup ID format');
          return;
        }

        const popup = await Popup.findById(id);

        if (!popup) {
          sendErrorResponse(res, 404, 'Popup not found');
          return;
        }

        // Toggle status
        popup.status = !popup.status;
        await popup.save();

        logControllerAction(req, 'togglePopupStatus', {
          popupId: popup._id,
          newStatus: popup.status,
        });

        sendResponse(res, 200, {
          data: formatPopupResponse(popup.toObject(), false), // false for admin API
          message: `Popup ${popup.status ? 'activated' : 'deactivated'} successfully`,
        });
      } catch (error) {
        console.error('❌ Error in togglePopupStatus:', error);
        sendErrorResponse(
          res,
          500,
          'Failed to toggle popup status',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });
  };

  /**
   * Delete popup image (Admin)
   * DELETE /api/popups/:id/image
   */
  deletePopupImage = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'deletePopupImage', 'admin', async () => {
      try {
        const id = req.params.id;

        if (!validateObjectId(id)) {
          sendErrorResponse(res, 400, 'Invalid popup ID format');
          return;
        }

        const popup = await Popup.findById(id);

        if (!popup) {
          sendErrorResponse(res, 404, 'Popup not found');
          return;
        }

        if (!popup.image) {
          sendErrorResponse(res, 400, 'Popup has no image');
          return;
        }

        // Delete image file
        deleteFileIfExists(popup.image);
        popup.image = undefined;

        await popup.save();

        logControllerAction(req, 'deletePopupImage', {
          popupId: popup._id,
        });

        sendResponse(res, 200, {
          data: formatPopupResponse(popup.toObject(), false), // false for admin API
          message: 'Popup image deleted successfully',
        });
      } catch (error) {
        console.error('❌ Error in deletePopupImage:', error);
        sendErrorResponse(
          res,
          500,
          'Failed to delete popup image',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });
  };
}

export default new PopupController();
