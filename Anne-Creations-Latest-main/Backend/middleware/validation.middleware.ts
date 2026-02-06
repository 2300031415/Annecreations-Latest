import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationError } from 'express-validator';
import mongoose from 'mongoose';

import { AVAILABLE_FEATURES, Feature, PermissionAction } from '../types/models/role';
import { FEATURE_CONFIGS } from '../utils/permissions';

// ===== TYPES =====
interface ValidationErrorItem {
  field: string;
  message: string;
  value?: unknown;
}

interface ValidationResponse {
  message: string;
  errors: ValidationErrorItem[];
}

// ===== CUSTOM VALIDATORS =====
const isValidObjectId = (value: string) => {
  // Accept both 24-character hex strings and numeric strings from frontend
  if (typeof value === 'string') {
    // Check if it's a valid MongoDB ObjectId (24 hex chars)
    if (mongoose.Types.ObjectId.isValid(value)) {
      return true;
    }
    // Check if it's a numeric string (common frontend format)
    if (/^\d+$/.test(value)) {
      return true;
    }
  }
  return false;
};

const validateObjectIdString = (value: string) => {
  if (!isValidObjectId(value)) {
    throw new Error('Invalid ID format - must be a valid ObjectId or numeric string');
  }
  return true;
};

// ===== VALIDATION RESULT HANDLER =====
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors: ValidationErrorItem[] = errors.array().map((error: ValidationError) => ({
      field: error.type === 'field' ? error.path : error.type,
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    const response: ValidationResponse = {
      message: 'Validation failed',
      errors: formattedErrors,
    };

    res.status(400).json(response);
    return;
  }
  next();
};

// ===== COMMON VALIDATIONS =====
export const validateObjectId = param('id').custom(validateObjectIdString);

// Flexible ObjectId validation for any parameter name
export const validateObjectIdParam = (paramName: string) =>
  param(paramName).custom(validateObjectIdString);

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 5000 })
    .withMessage('Limit must be between 1 and 5000'),
  query('sort').optional().isString().withMessage('Sort field must be a string'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be either "asc" or "desc"'),
];

export const validateDateRange = [
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid ISO date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid ISO date'),
];

