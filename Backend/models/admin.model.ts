import mongoose from 'mongoose';

import { IAdmin, IAdminModel } from '../types/models/index';
import { createBaseSchema, commonFields } from '../utils/baseModel';
import { ValidationPatterns } from '../utils/validationHelpers';

const adminSchema = createBaseSchema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      validate: {
        validator: function (v: string) {
          return /^[a-zA-Z0-9_-]+$/.test(v);
        },
        message: 'Username can only contain letters, numbers, underscores, and hyphens',
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    salt: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return ValidationPatterns.EMAIL.test(v);
        },
        message: 'Invalid email format',
      },
    },
    image: commonFields.image,
    ipAddress: commonFields.ipAddress,
    status: commonFields.status,
    lastLogin: {
      type: Date,
    },
    lastIp: {
      type: String,
      trim: true,
      maxlength: 45,
    },
    totalLogins: {
      type: Number,
      default: 0,
      min: 0,
    },
    resetToken: {
      type: String,
      trim: true,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    collectionName: 'admins',
    modelName: 'Admin',
    trimFields: ['username', 'firstName', 'lastName', 'email'],
    addCommonFeatures: true,
  }
);

adminSchema.index({ lastLogin: -1 });

// Admin-specific virtuals
adminSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Instance method: Check if admin is SuperAdmin (async - queries role if needed)
adminSchema.methods.isSuperAdmin = async function (): Promise<boolean> {
  if (!this.role) return false;

  // If role is already populated
  if (this.role instanceof mongoose.Types.ObjectId) {
    const Role = mongoose.model('Role');
    const role = await Role.findById(this.role).select('name');
    return role?.name === 'SuperAdmin';
  }

  return this.role.name === 'SuperAdmin';
};

// Admin-specific static methods
adminSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

adminSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ username: username.trim() });
};

adminSchema.statics.findActive = function () {
  return this.find({ status: true });
};

adminSchema.statics.findByStatus = function (status: boolean) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Admin-specific instance methods
adminSchema.methods.updateLoginInfo = async function (ip: string) {
  this.lastLogin = new Date();
  this.lastIp = ip;
  this.totalLogins = (this.totalLogins || 0) + 1;
  return await this.save();
};

adminSchema.methods.isActive = function () {
  return this.status === true;
};

export default mongoose.model<IAdmin, IAdminModel>('Admin', adminSchema);
