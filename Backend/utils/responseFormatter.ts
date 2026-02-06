/**
 * Centralized response formatting utilities to eliminate duplication
 */

import { ICategory } from '../types/models/category';
import { ICountry } from '../types/models/country';
import { ICoupon } from '../types/models/coupon';
import { ICustomer } from '../types/models/customer';
import { IOrder } from '../types/models/order';
import { IProduct } from '../types/models/product';
import { IZone } from '../types/models/zone';

/**
 * Base formatter for all documents
 */
export const formatBaseDocument = (doc: any) => {
  if (!doc) return null;

  const { _id, __v, ...rest } = doc;
  return {
    _id: _id.toString(),
    ...rest,
  };
};

/**
 * Customer response formatter
 */
export const formatCustomerResponse = (customer: ICustomer, includePrivate: boolean = false) => {
  const base = {
    _id: customer._id.toString(),
    firstName: customer?.firstName,
    lastName: customer?.lastName,
    email: customer?.email,
    mobile: customer.mobile,
    status: customer.status,
    newsletter: customer.newsletter,
    emailVerified: customer.emailVerified,
    mobileVerified: customer.mobileVerified,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };

  if (includePrivate) {
    return {
      ...base,
      totalLogins: customer.totalLogins,
      lastLogin: customer.lastLogin,
      addresses: customer.addresses,
      language: customer.languageId,
    };
  }

  return base;
};

/**
 * Product response formatter
 */
export const formatProductResponse = (product: IProduct, includeFiles: boolean = false) => {
  const base = {
    _id: product._id.toString(),
    productModel: product.productModel,
    sku: product.sku,
    description: product.description,
    stitches: product.stitches,
    dimensions: product.dimensions,
    colourNeedles: product.colourNeedles,
    image: product.image ? `image/${product.image}` : product.image,
    sortOrder: product.sortOrder,
    status: product.status,
    viewed: product.viewed,
    seo: product.seo,
    categories: product.categories,
    additionalImages: product.additionalImages?.map((img: any) => ({
      ...img,
      image: img.image ? `image/${img.image}` : img.image,
    })),
    languageId: product.languageId,
    averageRating: product.averageRating || 0,
    reviewCount: product.reviewCount || 0,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };

  // Format options
  const options = product.options?.map((option: any) => {
    const baseOption = {
      _id: option._id?.toString(),
      option: option.option,
      price: option.price,
      fileSize: option.fileSize,
      mimeType: option.mimeType,
      downloadCount: option.downloadCount,
    };

    // Include file path only if specifically requested and authorized
    if (includeFiles && option.uploadedFilePath) {
      return {
        ...baseOption,
        uploadedFilePath: option.uploadedFilePath,
      };
    }

    return baseOption;
  });

  return {
    ...base,
    options,
  };
};

/**
 * Order response formatter
 */
export const formatOrderResponse = (order: IOrder, includePrivate: boolean = false) => {
  const base = {
    _id: order._id.toString(),
    orderNumber: order.orderNumber,
    customer: order.customer,
    orderStatus: order.orderStatus,
    total: order.orderTotal,
    paymentMethod: order.paymentMethod,
    source: order.source || '--',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };

  if (includePrivate) {
    return {
      ...base,
      payment: {
        firstName: order.paymentFirstName,
        lastName: order.paymentLastName,
        company: order.paymentCompany,
        address1: order.paymentAddress1,
        address2: order.paymentAddress2,
        city: order.paymentCity,
        postcode: order.paymentPostcode,
        country: order.paymentCountry,
        zone: order.paymentZone,
        addressFormat: order.paymentAddressFormat,
        method: order.paymentMethod,
        code: order.paymentCode,
      },
      razorpayOrderId: order.razorpayOrderId || null,
      languageId: order.languageId,
      ip: order.ipAddress,
      forwardedIp: order.forwardedIp,
      userAgent: order.userAgent,
      acceptLanguageId: order.acceptLanguageId,
      products:
        order.products?.map((product: any) => ({
          product: product.product,
          options: product.options?.map((option: any) => ({
            option: option.option,
            price: option.price,
            fileSize: option.fileSize,
            mimeType: option.mimeType,
            downloadCount: option.downloadCount,
          })),
          subtotal:
            product.options?.reduce((sum: number, option: any) => sum + (option.price || 0), 0) ||
            0,
        })) || [],
      product_count: order.products?.length || 0,
      totals: order.totals || [],
      history: order.history || [],
      coupon: order.coupon,
      couponDiscount: order.coupon,
    };
  }

  return {
    ...base,
    products: order.products,
    product_count: order.products?.length || 0,
  };
};

