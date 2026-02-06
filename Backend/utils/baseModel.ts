import mongoose from 'mongoose';

/**
 * Base schema options and methods to eliminate duplication across models
 */

/**
 * Standard schema options for all models
 */
export const getBaseSchemaOptions = (collectionName: string) => ({
  collection: collectionName,
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

/**
 * Standard indexes for all models
 */
export const addBaseIndexes = (schema: mongoose.Schema) => {
  schema.index({ createdAt: -1 });
  schema.index({ updatedAt: -1 });
  schema.index({ status: 1 });
};

/**
 * Common virtual fields
 */
export const addCommonVirtuals = (schema: mongoose.Schema) => {
  // Virtual for ID as string
  schema.virtual('id').get(function (this: any) {
    return this._id.toHexString();
  });

  // Virtual for checking if document is recent (created in last 24 hours)
  schema.virtual('isRecent').get(function (this: any) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.createdAt > oneDayAgo;
  });
};

/**
 * Common pre-save middleware
 */
export const addCommonPreSave = (schema: mongoose.Schema, trimFields: string[] = []) => {
  schema.pre('save', function (next) {
    // Trim specified string fields
    trimFields.forEach(field => {
      if (this[field] && typeof this[field] === 'string') {
        this[field] = this[field].trim();
      }
    });

    next();
  });
};

/**
 * Common static methods
 */
export const addCommonStatics = (schema: mongoose.Schema, modelName: string) => {
  // Find active documents
  schema.statics.findActive = function () {
    return this.find({ status: true }).sort({ createdAt: -1 });
  };

  // Find inactive documents
  schema.statics.findInactive = function () {
    return this.find({ status: false }).sort({ createdAt: -1 });
  };

  // Find by date range
  schema.statics.findByDateRange = function (startDate: Date, endDate: Date) {
    return this.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).sort({ createdAt: -1 });
  };

  // Find recent documents (last 24 hours)
  schema.statics.findRecent = function (limit: number = 10) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.find({ createdAt: { $gte: oneDayAgo } })
      .sort({ createdAt: -1 })
      .limit(limit);
  };

  // Count by status
  schema.statics.countByStatus = async function (status: boolean = true) {
    return await this.countDocuments({ status });
  };

  // Bulk update status
  schema.statics.bulkUpdateStatus = function (ids: mongoose.Types.ObjectId[], status: boolean) {
    return this.updateMany({ _id: { $in: ids } }, { status });
  };
};

/**
 * Common instance methods
 */
export const addCommonMethods = (schema: mongoose.Schema, modelName: string) => {
  // Get full document with populated fields
  schema.methods.getFullDocument = async function (populateFields: string[] = []) {
    const Model = mongoose.model(modelName);
    let query = Model.findById(this._id);

    populateFields.forEach(field => {
      query = query.populate(field);
    });

    return await query.lean();
  };

  // Toggle status
  schema.methods.toggleStatus = async function () {
    this.status = !this.status;
    return await this.save();
  };

  // Check if document is owned by user
  schema.methods.isOwnedBy = function (userId: mongoose.Types.ObjectId | string) {
    const userField = this.customer || this.userId || this.user;
    if (!userField) return false;
    return userField.toString() === userId.toString();
  };
};

/**
 * Standard name validation
 */
export const nameValidator = {
  validator: function (v: string) {
    return v && v.trim().length > 0;
  },
  message: 'Name is required and cannot be empty',
};

/**
 * Standard email validation
 */
export const emailValidator = {
  validator: function (v: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !v || emailRegex.test(v);
  },
  message: 'Invalid email format',
};

/**
 * Standard ObjectId validation
 */
export const objectIdValidator = {
  validator: function (v: mongoose.Types.ObjectId) {
    return !v || mongoose.Types.ObjectId.isValid(v);
  },
  message: 'Invalid ObjectId format',
};

/**
 * Create a standard schema with common features
 */
export const createBaseSchema = (
  definition: mongoose.SchemaDefinition,
  options: {
    collectionName: string;
    trimFields?: string[];
    modelName: string;
    addCommonFeatures?: boolean;
  }
) => {
  const schema = new mongoose.Schema(definition, getBaseSchemaOptions(options.collectionName));

  if (options.addCommonFeatures !== false) {
    addBaseIndexes(schema);
    addCommonVirtuals(schema);
    addCommonPreSave(schema, options.trimFields || []);
    addCommonStatics(schema, options.modelName);
    addCommonMethods(schema, options.modelName);
  }

  return schema;
};

/**
 * Standard field definitions
 */
export const commonFields = {
  status: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
    min: 0,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
    validate: nameValidator,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  image: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  languageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language',
    validate: objectIdValidator,
  },
  ipAddress: {
    type: String,
    trim: true,
    maxlength: 45,
  },
  userAgent: {
    type: String,
    trim: true,
    maxlength: 500,
  },
};

/**
 * Standard reference fields
 */
export const createReferenceField = (refModel: string, required: boolean = false) => {
  const field: any = {
    type: mongoose.Schema.Types.ObjectId,
    ref: refModel,
    validate: objectIdValidator,
  };

  if (required) {
    field.required = true;
  }

  return field;
};

/**
 * Standard address schema
 */
export const addressSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    company: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    addressLine1: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    postcode: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    country: createReferenceField('Country', true),
    zone: createReferenceField('Zone'),
    preferedBillingAddress: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

export default {
  getBaseSchemaOptions,
  addBaseIndexes,
  addCommonVirtuals,
  addCommonPreSave,
  addCommonStatics,
  addCommonMethods,
  createBaseSchema,
  commonFields,
  createReferenceField,
  addressSchema,
  nameValidator,
  emailValidator,
  objectIdValidator,
};
