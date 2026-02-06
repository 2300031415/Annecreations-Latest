import mongoose from 'mongoose';

import { IBanner, IBannerImage, IBannerModel } from '../types/models/index';
import { createBaseSchema } from '../utils/baseModel';

const bannerImageSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const bannerSchema = createBaseSchema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    deviceType: {
      type: String,
      required: true,
      enum: ['mobile', 'web'],
      trim: true,
    },
    images: [bannerImageSchema],
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    collectionName: 'banners',
    modelName: 'Banner',
    trimFields: ['title', 'description'],
    addCommonFeatures: true,
  }
);

// Banner-specific indexes
bannerSchema.index({ sortOrder: 1 });
bannerSchema.index({ 'images.status': 1 });
bannerSchema.index({ deviceType: 1 });

// Banner-specific methods
bannerSchema.methods.hasActiveImages = function () {
  return this.images && this.images.some((img: IBannerImage) => img.status === true);
};

// Static method to get banners with active images
bannerSchema.statics.getBannersWithActiveImages = function () {
  return this.find({
    'images.status': true,
  }).sort({ sortOrder: 1 });
};

export default mongoose.model<IBanner, IBannerModel>('Banner', bannerSchema);
