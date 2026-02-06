import { Request, Response } from 'express';
import mongoose from 'mongoose';

import {
  logControllerAction,
  checkAuthorization,
  sanitizeData,
  sendResponse,
  sendErrorResponse,
  handleControllerError,
  getPaginationOptions,
  getSortOptions,
  buildQueryFilters,
  setCacheHeaders,
} from './controllerUtils';

/**
 * Base controller class to eliminate code duplication across controllers
 */
export abstract class BaseController {
  protected modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  /**
   * Standard authorization and logging wrapper
   */
  protected async withAuth<T>(
    req: Request,
    res: Response,
    action: string,
    role: 'admin' | 'customer' | 'public',
    handler: () => Promise<T>
  ): Promise<void> {
    try {
      logControllerAction(req, action);

      if (role !== 'public' && !checkAuthorization(req, role)) {
        sendErrorResponse(res, 403, `${role} access required`);
        return;
      }

      await handler();
    } catch (error) {
      handleControllerError(error, res, action);
    }
  }

  /**
   * Standard CRUD create operation
   */
  protected async createResource<T extends mongoose.Document>(
    req: Request,
    res: Response,
    Model: mongoose.Model<T>,
    action: string,
    role: 'admin' | 'customer' = 'admin',
    options?: {
      beforeSave?: (data: any) => any;
      afterSave?: (doc: T) => void;
      responseFields?: (doc: T) => any | Promise<any>;
    }
  ): Promise<void> {
    await this.withAuth(req, res, action, role, async () => {
      const sanitizedData = sanitizeData(req.body);

      // Apply beforeSave transformation if provided
      const processedData = options?.beforeSave
        ? await options.beforeSave(sanitizedData)
        : sanitizedData;

      const document = new Model(processedData);
      await document.save();

      // Apply afterSave hook if provided
      if (options?.afterSave) {
        options.afterSave(document);
      }

      // Format response
      const response = options?.responseFields
        ? await options.responseFields(document)
        : this.formatDocumentResponse(document);

      sendResponse(res, 201, response);
    });
  }