// ===== PRODUCT VALIDATIONS =====
export const validateProductCreate = [
  body('productModel')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Product model must be between 1 and 255 characters'),
  body('sku')
    .trim()
    .isLength({ min: 3, max: 100 })
    .matches(/^[A-Za-z0-9-_ ]+$/)
    .withMessage(
      'SKU must be 3-100 characters and contain only letters, numbers, hyphens, underscores, and spaces'
    ),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('stitches')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Stitches cannot exceed 100 characters'),
  body('dimensions')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Dimensions cannot exceed 100 characters'),
  body('colourNeedles')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Colour needles cannot exceed 100 characters'),
  body('languageId').optional().custom(validateObjectIdString).withMessage('Invalid language ID'),
  body('categories').isArray().withMessage('Categories must be an array'),
  body('categories.*').custom(validateObjectIdString).withMessage('Invalid category ID'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
  body('status').optional().isBoolean().withMessage('Status must be a boolean value'),
  body('image')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Image path cannot exceed 500 characters'),
  body('additionalImages').optional().isArray().withMessage('Additional images must be an array'),
  body('additionalImages.*.image')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Additional image path cannot exceed 500 characters'),
  body('additionalImages.*.sortOrder')
    .isInt({ min: 0 })
    .withMessage('Additional image sort order must be a non-negative integer'),
  body('options').optional().isArray().withMessage('Options must be an array'),
  body('options.*.option').custom(validateObjectIdString).withMessage('Invalid option ID'),
  body('options.*.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Option price must be a non-negative number'),
  body('options.*.file')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Option file path cannot exceed 500 characters'),
  body('options.*.fileSize')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('File size must be a non-negative number'),
  body('options.*.mimeType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('MIME type cannot exceed 100 characters'),
  body('options.*.downloadCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Download count must be a non-negative integer'),
  body('seo.metaTitle')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Meta title cannot exceed 255 characters'),
  body('seo.metaDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta description cannot exceed 500 characters'),
  body('seo.metaKeyword')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta keyword cannot exceed 500 characters'),
];

export const validateProductUpdate = [
  validateObjectId,
  body('productModel')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Product model must be between 1 and 255 characters'),
  body('sku')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .matches(/^[A-Za-z0-9-_ ]+$/)
    .withMessage(
      'SKU must be 3-100 characters and contain only letters, numbers, hyphens, underscores, and spaces'
    ),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('stitches')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Stitches cannot exceed 100 characters'),
  body('dimensions')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Dimensions cannot exceed 100 characters'),
  body('colourNeedles')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Colour needles cannot exceed 100 characters'),
  body('languageId').optional().custom(validateObjectIdString).withMessage('Invalid language ID'),
  body('categories').optional().isArray().withMessage('Categories must be an array'),
  body('categories.*').optional().custom(validateObjectIdString).withMessage('Invalid category ID'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
  body('status').optional().isBoolean().withMessage('Status must be a boolean value'),
  body('image')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Image path cannot exceed 500 characters'),
  body('additionalImages').optional().isArray().withMessage('Additional images must be an array'),
  body('additionalImages.*.image')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Additional image path cannot exceed 500 characters'),
  body('additionalImages.*.sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Additional image sort order must be a non-negative integer'),
  body('options').optional().isArray().withMessage('Options must be an array'),
  body('options.*.option')
    .optional()
    .custom(validateObjectIdString)
    .withMessage('Invalid option ID'),
  body('options.*.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Option price must be a non-negative number'),
  body('options.*.file')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Option file path cannot exceed 500 characters'),
  body('options.*.fileSize')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('File size must be a non-negative number'),
  body('options.*.mimeType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('MIME type cannot exceed 100 characters'),
  body('options.*.downloadCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Download count must be a non-negative integer'),
  body('seo.metaTitle')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Meta title cannot exceed 255 characters'),
  body('seo.metaDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta description cannot exceed 500 characters'),
  body('seo.metaKeyword')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta keyword cannot exceed 500 characters'),
];

export const validateProductSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('category').optional().custom(validateObjectIdString).withMessage('Invalid category ID'),
  query('status').optional().isIn(['true', 'false']).withMessage('Status must be true or false'),
  ...validatePagination,
];

// ===== CUSTOMER VALIDATIONS =====
export const validateSendOTP = [
  body('mobile')
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^[+]?[\d\s\-\\(\\)]+$/)
    .withMessage('Mobile number must be in a valid format'),
  body('email')
    .optional()
    .isEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be valid and not exceed 255 characters'),
];

export const validateCustomerRegister = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),
  body('email')
    .isEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be valid and not exceed 255 characters'),
  body('mobile')
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^[+]?[\d\s\-\\(\\)]+$/)
    .withMessage('Mobile number must be in a valid format'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
  body('password')
    .isLength({ min: 6, max: 40 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  }),
  body('newsletter').optional().isBoolean().withMessage('Newsletter must be a boolean value'),
];

export const validateCustomerLogin = [
  body('email').notEmpty().withMessage('Email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const validateCustomerUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be valid and not exceed 255 characters'),
  body('mobile')
    .optional()
    .matches(/^[+]?[\d\s\-\\(\\)]+$/)
    .withMessage('Mobile number must be in a valid format'),
  body('newsletter').optional().isBoolean().withMessage('Newsletter must be a boolean value'),
  body('password')
    .optional()
    .isLength({ min: 6, max: 40 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    // If password is provided, confirmPassword is required
    if (req.body.password && !value) {
      throw new Error('Password confirmation is required when password is provided');
    }
    // If password is provided, confirmPassword must match
    if (req.body.password && value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  }),
];

export const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6, max: 40 })
    .withMessage('New password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match new password');
    }
    return true;
  }),
];

export const validatePasswordReset = [body('email').isEmail().withMessage('Email must be valid')];

export const validatePasswordResetConfirm = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 6, max: 40 })
    .withMessage('New password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match new password');
    }
    return true;
  }),
];

export const validateAddress = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),
  body('addressLine1')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Address line 1 must be between 3 and 255 characters'),
  body('addressLine2')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address line 2 cannot exceed 255 characters'),
  body('city')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City must be between 1 and 100 characters'),
  body('postcode')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Postcode must be between 1 and 20 characters'),
  body('country').custom(validateObjectIdString).withMessage('Invalid country ID'),
  body('zone').optional().custom(validateObjectIdString).withMessage('Invalid zone ID'),
  body('preferedBillingAddress')
    .optional()
    .isBoolean()
    .withMessage('Preferred billing address must be a boolean value'),
];

