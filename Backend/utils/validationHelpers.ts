import mongoose from 'mongoose';

/**
 * Common validation utilities to eliminate duplication
 */

/**
 * Standard validation patterns
 */
export const ValidationPatterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[1-9][\d]{0,15}$/,
  SKU: /^[A-Z0-9_-]{3,50}$/i,
  SLUG: /^[a-z0-9-]+$/,
  ISO_CODE_2: /^[A-Z]{2}$/,
  ISO_CODE_3: /^[A-Z]{3}$/,
  POSTCODE: /^[A-Z0-9\s-]{3,10}$/i,
  PASSWORD: /^.{6,}$/,
  COUPON_CODE: /^[A-Z0-9_-]{3,20}$/i,
};

/**
 * Common validation functions
 */
export const ValidationHelpers = {
  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    return ValidationPatterns.EMAIL.test(email);
  },

  /**
   * Validate phone number
   */
  isValidPhone: (phone: string): boolean => {
    return ValidationPatterns.PHONE.test(phone);
  },

  /**
   * Validate MongoDB ObjectId
   */
  isValidObjectId: (id: string): boolean => {
    return mongoose.Types.ObjectId.isValid(id);
  },

  /**
   * Validate SKU format
   */
  isValidSKU: (sku: string): boolean => {
    return ValidationPatterns.SKU.test(sku);
  },

  /**
   * Validate password strength
   */
  isValidPassword: (password: string): boolean => {
    return ValidationPatterns.PASSWORD.test(password);
  },

  /**
   * Validate coupon code format
   */
  isValidCouponCode: (code: string): boolean => {
    return ValidationPatterns.COUPON_CODE.test(code);
  },

  /**
   * Validate ISO country codes
   */
  isValidISOCode2: (code: string): boolean => {
    return ValidationPatterns.ISO_CODE_2.test(code);
  },

  isValidISOCode3: (code: string): boolean => {
    return ValidationPatterns.ISO_CODE_3.test(code);
  },

  /**
   * Validate date range
   */
  isValidDateRange: (startDate: Date, endDate: Date): boolean => {
    return startDate <= endDate;
  },

  /**
   * Validate price (positive number with max 2 decimal places)
   */
  isValidPrice: (price: number): boolean => {
    return price >= 0 && Number.isFinite(price) && price.toString().split('.')[1]?.length <= 2;
  },

  /**
   * Validate discount percentage (0-100)
   */
  isValidDiscountPercent: (discount: number): boolean => {
    return discount >= 0 && discount <= 100;
  },

  /**
   * Validate file size (in bytes)
   */
  isValidFileSize: (size: number, maxSizeMB: number = 10): boolean => {
    return size > 0 && size <= maxSizeMB * 1024 * 1024;
  },

  /**
   * Validate image file type
   */
  isValidImageType: (mimeType: string): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(mimeType.toLowerCase());
  },

  /**
   * Validate document file type
   */
  isValidDocumentType: (mimeType: string): boolean => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed',
    ];
    return validTypes.includes(mimeType.toLowerCase());
  },
};

/**
 * Field validation schemas for common fields
 */
export const FieldValidators = {
  requiredString: (fieldName: string, minLength: number = 1, maxLength: number = 255) => ({
    validator: function (v: string) {
      return v && v.trim().length >= minLength && v.trim().length <= maxLength;
    },
    message: `${fieldName} must be between ${minLength} and ${maxLength} characters`,
  }),

  optionalString: (fieldName: string, maxLength: number = 255) => ({
    validator: function (v: string) {
      return !v || v.trim().length <= maxLength;
    },
    message: `${fieldName} must be less than ${maxLength} characters`,
  }),

  email: {
    validator: function (v: string) {
      return !v || ValidationHelpers.isValidEmail(v);
    },
    message: 'Invalid email format',
  },

  phone: {
    validator: function (v: string) {
      return !v || ValidationHelpers.isValidPhone(v);
    },
    message: 'Invalid phone number format',
  },

  objectId: {
    validator: function (v: mongoose.Types.ObjectId) {
      return !v || mongoose.Types.ObjectId.isValid(v);
    },
    message: 'Invalid ObjectId format',
  },

  requiredObjectId: {
    validator: function (v: mongoose.Types.ObjectId) {
      return v && mongoose.Types.ObjectId.isValid(v);
    },
    message: 'Valid ObjectId is required',
  },

  sku: {
    validator: function (v: string) {
      return ValidationHelpers.isValidSKU(v);
    },
    message: 'SKU must be 3-50 characters with letters, numbers, hyphens, and underscores only',
  },

  price: {
    validator: function (v: number) {
      return ValidationHelpers.isValidPrice(v);
    },
    message: 'Price must be a positive number with maximum 2 decimal places',
  },

  discountPercent: {
    validator: function (v: number) {
      return ValidationHelpers.isValidDiscountPercent(v);
    },
    message: 'Discount must be between 0 and 100',
  },

  isoCode2: {
    validator: function (v: string) {
      return ValidationHelpers.isValidISOCode2(v);
    },
    message: 'ISO code must be exactly 2 uppercase letters',
  },

  isoCode3: {
    validator: function (v: string) {
      return ValidationHelpers.isValidISOCode3(v);
    },
    message: 'ISO code must be exactly 3 uppercase letters',
  },

  couponCode: {
    validator: function (v: string) {
      return ValidationHelpers.isValidCouponCode(v);
    },
    message:
      'Coupon code must be 3-20 characters with letters, numbers, hyphens, and underscores only',
  },
};

