import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Country from '../models/country.model';
import Zone from '../models/zone.model';
import auditLogService from '../utils/auditLogService';
import { BaseController } from '../utils/baseController';
import { sendErrorResponse, sendResponse, escapeRegex } from '../utils/controllerUtils';
import { formatZoneResponse } from '../utils/responseFormatter';

class ZoneController extends BaseController {
  constructor() {
    super('Zone');
  }

  getAllZones = async (req: Request, res: Response) => {
    await this.getResourcesUnpaginated(req, res, Zone, 'getAllZones', 'public', {
      filters: this.buildZoneFilters(req),
      populate: 'country',
      responseFields: formatZoneResponse,
      cacheDuration: 300, // 5 minutes cache
      sort: { name: 1 }, // Sort alphabetically A-Z
    });
  };

  getZonesByCountry = async (req: Request, res: Response) => {
    await this.getResourcesUnpaginated(req, res, Zone, 'getZonesByCountry', 'public', {
      filters: { country: new mongoose.Types.ObjectId(req.params.country_id) },
      populate: 'country',
      responseFields: formatZoneResponse,
      cacheDuration: 300,
      sort: { name: 1 }, // Sort alphabetically A-Z
    });
  };

  createZone = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'createZone', 'admin', async () => {
      try {
        // Validate required fields
        const validationError = this.validateZoneData(req.body);
        if (validationError) {
          sendErrorResponse(res, validationError.statusCode, validationError.message);
          return;
        }

        // Verify country exists
        const countryExists = await Country.findById(req.body.countryId);
        if (!countryExists) {
          sendErrorResponse(res, 404, 'Country not found');
          return;
        }

        // Transform data for Zone model
        const zoneData = {
          country: new mongoose.Types.ObjectId(req.body.countryId),
          name: req.body.name.trim(),
          code: req.body.code.trim().toUpperCase(),
          status: req.body.status !== undefined ? req.body.status : true,
        };

        const zone = new Zone(zoneData);
        await zone.save();

        // Log the creation
        auditLogService.logCreate(req, 'Zone', {
          ...zone.toObject(),
          _id: zone._id.toString(),
        });

        const response = formatZoneResponse(zone);
        sendResponse(res, 201, response);
      } catch (error) {
        console.error('Error in createZone:', error);
        throw new Error('Internal server error');
      }
    });
  };

  updateZone = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'updateZone', 'admin', async () => {
      try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          sendErrorResponse(res, 400, 'Invalid ID format');
          return;
        }

        // Get existing zone for audit logging
        const existingZone = await Zone.findById(id);
        if (!existingZone) {
          sendErrorResponse(res, 404, 'Zone not found');
          return;
        }

        // Validate update data
        const validationError = this.validateZoneData(req.body, true);
        if (validationError) {
          sendErrorResponse(res, validationError.statusCode, validationError.message);
          return;
        }

        // Transform data if countryId is provided
        let updateData = { ...req.body };
        if (req.body.countryId) {
          // Verify country exists
          const countryExists = await Country.findById(req.body.countryId);
          if (!countryExists) {
            sendErrorResponse(res, 404, 'Country not found');
            return;
          }

          updateData = {
            ...updateData,
            country: new mongoose.Types.ObjectId(req.body.countryId),
          };
        }

        // Clean up string fields
        if (updateData.name) updateData.name = updateData.name.trim();
        if (updateData.code) updateData.code = updateData.code.trim().toUpperCase();

        const updatedZone = await Zone.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        }).populate('country');

        // Log the update
        auditLogService.logUpdate(
          req,
          'Zone',
          existingZone.toObject() as unknown as Record<string, unknown>,
          {
            ...updatedZone!.toObject(),
            _id: updatedZone!._id.toString(),
          }
        );

        const response = formatZoneResponse(updatedZone!);
        sendResponse(res, 200, response);
      } catch (error) {
        console.error('Error in updateZone:', error);
        throw new Error('Internal server error');
      }
    });
  };

  deleteZone = async (req: Request, res: Response) => {
    await this.deleteResource(req, res, Zone, 'deleteZone', 'admin', {
      beforeDelete: async zone => {
        // Log the deletion
        auditLogService.logDelete(req, 'Zone', {
          ...zone.toObject(),
          _id: zone._id.toString(),
        });
      },
    });
  };

  private buildZoneFilters(req: Request): Record<string, unknown> {
    const filters: Record<string, unknown> = {};

    // Enhanced zone-specific filters
    if (req.query.countryId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.countryId as string)) {
        // Return empty filters to skip invalid country ID
        return {};
      }
      filters.country = new mongoose.Types.ObjectId(req.query.countryId as string);
    }

    if (req.query.search) {
      const searchTerm = req.query.search as string;
      const escapedSearch = escapeRegex(searchTerm);
      filters.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { code: { $regex: escapedSearch, $options: 'i' } },
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

  private validateZoneData(
    data: any,
    isUpdate = false
  ): { statusCode: number; message: string } | null {
    // For updates, only validate fields that are provided
    if (isUpdate) {
      if (data.countryId && !mongoose.Types.ObjectId.isValid(data.countryId)) {
        return { statusCode: 400, message: 'Invalid country ID' };
      }
      if (
        data.name !== undefined &&
        (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0)
      ) {
        return { statusCode: 400, message: 'Zone name must be a non-empty string' };
      }
      if (
        data.code !== undefined &&
        (!data.code || typeof data.code !== 'string' || data.code.trim().length === 0)
      ) {
        return { statusCode: 400, message: 'Zone code must be a non-empty string' };
      }
    } else {
      // For creation, all fields are required
      if (!data.countryId) {
        return { statusCode: 400, message: 'Country ID is required' };
      }
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        return { statusCode: 400, message: 'Zone name is required and must be a non-empty string' };
      }
      if (!data.code || typeof data.code !== 'string' || data.code.trim().length === 0) {
        return { statusCode: 400, message: 'Zone code is required and must be a non-empty string' };
      }
      if (!mongoose.Types.ObjectId.isValid(data.countryId)) {
        return { statusCode: 400, message: 'Invalid country ID' };
      }
    }

    return null;
  }
}

// Create controller instance
const zoneController = new ZoneController();

// Export all controller methods
export const { getAllZones, getZonesByCountry, createZone, updateZone, deleteZone } =
  zoneController;

// Export default for backward compatibility
export default {
  // Public methods
  getAllZones,
  getZonesByCountry,

  // Admin methods
  createZone,
  updateZone,
  deleteZone,
};