/**
 * Country response formatter
 */
export const formatCountryResponse = (country: ICountry) => ({
  _id: country._id.toString(),
  name: country.name,
  isoCode2: country.isoCode2,
  isoCode3: country.isoCode3,
  addressFormat: country.addressFormat,
  postcodeRequired: country.postcodeRequired,
  status: country.status,
  createdAt: country.createdAt,
  updatedAt: country.updatedAt,
});

/**
 * Coupon response formatter
 */
export const formatCouponResponse = (coupon: ICoupon) => ({
  _id: coupon._id.toString(),
  name: coupon.name,
  code: coupon.code,
  type: coupon.type,
  discount: coupon.discount,
  logged: coupon.logged,
  minAmount: coupon.minAmount,
  maxDiscount: coupon.maxDiscount,
  dateStart: coupon.dateStart,
  dateEnd: coupon.dateEnd,
  totalUses: coupon.totalUses,
  customerUses: coupon.customerUses,
  autoApply: coupon.autoApply ?? false,
  status: coupon.status,
  createdAt: coupon.createdAt,
  updatedAt: coupon.updatedAt,
});

/**
 * Category response formatter
 */
export const formatCategoryResponse = (category: ICategory) => ({
  _id: category._id.toString(),
  name: category.name,
  description: category.description,
  image: category.image ? `image/${category.image}` : category.image,
  sortOrder: category.sortOrder,
  status: category.status,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

/**
 * Zone response formatter
 */
export const formatZoneResponse = (zone: IZone) => ({
  _id: zone._id.toString(),
  name: zone.name,
  code: zone.code,
  country: zone.country,
  status: zone.status,
  createdAt: zone.createdAt,
  updatedAt: zone.updatedAt,
});

/**
 * Wishlist response formatter
 */
export const formatWishlistResponse = (product: IProduct, dateAdded?: Date) => ({
  _id: product._id.toString(),
  productModel: product.productModel,
  sku: product.sku,
  description: product.description,
  stitches: product.stitches,
  dimensions: product.dimensions,
  colourNeedles: product.colourNeedles,
  sortOrder: product.sortOrder,
  status: product.status,
  viewed: product.viewed,
  image: product.image ? `image/${product.image}` : product.image,
  seo: product.seo,
  categories: product.categories,
  additionalImages: product.additionalImages?.map((img: any) => ({
    ...img,
    image: img.image ? `image/${img.image}` : img.image,
  })),
  options: product.options?.map((option: any) => ({
    _id: option._id?.toString(),
    option: option.option,
    price: option.price,
  })),
  languageId: product.languageId,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
  dateAdded: dateAdded,
});

/**
 * Popup response formatter
 */
export const formatPopupResponse = (popup: any, publicOnly: boolean = false) => {
  const base = {
    _id: popup._id.toString(),
    title: popup.title,
    content: popup.content,
    image: popup.image ? `image/${popup.image}` : popup.image,
    displayFrequency: popup.displayFrequency,
    sortOrder: popup.sortOrder,
    deviceType: popup.deviceType || 'all',
    createdAt: popup.createdAt,
    updatedAt: popup.updatedAt,
  };

  if (publicOnly) {
    // For public API, only return essential fields
    return {
      ...base,
      buttons:
        popup.buttons?.map((btn: any) => ({
          _id: btn._id?.toString(),
          text: btn.text,
          action: btn.action,
          style: btn.style,
          icon: btn.icon,
        })) || [],
    };
  }

  // For admin API, return all fields including status
  return {
    ...base,
    status: popup.status,
    buttons:
      popup.buttons?.map((btn: any) => ({
        _id: btn._id?.toString(),
        text: btn.text,
        action: btn.action,
        style: btn.style,
        icon: btn.icon,
      })) || [],
  };
};

/**
 * Banner response formatter
 */
export const formatBannerResponse = (banner: any, publicOnly: boolean = false) => {
  const formatImages = (images: any[]) =>
    images?.map((img: any) => ({
      _id: img._id?.toString(),
      image: img.image ? `image/${img.image}` : img.image,
      status: img.status,
    })) || [];

  const base = {
    _id: banner._id.toString(),
    title: banner.title,
    description: banner.description,
    deviceType: banner.deviceType,
    sortOrder: banner.sortOrder,
    createdAt: banner.createdAt,
    updatedAt: banner.updatedAt,
  };

  if (publicOnly) {
    // For public API, only return active images and just the image paths
    const activeImages =
      banner.images
        ?.filter((img: any) => img.status === true)
        .map((img: any) => (img.image ? `image/${img.image}` : img.image)) || [];

    return {
      ...base,
      images: activeImages,
    };
  }

  // For admin API, return all images with their status
  return {
    ...base,
    images: formatImages(banner.images),
  };
};

/**
 * Migration response formatter
 */
export const formatMigrationResponse = (migration: any) => ({
  _id: migration._id.toString(),
  name: migration.name,
  migratedDetails: migration.migratedDetails,
  durationSeconds: migration.durationSeconds,
  status: migration.status,
  startedAt: migration.startedAt,
  completedAt: migration.completedAt,
  createdAt: migration.createdAt,
  updatedAt: migration.updatedAt,
});

/**
 * Pagination response formatter
 */
export const formatPaginationResponse = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
  hasNext: page < Math.ceil(total / limit),
  hasPrev: page > 1,
});