/**
 * Business rule validators
 */
export const BusinessValidators = {
  /**
   * Check if coupon is valid for use
   */
  isCouponValid: (coupon: any, cartTotal: number = 0): { valid: boolean; message?: string } => {
    if (!coupon.status) {
      return { valid: false, message: 'Coupon is inactive' };
    }

    const now = new Date();
    if (coupon.dateStart && now < coupon.dateStart) {
      return { valid: false, message: 'Coupon is not yet active' };
    }

    if (coupon.dateEnd && now > coupon.dateEnd) {
      return { valid: false, message: 'Coupon has expired' };
    }

    if (coupon.minAmount && cartTotal < coupon.minAmount) {
      return { valid: false, message: `Minimum order amount of ${coupon.minAmount} required` };
    }

    if (coupon.totalUses && coupon.totalUses <= 0) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }

    return { valid: true };
  },

  /**
   * Check if product is available for purchase
   */
  isProductAvailable: (product: any): { available: boolean; message?: string } => {
    if (!product.status) {
      return { available: false, message: 'Product is not available' };
    }

    return { available: true };
  },

  /**
   * Validate order total calculation
   */
  validateOrderTotal: (
    items: any[],
    expectedTotal: number
  ): { valid: boolean; message?: string } => {
    const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);

    if (Math.abs(calculatedTotal - expectedTotal) > 0.01) {
      return { valid: false, message: 'Order total mismatch' };
    }

    return { valid: true };
  },

  /**
   * Check if customer can place order
   */
  canCustomerPlaceOrder: (customer: any): { canOrder: boolean; message?: string } => {
    if (!customer.status) {
      return { canOrder: false, message: 'Customer account is inactive' };
    }

    if (customer.approved === false) {
      return { canOrder: false, message: 'Customer account is not approved' };
    }

    return { canOrder: true };
  },
};

/**
 * Sanitization helpers
 */
export const SanitizationHelpers = {
  /**
   * Sanitize string input
   */
  sanitizeString: (str: string): string => {
    if (!str || typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
  },

  /**
   * Sanitize email
   */
  sanitizeEmail: (email: string): string => {
    if (!email || typeof email !== 'string') return '';
    return email.trim().toLowerCase();
  },

  /**
   * Sanitize phone number
   */
  sanitizePhone: (phone: string): string => {
    if (!phone || typeof phone !== 'string') return '';
    return phone.replace(/\D/g, '');
  },

  /**
   * Sanitize and format SKU
   */
  sanitizeSKU: (sku: string): string => {
    if (!sku || typeof sku !== 'string') return '';
    return sku
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');
  },

  /**
   * Sanitize coupon code
   */
  sanitizeCouponCode: (code: string): string => {
    if (!code || typeof code !== 'string') return '';
    return code
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');
  },

  /**
   * Sanitize numeric input
   */
  sanitizeNumber: (num: any, defaultValue: number = 0): number => {
    const parsed = parseFloat(num);
    return isNaN(parsed) ? defaultValue : parsed;
  },

  /**
   * Sanitize boolean input
   */
  sanitizeBoolean: (bool: any, defaultValue: boolean = false): boolean => {
    if (typeof bool === 'boolean') return bool;
    if (typeof bool === 'string') {
      return bool.toLowerCase() === 'true' || bool === '1';
    }
    if (typeof bool === 'number') {
      return bool !== 0;
    }
    return defaultValue;
  },
};

export default {
  ValidationPatterns,
  ValidationHelpers,
  FieldValidators,
  BusinessValidators,
  SanitizationHelpers,
};