export const validateCustomerSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('status').optional().isIn(['true', 'false']).withMessage('Status must be true or false'),
  query('newsletter')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Newsletter must be true or false'),
  ...validatePagination,
  ...validateDateRange,
];

// ===== ORDER VALIDATIONS =====
export const validateOrderCreate = [
  body('products').isArray({ min: 1 }).withMessage('At least one product is required'),
  body('products.*.product').custom(validateObjectIdString).withMessage('Invalid product ID'),
  body('products.*.options').isArray().withMessage('Product options must be an array'),
  body('products.*.options.*.option')
    .custom(validateObjectIdString)
    .withMessage('Invalid option ID'),
  body('products.*.options.*.price')
    .isFloat({ min: 0 })
    .withMessage('Option price must be non-negative'),
  body('products.*.options.*.file')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Option file path cannot exceed 500 characters'),
  body('orderTotal')
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage('Order total must be between 0 and 999,999.99'),
  body('paymentMethod')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Payment method is required and cannot exceed 100 characters'),
  body('paymentFirstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Payment first name must be between 1 and 100 characters'),
  body('paymentLastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Payment last name must be between 1 and 100 characters'),
  body('paymentCompany')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Payment company cannot exceed 200 characters'),
  body('paymentAddress1')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Payment address 1 must be between 3 and 255 characters'),
  body('paymentAddress2')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Payment address 2 cannot exceed 255 characters'),
  body('paymentCity')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Payment city must be between 1 and 100 characters'),
  body('paymentPostcode')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Payment postcode must be between 1 and 20 characters'),
  body('paymentCountry')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Payment country must be between 1 and 100 characters'),
  body('paymentZone')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Payment zone cannot exceed 100 characters'),
  body('coupon').optional().custom(validateObjectIdString).withMessage('Invalid coupon ID'),
];

export const validateOrderStatusUpdate = [
  validateObjectId,
  body('orderStatus')
    .isIn(['pending', 'paid', 'cancelled', 'refunded', 'failed'])
    .withMessage('Invalid order status'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  body('notify').optional().isBoolean().withMessage('Notify must be a boolean value'),
];

export const validateOrderSearch = [
  query('orderStatus')
    .optional()
    .isIn(['pending', 'paid', 'cancelled', 'refunded', 'failed'])
    .withMessage('Invalid order status'),
  query('customer').optional().custom(validateObjectIdString).withMessage('Invalid customer ID'),
  query('paymentMethod')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Payment method cannot exceed 100 characters'),
  ...validatePagination,
  ...validateDateRange,
];

// ===== COUPON VALIDATIONS =====
export const validateCouponCreate = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Coupon name must be between 3 and 255 characters'),
  body('code')
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage(
      'Coupon code must be 3-50 characters and contain only uppercase letters and numbers'
    ),
  body('type')
    .isIn(['F', 'P'])
    .withMessage('Coupon type must be either F (Fixed) or P (Percentage)'),
  body('discount').isFloat({ min: 0 }).withMessage('Discount must be a non-negative number'),
  body('logged').optional().isBoolean().withMessage('Logged must be a boolean value'),
  body('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a non-negative number'),
  body('maxDiscount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum discount must be a non-negative number'),
  body('dateStart').isISO8601().withMessage('Start date must be a valid ISO date'),
  body('dateEnd').isISO8601().withMessage('End date must be a valid ISO date'),
  body('totalUses')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total uses must be a non-negative integer'),
  body('customerUses')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Customer uses must be a non-negative integer'),
  body('status').optional().isBoolean().withMessage('Status must be a boolean value'),
];

export const validateCouponUpdate = [
  validateObjectId,
  ...validateCouponCreate.map(validation => validation.optional()),
];

// ===== CATEGORY VALIDATIONS =====
export const validateCategoryCreate = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Category name must be between 2 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('metaTitle')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Meta title cannot exceed 255 characters'),
  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta description cannot exceed 500 characters'),
  body('metaKeyword')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Meta keyword cannot exceed 255 characters'),
  body('image')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Image path cannot exceed 500 characters'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
  body('status').optional().isBoolean().withMessage('Status must be a boolean value'),
];

export const validateCategoryUpdate = [
  validateObjectId,
  ...validateCategoryCreate.map(validation => validation.optional()),
];

// ===== CART VALIDATIONS =====
export const validateAddToCart = [
  body('productId').custom(validateObjectIdString).withMessage('Invalid product ID'),
  // Note: Quantity removed for digital products - digital products don't have quantities
  body('options').optional().isArray().withMessage('Options must be an array'),
  body('options.*').custom(validateObjectIdString).withMessage('Invalid option ID'),
];