/**
 * Generic list response formatter
 */
export const formatListResponse = <T>(
  items: T[],
  formatter: (item: T) => any,
  pagination?: { page: number; limit: number; total: number }
) => {
  const formattedItems = items.map(formatter);

  if (pagination) {
    return {
      items: formattedItems,
      pagination: formatPaginationResponse(pagination.page, pagination.limit, pagination.total),
    };
  }

  return {
    items: formattedItems,
    count: formattedItems.length,
  };
};

/**
 * Analytics response formatter
 */
export const formatAnalyticsResponse = (data: any, timeRange?: { start: Date; end: Date }) => ({
  data,
  timeRange,
  generatedAt: new Date(),
});

/**
 * Error response formatter
 */
export const formatErrorResponse = (message: string, code?: string, details?: any) => ({
  error: {
    message,
    code: code || 'UNKNOWN_ERROR',
    details,
    timestamp: new Date(),
  },
});

/**
 * Success response formatter
 */
export const formatSuccessResponse = (data: any, message?: string) => ({
  success: true,
  message: message || 'Operation completed successfully',
  data,
  timestamp: new Date(),
});

export default {
  formatBaseDocument,
  formatCustomerResponse,
  formatProductResponse,
  formatOrderResponse,
  formatCountryResponse,
  formatCouponResponse,
  formatCategoryResponse,
  formatPopupResponse,
  formatBannerResponse,
  formatZoneResponse,
  formatWishlistResponse,
  formatMigrationResponse,
  formatPaginationResponse,
  formatListResponse,
  formatAnalyticsResponse,
  formatErrorResponse,
  formatSuccessResponse,
};