  /**
   * Standard CRUD read operation with pagination
   */
  protected async getResources<T extends mongoose.Document>(
    req: Request,
    res: Response,
    Model: mongoose.Model<T>,
    action: string,
    role: 'admin' | 'customer' | 'public' = 'public',
    options?: {
      filters?: any;
      populate?: string | string[];
      responseFields?: (doc: T) => any | Promise<any>;
    }
  ): Promise<void> {
    await this.withAuth(req, res, action, role, async () => {
      const { page, limit, skip } = getPaginationOptions(req);
      const sortOptions = getSortOptions(req);
      const queryFilters = buildQueryFilters(req);

      // Merge with custom filters
      const filters = { ...queryFilters, ...(options?.filters || {}) };

      let query = Model.find(filters).sort(sortOptions).skip(skip).limit(limit);

      if (options?.populate) {
        const populateFields = Array.isArray(options.populate)
          ? options.populate
          : [options.populate];
        populateFields.forEach(field => {
          query = query.populate(field);
        });
      }

      const documents = await query.lean();
      const total = await Model.countDocuments(filters);

      // Format documents for response
      const formattedDocuments = await Promise.all(
        documents.map(async doc =>
          options?.responseFields
            ? await options.responseFields(doc as T)
            : this.formatDocumentResponse(doc)
        )
      );

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      };

      sendResponse(res, 200, formattedDocuments, pagination);
    });
  }

  /**
   * Standard CRUD read operation without pagination
   */
  protected async getResourcesUnpaginated<T extends mongoose.Document>(
    req: Request,
    res: Response,
    Model: mongoose.Model<T>,
    action: string,
    role: 'admin' | 'customer' | 'public' = 'public',
    options?: {
      filters?: any;
      populate?: string | string[];
      responseFields?: (doc: T) => any | Promise<any>;
      cacheDuration?: number;
      sort?: Record<string, 1 | -1>;
    }
  ): Promise<void> {
    await this.withAuth(req, res, action, role, async () => {
      const sortOptions = getSortOptions(req, options?.sort);
      const queryFilters = buildQueryFilters(req);

      // Merge with custom filters
      const filters = { ...queryFilters, ...(options?.filters || {}) };

      let query = Model.find(filters).sort(sortOptions);

      if (options?.populate) {
        const populateFields = Array.isArray(options.populate)
          ? options.populate
          : [options.populate];
        populateFields.forEach(field => {
          query = query.populate(field);
        });
      }

      const documents = await query.lean();

      // Format documents for response
      const formattedDocuments = await Promise.all(
        documents.map(async doc =>
          options?.responseFields
            ? await options.responseFields(doc as T)
            : this.formatDocumentResponse(doc)
        )
      );

      // Set cache headers if specified
      if (options?.cacheDuration) {
        setCacheHeaders(res, options.cacheDuration);
      }

      sendResponse(res, 200, formattedDocuments);
    });
  }

  /**
   * Standard CRUD read single resource operation
   */
  protected async getResourceById<T extends mongoose.Document>(
    req: Request,
    res: Response,
    Model: mongoose.Model<T>,
    action: string,
    role: 'admin' | 'customer' | 'public' = 'public',
    options?: {
      populate?: string | string[];
      responseFields?: (doc: T) => any | Promise<any>;
      ownershipCheck?: (doc: T, req: Request) => boolean;
    }
  ): Promise<void> {
    await this.withAuth(req, res, action, role, async () => {
      const id = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        sendErrorResponse(res, 400, 'Invalid ID format');
        return;
      }

      let query = Model.findById(id);

      if (options?.populate) {
        const populateFields = Array.isArray(options.populate)
          ? options.populate
          : [options.populate];
        populateFields.forEach(field => {
          query = query.populate(field);
        });
      }

      const document = await query.lean();

      if (!document) {
        sendErrorResponse(res, 404, `${this.modelName} not found`);
        return;
      }

      // Check ownership if required
      if (options?.ownershipCheck && !options.ownershipCheck(document as T, req)) {
        sendErrorResponse(res, 403, 'Access denied');
        return;
      }

      const response = options?.responseFields
        ? await options.responseFields(document as T)
        : this.formatDocumentResponse(document);

      sendResponse(res, 200, response);
    });
  }

  /**
   * Standard CRUD update operation
   */
  protected async updateResource<T extends mongoose.Document>(
    req: Request,
    res: Response,
    Model: mongoose.Model<T>,
    action: string,
    role: 'admin' | 'customer' = 'admin',
    options?: {
      beforeUpdate?: (data: any) => any;
      afterUpdate?: (doc: T) => void;
      responseFields?: (doc: T) => any | Promise<any>;
      ownershipCheck?: (doc: T, req: Request) => boolean;
      populate?: string | string[];
    }
  ): Promise<void> {
    await this.withAuth(req, res, action, role, async () => {
      const id = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        sendErrorResponse(res, 400, 'Invalid ID format');
        return;
      }

      const sanitizedData = sanitizeData(req.body);

      // Apply beforeUpdate transformation if provided
      const processedData = options?.beforeUpdate
        ? await options.beforeUpdate(sanitizedData)
        : sanitizedData;

      let query = Model.findByIdAndUpdate(id, processedData, {
        new: true,
        runValidators: true,
      });

      if (options?.populate) {
        const populateFields = Array.isArray(options.populate)
          ? options.populate
          : [options.populate];
        populateFields.forEach(field => {
          query = query.populate(field);
        });
      }

      const document = await query.lean();

      if (!document) {
        sendErrorResponse(res, 404, `${this.modelName} not found`);
        return;
      }

      // Check ownership if required
      if (options?.ownershipCheck && !options.ownershipCheck(document as T, req)) {
        sendErrorResponse(res, 403, 'Access denied');
        return;
      }

      // Apply afterUpdate hook if provided
      if (options?.afterUpdate) {
        options.afterUpdate(document as T);
      }

      const response = options?.responseFields
        ? await options.responseFields(document as T)
        : this.formatDocumentResponse(document);

      sendResponse(res, 200, response);
    });
  }

  /**
   * Standard CRUD delete operation
   */
  protected async deleteResource<T extends mongoose.Document>(
    req: Request,
    res: Response,
    Model: mongoose.Model<T>,
    action: string,
    role: 'admin' | 'customer' = 'admin',
    options?: {
      beforeDelete?: (doc: T) => Promise<void>;
      ownershipCheck?: (doc: T, req: Request) => boolean;
    }
  ): Promise<void> {
    await this.withAuth(req, res, action, role, async () => {
      const id = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        sendErrorResponse(res, 400, 'Invalid ID format');
        return;
      }

      const document = await Model.findById(id);

      if (!document) {
        sendErrorResponse(res, 404, `${this.modelName} not found`);
        return;
      }

      // Check ownership if required
      if (options?.ownershipCheck && !options.ownershipCheck(document, req)) {
        sendErrorResponse(res, 403, 'Access denied');
        return;
      }

      // Apply beforeDelete hook if provided
      if (options?.beforeDelete) {
        await options.beforeDelete(document);
      }

      await Model.findByIdAndDelete(id);

      sendResponse(res, 200, { message: `${this.modelName} deleted successfully` });
    });
  }

  /**
   * Default document response formatter
   */
  protected formatDocumentResponse(doc: any): any {
    const { _id, __v, ...rest } = doc;
    return {
      _id: _id.toString(),
      ...rest,
    };
  }

  /**
   * Standard uniqueness check
   */
  protected async checkUniqueness<T extends mongoose.Document>(
    Model: mongoose.Model<T>,
    field: string,
    value: any,
    excludeId?: string
  ): Promise<boolean> {
    const query: any = { [field]: value };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Model.findOne(query);
    return !existing;
  }

  /**
   * Standard existence validation
   */
  protected async validateExistence<T extends mongoose.Document>(
    Model: mongoose.Model<T>,
    id: string,
    fieldName: string = 'Resource'
  ): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid ${fieldName} ID format`);
    }

    const document = await Model.findById(id);
    if (!document) {
      throw new Error(`${fieldName} not found`);
    }

    return document;
  }
}

/**
 * Helper function to create a controller method that follows the standard pattern
 */
export function createControllerMethod<T extends mongoose.Document>(
  Model: mongoose.Model<T>,
  modelName: string,
  action: string,
  role: 'admin' | 'customer' | 'public',
  handler: (req: Request, res: Response) => Promise<void>
) {
  return async (req: Request, res: Response) => {
    try {
      logControllerAction(req, action);

      if (role !== 'public' && !checkAuthorization(req, role)) {
        sendErrorResponse(res, 403, `${role} access required`);
        return;
      }

      await handler(req, res);
    } catch (error) {
      handleControllerError(error, res, action);
    }
  };
}

export default BaseController;