export const validateUpdateCartItem = [
  body('options').isArray().withMessage('Options must be an array'),
  body('options.*').custom(validateObjectIdString).withMessage('Invalid option ID'),
];

// ===== WISHLIST VALIDATIONS =====
export const validateAddToWishlist = [
  body('productId').custom(validateObjectIdString).withMessage('Invalid product ID'),
];

// ===== SEARCH VALIDATIONS =====
export const validateSearch = [
  query('search')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('category').optional().custom(validateObjectIdString).withMessage('Invalid category ID'),
  query('status').optional().isIn(['true', 'false']).withMessage('Status must be true or false'),
  ...validatePagination,
];

// ===== ADMIN VALIDATIONS =====
export const validateAdminCreate = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 32 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      'Username must be 3-32 characters and contain only letters, numbers, and underscores'
    ),
  body('password')
    .isLength({ min: 6, max: 40 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 32 })
    .withMessage('First name must be between 1 and 32 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 32 })
    .withMessage('Last name must be between 1 and 32 characters'),
  body('email')
    .isEmail()
    .isLength({ max: 96 })
    .withMessage('Email must be valid and not exceed 96 characters'),
  body('roleId').custom(validateObjectIdString).withMessage('Invalid role ID'),
  body('status').optional().isBoolean().withMessage('Status must be a boolean value'),
];

export const validateAdminUpdate = [
  validateObjectId,
  ...validateAdminCreate.map(validation => validation.optional()),
];

// ===== ZONE VALIDATIONS =====
export const validateZoneCreate = [
  body('country').custom(validateObjectIdString).withMessage('Invalid country ID'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 128 })
    .withMessage('Zone name must be between 1 and 128 characters'),
  body('code')
    .trim()
    .isLength({ min: 1, max: 32 })
    .withMessage('Zone code must be between 1 and 32 characters'),
  body('status').optional().isBoolean().withMessage('Status must be a boolean value'),
];

export const validateZoneUpdate = [
  validateObjectId,
  ...validateZoneCreate.map(validation => validation.optional()),
];

// ===== COUNTRY VALIDATIONS =====
export const validateCountryCreate = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 128 })
    .withMessage('Country name must be between 1 and 128 characters'),
  body('isoCode2')
    .trim()
    .isLength({ min: 1, max: 2 })
    .withMessage('ISO code 2 must be exactly 2 characters'),
  body('isoCode3')
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('ISO code 3 must be exactly 3 characters'),
  body('addressFormat')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Address format must be between 1 and 500 characters'),
  body('postcodeRequired')
    .optional()
    .isBoolean()
    .withMessage('Postcode required must be a boolean value'),
  body('status').optional().isBoolean().withMessage('Status must be a boolean value'),
];

export const validateCountryUpdate = [
  validateObjectId,
  ...validateCountryCreate.map(validation => validation.optional()),
];

// ===== LANGUAGE VALIDATIONS =====
export const validateLanguageCreate = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 64 })
    .withMessage('Language name must be between 1 and 64 characters'),
  body('code')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Language code must be between 1 and 10 characters'),
  body('locale')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Locale must be between 1 and 10 characters'),
  body('image')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Image path cannot exceed 500 characters'),
  body('directory')
    .optional()
    .trim()
    .isLength({ max: 64 })
    .withMessage('Directory cannot exceed 64 characters'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
  body('status').optional().isBoolean().withMessage('Status must be a boolean value'),
];

export const validateLanguageUpdate = [
  validateObjectId,
  ...validateLanguageCreate.map(validation => validation.optional()),
];

// ===== OPTION VALIDATIONS =====
export const validateOptionCreate = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 128 })
    .withMessage('Option name must be between 1 and 128 characters'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
  body('status').optional().isBoolean().withMessage('Status must be a boolean value'),
];

export const validateOptionUpdate = [
  validateObjectId,
  ...validateOptionCreate.map(validation => validation.optional()),
];

