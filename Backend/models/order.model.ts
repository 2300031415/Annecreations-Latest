import mongoose from 'mongoose';

import { IOrder, IOrderModel } from '../types/models/index';
import { getBaseSchemaOptions, addCommonVirtuals, addCommonPreSave } from '../utils/baseModel';

import { Counter } from './counter.model';
import { productOptionSchema } from './product.model';

// Order Product subdocument
const orderProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      validate: {
        validator: function (v: mongoose.Types.ObjectId) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Invalid product ID',
      },
    },
    options: [productOptionSchema],
  },
  { _id: false }
);

// Order Totals
const orderTotalSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      enum: ['total', 'subtotal', 'couponDiscount'],
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const orderHistorySchema = new mongoose.Schema(
  {
    orderStatus: {
      type: String,
      enum: ['pending', 'paid', 'cancelled', 'refunded', 'failed', 'authorized'],
      default: 'pending',
    },
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    notify: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false, timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      validate: {
        validator: function (v: mongoose.Types.ObjectId) {
          return !v || mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Invalid customer ID',
      },
    },
    paymentFirstName: {
      type: String,
      // required: true,
      trim: true,
      maxlength: 100,
    },
    paymentLastName: {
      type: String,
      // required: true,
      trim: true,
      maxlength: 100,
    },
    paymentCompany: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    paymentAddress1: {
      type: String,
      // required: true,
      trim: true,
      maxlength: 255,
    },
    paymentAddress2: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    paymentCity: {
      type: String,
      // required: true,
      trim: true,
      maxlength: 100,
    },
    paymentPostcode: {
      type: String,
      // required: true,
      trim: true,
      maxlength: 20,
    },
    paymentCountry: {
      type: String,
      // required: true,
      trim: true,
      maxlength: 100,
    },
    paymentZone: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    paymentAddressFormat: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    paymentCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    orderTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'paid', 'cancelled', 'refunded', 'failed', 'authorized'],
      default: 'pending',
    },
    languageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Language',
      validate: {
        validator: function (v: mongoose.Types.ObjectId) {
          return !v || mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Invalid language ID',
      },
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 45,
    },
    forwardedIp: {
      type: String,
      trim: true,
      maxlength: 45,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    acceptLanguageId: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    source: {
      type: String,
      enum: ['mobile', 'web'],
      default: 'mobile',
      trim: true,
    },
    products: [orderProductSchema],
    totals: [orderTotalSchema],
    history: [orderHistorySchema],
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      validate: {
        validator: function (v: mongoose.Types.ObjectId) {
          return !v || mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Invalid coupon ID',
      },
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
  },
  getBaseSchemaOptions('orders')
);

// Indexes for performance and search
// Note: createdAt index is already created by base schema
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ customer: 1, orderStatus: 1 }); // For aggregating customer orders
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ orderTotal: 1 });
orderSchema.index({ 'products.product': 1 });
// Note: orderNumber already has unique index defined in schema, no need for additional index

// Add common virtuals from BaseModel
addCommonVirtuals(orderSchema);

// Order-specific virtuals
orderSchema.virtual('customerFullName').get(function (this: any) {
  return `${this.paymentFirstName} ${this.paymentLastName}`;
});

orderSchema.virtual('isDownloadable').get(function (this: any) {
  return this.orderStatus === 'paid' && this.products && this.products.length > 0;
});

// Add common pre-save middleware with order-specific fields to trim
addCommonPreSave(orderSchema, [
  'paymentFirstName',
  'paymentLastName',
  'paymentCompany',
  'paymentAddress1',
  'paymentAddress2',
  'paymentCity',
  'paymentPostcode',
]);

// Method to get order with populated data
orderSchema.methods.getFullOrder = async function () {
  // Use the model directly instead of this.constructor to avoid TS error
  const Order = mongoose.model('Order');
  return await Order.findById(this._id)
    .populate('customer', 'firstName lastName email')
    .populate('languageId', 'name code')
    .populate('coupon', 'name code discount')
    .populate('products.product', 'model sku image')
    .populate('products.options.option', 'name')
    .lean();
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function (status: string) {
  return this.find({ orderStatus: status }).sort({ createdAt: -1 });
};

// Static method to find orders by customer
orderSchema.statics.findByCustomer = function (customerId: mongoose.Types.ObjectId) {
  return this.find({ customer: customerId }).sort({ createdAt: -1 });
};

// Static method to find order by order number
orderSchema.statics.findByOrderNumber = function (orderNumber: string) {
  return this.findOne({ orderNumber });
};

export default mongoose.model<IOrder, IOrderModel>('Order', orderSchema);
