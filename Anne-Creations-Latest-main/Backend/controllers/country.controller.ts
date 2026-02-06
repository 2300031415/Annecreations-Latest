import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Country from '../models/country.model';
import auditLogService from '../utils/auditLogService';
import { BaseController } from '../utils/baseController';
import { sendErrorResponse, sendResponse, escapeRegex } from '../utils/controllerUtils';
import { formatCountryResponse } from '../utils/responseFormatter';

class CountryController extends BaseController {
  constructor() {
    super('Country');
  }

  getAllCountries = async (req: Request, res: Response) => {
    await this.getResourcesUnpaginated(req, res, Country, 'getAllCountries', 'public', {
      filters: this.buildCountryFilters(req),
      responseFields: formatCountryResponse,
      sort: { name: 1 }, // Sort alphabetically A-Z
    });
  };

  getCountryById = async (req: Request, res: Response) => {
    await this.getResourceById(req, res, Country, 'getCountryById', 'public', {
      responseFields: formatCountryResponse,
    });
  };

  createCountry = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'createCountry', 'admin', async () => {
      try {
        // Validate required fields
        if (!req.body.name) {
          sendErrorResponse(res, 400, 'Country name is required');
          return;
        }
        if (!req.body.isoCode2) {
          sendErrorResponse(res, 400, 'ISO code 2 is required');
          return;
        }

        // Apply defaults and formatting
        const countryData = {
          ...req.body,
          addressFormat: req.body.addressFormat || '',
          postcodeRequired: req.body.postcodeRequired || false,
          status: req.body.status !== undefined ? req.body.status : true,
        };

        const country = new Country(countryData);
        await country.save();

        // Log the creation
        auditLogService.logCreate(req, 'Country', {
          ...country.toObject(),
          _id: country._id.toString(),
        });

        const response = formatCountryResponse(country);
        sendResponse(res, 201, response);
      } catch (error) {
        console.error('Error in createCountry:', error);
        throw new Error('Internal server error');
      }
    });
  };

  updateCountry = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'updateCountry', 'admin', async () => {
      try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          sendErrorResponse(res, 400, 'Invalid ID format');
          return;
        }

        // Get existing country for audit logging
        const existingCountry = await Country.findById(id);
        if (!existingCountry) {
          sendErrorResponse(res, 404, 'Country not found');
          return;
        }

        const updatedCountry = await Country.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        });

        if (!updatedCountry) {
          sendErrorResponse(res, 404, 'Country not found');
          return;
        }

        // Log the update
        auditLogService.logUpdate(
          req,
          'Country',
          existingCountry.toObject() as unknown as Record<string, unknown>,
          {
            ...updatedCountry.toObject(),
            _id: updatedCountry._id.toString(),
          }
        );

        const response = formatCountryResponse(updatedCountry);
        sendResponse(res, 200, response);
      } catch (error) {
        console.error('Error in updateCountry:', error);
        throw new Error('Internal server error');
      }
    });
  };

  deleteCountry = async (req: Request, res: Response) => {
    await this.deleteResource(req, res, Country, 'deleteCountry', 'admin', {
      beforeDelete: async country => {
        // Log the deletion
        auditLogService.logDelete(req, 'Country', {
          ...country.toObject(),
          _id: country._id.toString(),
        });
      },
    });
  };

  /**
   * Private helper method to build country-specific filters
   */
  private buildCountryFilters(req: Request): Record<string, any> {
    const filters: Record<string, any> = {};

    // Enhanced country-specific filters
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      const escapedSearch = escapeRegex(searchTerm);
      filters.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { isoCode2: { $regex: escapedSearch, $options: 'i' } },
        { isoCode3: { $regex: escapedSearch, $options: 'i' } },
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
}

// Create controller instance
const countryController = new CountryController();

// Export all controller methods
export const { getAllCountries, getCountryById, createCountry, updateCountry, deleteCountry } =
  countryController;

// Export default for backward compatibility
export default {
  // Public methods
  getAllCountries,
  getCountryById,

  // Admin methods
  createCountry,
  updateCountry,
  deleteCountry,
};