// ===== MIGRATION STATUS VALIDATIONS =====
export const validateMigrationStatusCreate = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Migration name must be between 1 and 255 characters'),
  body('migratedDetails').isArray().withMessage('Migrated details must be an array'),
  body('migratedDetails.*.tableName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Table name must be between 1 and 100 characters'),
  body('migratedDetails.*.processed')
    .isInt({ min: 0 })
    .withMessage('Processed count must be a non-negative integer'),
  body('migratedDetails.*.succeeded')
    .isInt({ min: 0 })
    .withMessage('Succeeded count must be a non-negative integer'),
  body('migratedDetails.*.failed')
    .isInt({ min: 0 })
    .withMessage('Failed count must be a non-negative integer'),
  body('migratedDetails.*.batchSize')
    .isInt({ min: 1 })
    .withMessage('Batch size must be at least 1'),
  body('migratedDetails.*.lastBatchSize')
    .isInt({ min: 0 })
    .withMessage('Last batch size must be a non-negative integer'),
  body('migratedDetails.*.totalBatches')
    .isInt({ min: 0 })
    .withMessage('Total batches must be a non-negative integer'),
  body('migratedDetails.*.status')
    .isIn(['pending', 'inProgress', 'completed', 'failed'])
    .withMessage('Status must be one of: pending, inProgress, completed, failed'),
  body('durationSeconds').isInt({ min: 0 }).withMessage('Duration must be a non-negative integer'),
  body('status')
    .isIn(['pending', 'inProgress', 'completed', 'failed'])
    .withMessage('Status must be one of: pending, inProgress, completed, failed'),
  body('startedAt').optional().isISO8601().withMessage('Started at must be a valid ISO date'),
  body('completedAt').optional().isISO8601().withMessage('Completed at must be a valid ISO date'),
];

export const validateMigrationStatusUpdate = [
  validateObjectId,
  ...validateMigrationStatusCreate.map(validation => validation.optional()),
];

// ===== ONLINE USER VALIDATIONS =====
export const validateOnlineUserCreate = [
  body('customer').optional().custom(validateObjectIdString).withMessage('Invalid customer ID'),
  body('ipAddress')
    .trim()
    .isLength({ min: 7, max: 45 })
    .withMessage('IP address must be between 7 and 45 characters'),
  body('userAgent')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('User agent cannot exceed 500 characters'),
  body('lastActivity').isISO8601().withMessage('Last activity must be a valid ISO date'),
  body('pageUrl')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Page URL cannot exceed 500 characters'),
];

export const validateOnlineUserUpdate = [
  validateObjectId,
  ...validateOnlineUserCreate.map(validation => validation.optional()),
];

// ===== AUDIT LOG VALIDATIONS =====
export const validateAuditLogCreate = [
  body('user').optional().custom(validateObjectIdString).withMessage('Invalid user ID'),
  body('userType')
    .isIn(['customer', 'admin'])
    .withMessage('User type must be either customer or admin'),
  body('username')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Username cannot exceed 100 characters'),
  body('email')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Email cannot exceed 255 characters'),
  body('ipAddress')
    .optional()
    .trim()
    .isLength({ max: 45 })
    .withMessage('IP address cannot exceed 45 characters'),
  body('action')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Action must be between 1 and 100 characters'),
  body('entityType')
    .isIn([
      'Product',
      'Customer',
      'Order',
      'Admin',
      'Category',
      'Language',
      'Country',
      'Zone',
      'Wishlist',
      'Cart',
      'SearchLog',
      'UserActivity',
      'OnlineUser',
    ])
    .withMessage('Invalid entity type'),
  body('productId').optional().custom(validateObjectIdString).withMessage('Invalid product ID'),
  body('orderId').optional().custom(validateObjectIdString).withMessage('Invalid order ID'),
  body('customerId').optional().custom(validateObjectIdString).withMessage('Invalid customer ID'),
  body('categoryId').optional().custom(validateObjectIdString).withMessage('Invalid category ID'),
  body('adminId').optional().custom(validateObjectIdString).withMessage('Invalid admin ID'),
  body('entityId').optional().isString().withMessage('Entity ID must be a string'),
  body('previousState').optional().isObject().withMessage('Previous state must be an object'),
  body('newState').optional().isObject().withMessage('New state must be an object'),
  body('details')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Details cannot exceed 1000 characters'),
];

export const validateAuditLogUpdate = [
  validateObjectId,
  ...validateAuditLogCreate.map(validation => validation.optional()),
];

