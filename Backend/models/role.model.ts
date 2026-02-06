import mongoose from 'mongoose';

import {
  IRole,
  IRoleModel,
  Feature,
  PermissionAction,
  IFeaturePermission,
} from '../types/models/role';
import { createBaseSchema } from '../utils/baseModel';

const featurePermissionSchema = new mongoose.Schema(
  {
    feature: {
      type: String,
      required: true,
      enum: Object.values(Feature),
    },
    create: {
      type: Boolean,
      default: false,
    },
    read: {
      type: Boolean,
      default: false,
    },
    update: {
      type: Boolean,
      default: false,
    },
    delete: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const roleSchema = createBaseSchema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    permissions: {
      type: [featurePermissionSchema],
      default: [],
      validate: {
        validator: function (permissions: IFeaturePermission[]) {
          // Check for duplicate features
          const features = permissions.map(p => p.feature);
          return features.length === new Set(features).size;
        },
        message: 'Duplicate feature permissions are not allowed',
      },
    },
    status: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    collectionName: 'roles',
    modelName: 'Role',
    trimFields: ['name', 'description'],
    addCommonFeatures: true,
  }
);

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ status: 1 });
roleSchema.index({ createdBy: 1 });

// Instance method: Check if role has specific permission
roleSchema.methods.hasPermission = function (feature: Feature, action: PermissionAction): boolean {
  const featurePermission = this.permissions.find((p: IFeaturePermission) => p.feature === feature);

  if (!featurePermission) {
    return false;
  }

  return featurePermission[action] === true;
};

// Instance method: Get feature permissions
roleSchema.methods.getFeaturePermissions = function (
  feature: Feature
): IFeaturePermission | undefined {
  return this.permissions.find((p: IFeaturePermission) => p.feature === feature);
};

// Static method: Find role by name
roleSchema.statics.findByName = function (name: string) {
  return this.findOne({ name: name.trim() });
};

// Static method: Find active roles
roleSchema.statics.findActive = function () {
  return this.find({ status: true }).sort({ name: 1 });
};

// Static method: Check if role can be deleted
roleSchema.statics.canDelete = async function (roleId: string) {
  // Check if role name is 'superAdmin' - this role cannot be deleted
  const role = await this.findById(roleId);
  if (!role) {
    return false;
  }

  if (role.name.toLowerCase() === 'superadmin') {
    return false;
  }

  // Check if any admins are using this role
  const Admin = mongoose.model('Admin');
  const adminCount = await Admin.countDocuments({ role: roleId });

  return adminCount === 0;
};

// Pre-save validation: Prevent modification of superAdmin role
roleSchema.pre('save', function (next) {
  if (!this.isNew && typeof this.name === 'string' && this.name.toLowerCase() === 'superadmin') {
    const error = new Error('SuperAdmin role cannot be modified');
    return next(error);
  }
  next();
});

// Pre-remove validation: Prevent deletion of superAdmin role
roleSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  if (typeof this.name === 'string' && this.name.toLowerCase() === 'superadmin') {
    const error = new Error('SuperAdmin role cannot be deleted');
    return next(error);
  }
  next();
});

export default mongoose.model<IRole, IRoleModel>('Role', roleSchema);
