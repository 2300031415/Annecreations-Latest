import mongoose, { Schema } from 'mongoose';

import { IPopup, IPopupButton, IPopupModel } from '../types/models/popup';

/**
 * Schema for popup buttons
 */
const popupButtonSchema = new Schema<IPopupButton>(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    style: {
      type: String,
      enum: ['primary', 'secondary', 'outline', 'link'],
      default: 'primary',
    },
    icon: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

/**
 * Schema for Popup
 */
const popupSchema = new Schema<IPopup, IPopupModel>(
  {
    title: {
      type: String,
      required: [true, 'Popup title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Popup content is required'],
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    buttons: {
      type: [popupButtonSchema],
      default: [],
    },
    status: {
      type: Boolean,
      default: false,
      index: true,
    },
    displayFrequency: {
      type: String,
      enum: ['once', 'always'],
      default: 'once',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    deviceType: {
      type: String,
      enum: ['all', 'mobile', 'desktop'],
      default: 'all',
      description: 'Device type targeting: all, mobile, or desktop',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
popupSchema.index({ status: 1, sortOrder: 1 });
popupSchema.index({ deviceType: 1 });

/**
 * Instance method: Check if popup is active
 */
popupSchema.methods.isActive = function (): boolean {
  return this.status === true;
};

/**
 * Static method: Get the active popup
 * Returns the first active popup with optional device targeting
 */
popupSchema.statics.getActivePopup = async function (deviceType?: string): Promise<IPopup | null> {
  const query: any = { status: true };
  
  // Add device type filtering if provided
  if (deviceType && ['mobile', 'desktop'].includes(deviceType)) {
    query.$or = [
      { deviceType: 'all' },
      { deviceType: deviceType }
    ];
  }

  const popup = await this.findOne(query)
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

  return popup;
};

/**
 * Static method: Deactivate all popups
 */
popupSchema.statics.deactivateAll = async function (): Promise<void> {
  await this.updateMany({ status: true }, { status: false });
};

/**
 * Pre-save middleware: Ensure only one popup is active
 */
popupSchema.pre('save', async function (next) {
  if (this.isModified('status') && this.status === true) {
    // Deactivate all other popups
    const Model = this.constructor as IPopupModel;
    await Model.updateMany({ _id: { $ne: this._id }, status: true }, { status: false });
  }
  next();
});

const Popup = mongoose.model<IPopup, IPopupModel>('Popup', popupSchema);

export default Popup;