// ===== USER ACTIVITY VALIDATIONS =====
export const validateUserActivityCreate = [
  body('customer').optional().custom(validateObjectIdString).withMessage('Invalid customer ID'),
  body('action')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Action must be between 1 and 100 characters'),
  body('entityType')
    .optional()
    .isIn([
      'Product',
      'Order',
      'Customer',
      'Category',
      'Cart',
      'Wishlist',
      'Search',
      'Auth',
      'Other',
    ])
    .withMessage('Invalid entity type'),
  body('productId').optional().custom(validateObjectIdString).withMessage('Invalid product ID'),
  body('orderId').optional().custom(validateObjectIdString).withMessage('Invalid order ID'),
  body('categoryId').optional().custom(validateObjectIdString).withMessage('Invalid category ID'),
  body('entityId').optional().isString().withMessage('Entity ID must be a string'),
  body('activityData').optional().isObject().withMessage('Activity data must be an object'),
  body('ipAddress')
    .optional()
    .trim()
    .isLength({ max: 45 })
    .withMessage('IP address cannot exceed 45 characters'),
  body('userAgent')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('User agent cannot exceed 500 characters'),
  body('browserId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Browser ID cannot exceed 100 characters'),
  body('source')
    .optional()
    .isIn(['web', 'mobile'])
    .withMessage('Source must be either web or mobile'),
  body('lastActivity').optional().isISO8601().withMessage('Last activity must be a valid ISO date'),
];

export const validateUserActivityUpdate = [
  validateObjectId,
  ...validateUserActivityCreate.map(validation => validation.optional()),
];

// ===== SEARCH LOG VALIDATIONS =====
export const validateSearchLogCreate = [
  body('query')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Query must be between 1 and 500 characters'),
  body('customerId').optional().custom(validateObjectIdString).withMessage('Invalid customer ID'),
  body('ipAddress')
    .optional()
    .trim()
    .isLength({ max: 45 })
    .withMessage('IP address cannot exceed 45 characters'),
  body('userAgent')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('User agent cannot exceed 500 characters'),
  body('resultsCount')
    .isInt({ min: 0 })
    .withMessage('Results count must be a non-negative integer'),
  body('searchTime').isFloat({ min: 0 }).withMessage('Search time must be a non-negative number'),
  body('filters').optional().isObject().withMessage('Filters must be an object'),
];

export const validateSearchLogUpdate = [
  validateObjectId,
  ...validateSearchLogCreate.map(validation => validation.optional()),
];

// ===== WISHLIST VALIDATIONS =====
export const validateWishlistCreate = [
  body('customerId').custom(validateObjectIdString).withMessage('Invalid customer ID'),
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.product').custom(validateObjectIdString).withMessage('Invalid product ID'),
];

export const validateWishlistUpdate = [
  validateObjectId,
  ...validateWishlistCreate.map(validation => validation.optional()),
];

// ===== EXPORT ALL VALIDATIONS =====
export default {
  // Common validations
  handleValidationErrors,
  validateObjectId,
  validatePagination,
  validateDateRange,

  // Product validations
  validateProductCreate,
  validateProductUpdate,
  validateProductSearch,

  // Customer validations
  validateSendOTP,
  validateCustomerRegister,
  validateCustomerLogin,
  validateCustomerUpdate,
  validatePasswordChange,
  validatePasswordReset,
  validatePasswordResetConfirm,
  validateAddress,
  validateCustomerSearch,

  // Order validations
  validateOrderCreate,
  validateOrderStatusUpdate,
  validateOrderSearch,

  // Coupon validations
  validateCouponCreate,
  validateCouponUpdate,

  // Category validations
  validateCategoryCreate,
  validateCategoryUpdate,

  // Cart validations
  validateAddToCart,
  validateUpdateCartItem,

  // Wishlist validations
  validateAddToWishlist,
  validateWishlistCreate,
  validateWishlistUpdate,

  // Search validations
  validateSearch,

  // Admin validations
  validateAdminCreate,
  validateAdminUpdate,

  // Zone validations
  validateZoneCreate,
  validateZoneUpdate,

  // Country validations
  validateCountryCreate,
  validateCountryUpdate,

  // Language validations
  validateLanguageCreate,
  validateLanguageUpdate,

  // Option validations
  validateOptionCreate,
  validateOptionUpdate,

  // Migration Status validations
  validateMigrationStatusCreate,
  validateMigrationStatusUpdate,

  // Online User validations
  validateOnlineUserCreate,
  validateOnlineUserUpdate,

  // Audit Log validations
  validateAuditLogCreate,
  validateAuditLogUpdate,

  // User Activity validations
  validateUserActivityCreate,
  validateUserActivityUpdate,

  // Search Log validations
  validateSearchLogCreate,
  validateSearchLogUpdate,
};

