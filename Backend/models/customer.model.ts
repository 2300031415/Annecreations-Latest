import mongoose from 'mongoose';

import { ICustomer, ICustomerModel, IAddress } from '../types/models/index';
import { createBaseSchema, createReferenceField, addressSchema } from '../utils/baseModel';

// Use the standardized address schema from baseModel

const customerSchema = createBaseSchema(
  {
    languageId: createReferenceField('Language', true),
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
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    mobile: {
      type: String,
      // required: true,
      trim: true,
      match: /^\+?[0-9\s\-()]+$/, // basic phone number validation
      maxlength: 20,
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
    newsletter: {
      type: Boolean,
      default: false,
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 45,
    },
    status: {
      type: Boolean,
      default: true,
    },
    mobileVerified: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    resetToken: {
      type: String,
      trim: true,
    },
    emailVerificationToken: {
      type: String,
      trim: true,
    },
    emailVerificationExpires: {
      type: Date,
    },
    addresses: [addressSchema],
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
  },
  {
    collectionName: 'customers',
    modelName: 'Customer',
    trimFields: ['firstName', 'lastName', 'email', 'mobile', 'company'],
    addCommonFeatures: true,
  }
);

// Individual field indexes for search performance
customerSchema.index({ firstName: 1 });
customerSchema.index({ lastName: 1 });
// Note: email already has unique index, no need for additional index
customerSchema.index({ mobile: 1 });
customerSchema.index({ lastLogin: -1 });
customerSchema.index({ emailVerificationToken: 1 });

// Compound indexes for common search patterns
customerSchema.index({ firstName: 1, lastName: 1 }); // Full name search
// Note: email compound index skipped due to existing unique email index
customerSchema.index({ mobile: 1, status: 1 }); // Mobile with status

// Text index for full-text search across name, email, and mobile fields
customerSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
  mobile: 'text',
});

// Customer-specific virtuals
customerSchema.virtual('fullName').get(function (_this: ICustomer) {
  return `${this.firstName} ${this.lastName}`;
});

customerSchema.virtual('primaryAddress').get(function (_this: ICustomer) {
  const addresses = this.addresses as IAddress[];
  return addresses.find((addr: IAddress) => addr.preferedBillingAddress) || addresses[0];
});

// Customer-specific instance methods
customerSchema.methods.getFullCustomer = async function () {
  const Customer = mongoose.model('Customer');
  return await Customer.findById(this._id)
    .populate('languageId', 'name code')
    .populate('addresses.country', 'name iso_code_2')
    .populate('addresses.zone', 'name code')
    .lean();
};

// Customer-specific static methods
customerSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

customerSchema.statics.findByMobile = function (mobile: string) {
  return this.findOne({ mobile });
};

customerSchema.statics.findByStatus = function (status: boolean) {
  return this.find({ status });
};

customerSchema.statics.findNewsletterSubscribers = function () {
  return this.find({ newsletter: true, status: true });
};

customerSchema.statics.findByEmailVerificationToken = function (token: string) {
  return this.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  });
};

export default mongoose.model<ICustomer, ICustomerModel>('Customer', customerSchema);