// ===== ROLE VALIDATIONS =====
export const validateRoleCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters')
    .custom(value => {
      // Prevent creating a role named 'superAdmin'
      if (value.toLowerCase() === 'superadmin') {
        throw new Error('Cannot create a role named superAdmin');
      }
      return true;
    }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('permissions').isArray({ min: 0 }).withMessage('Permissions must be an array'),
  body('permissions.*.feature')
    .notEmpty()
    .withMessage('Feature is required for each permission')
    .isIn(AVAILABLE_FEATURES)
    .withMessage('Invalid feature'),
  body('permissions.*.create')
    .optional()
    .isBoolean()
    .withMessage('Create permission must be a boolean'),
  body('permissions.*.read')
    .optional()
    .isBoolean()
    .withMessage('Read permission must be a boolean'),
  body('permissions.*.update')
    .optional()
    .isBoolean()
    .withMessage('Update permission must be a boolean'),
  body('permissions.*.delete')
    .optional()
    .isBoolean()
    .withMessage('Delete permission must be a boolean'),
  body('status').optional().isBoolean().withMessage('Status must be a boolean'),
];

export const validateRoleUpdate = [
  param('id').notEmpty().withMessage('Role ID is required').custom(validateObjectIdString),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters')
    .custom(value => {
      // Prevent renaming to 'superAdmin'
      if (value && value.toLowerCase() === 'superadmin') {
        throw new Error('Cannot rename role to superAdmin');
      }
      return true;
    }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('permissions').optional().isArray({ min: 0 }).withMessage('Permissions must be an array'),
  body('permissions.*.feature').optional().isIn(AVAILABLE_FEATURES).withMessage('Invalid feature'),
  body('permissions.*.create')
    .optional()
    .isBoolean()
    .withMessage('Create permission must be a boolean'),
  body('permissions.*.read')
    .optional()
    .isBoolean()
    .withMessage('Read permission must be a boolean'),
  body('permissions.*.update')
    .optional()
    .isBoolean()
    .withMessage('Update permission must be a boolean'),
  body('permissions.*.delete')
    .optional()
    .isBoolean()
    .withMessage('Delete permission must be a boolean'),
  body('permissions')
    .optional()
    .custom((permissions, { req }) => {
      if (!Array.isArray(permissions)) return true;

      for (let i = 0; i < permissions.length; i++) {
        const perm = permissions[i];
        const feature = perm.feature as Feature;
        const featureConfig = FEATURE_CONFIGS[feature];

        if (!featureConfig) continue;

        // Check if trying to set actions that are not allowed for the feature
        if (
          perm.create === true &&
          !featureConfig.allowedActions.includes(PermissionAction.CREATE)
        ) {
          throw new Error(
            `Feature '${perm.feature}' does not support 'create' action. Only allowed actions: ${featureConfig.allowedActions.join(', ')}`
          );
        }
        if (
          perm.update === true &&
          !featureConfig.allowedActions.includes(PermissionAction.UPDATE)
        ) {
          throw new Error(
            `Feature '${perm.feature}' does not support 'update' action. Only allowed actions: ${featureConfig.allowedActions.join(', ')}`
          );
        }
        if (
          perm.delete === true &&
          !featureConfig.allowedActions.includes(PermissionAction.DELETE)
        ) {
          throw new Error(
            `Feature '${perm.feature}' does not support 'delete' action. Only allowed actions: ${featureConfig.allowedActions.join(', ')}`
          );
        }
      }
      return true;
    })
    .withMessage('Invalid permissions - some features do not support the requested actions'),
  body('status').optional().isBoolean().withMessage('Status must be a boolean'),
];

export const validatePermissions = [
  body('permissions').isArray({ min: 1 }).withMessage('At least one permission is required'),
  body('permissions.*.feature')
    .notEmpty()
    .withMessage('Feature is required')
    .isIn(AVAILABLE_FEATURES)
    .withMessage('Invalid feature'),
  body('permissions.*.create').isBoolean().withMessage('Create permission must be a boolean'),
  body('permissions.*.read').isBoolean().withMessage('Read permission must be a boolean'),
  body('permissions.*.update').isBoolean().withMessage('Update permission must be a boolean'),
  body('permissions.*.delete').isBoolean().withMessage('Delete permission must be a boolean'),
];
