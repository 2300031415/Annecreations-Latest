// routes/customer.routes.ts
import express from 'express';

import customerController from '../controllers/customer.controller';
import { authenticateAdmin, authenticateCustomer } from '../middleware/auth.middleware';
import { validateOTPSecurity } from '../middleware/otpSecurity.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import {
  customerListLimiter,
  customerLoginLimiter,
  customerRegistrationLimiter,
  passwordResetLimiter,
  // otpRequestLimiter,
} from '../middleware/rate-limit.middleware';
import {
  validateObjectId,
  validatePagination,
  validateCustomerUpdate,
  validateCustomerLogin,
  validateSendOTP,
  validateCustomerRegister,
  validatePasswordChange,
  validatePasswordResetConfirm,
  handleValidationErrors,
} from '../middleware/validation.middleware';
import { Feature, PermissionAction } from '../types/models/role';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - mobile
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique customer identifier
 *           example: "507f1f77bcf86cd799439011"
 *         languageId:
 *           type: string
 *           description: Language ID reference (optional, defaults to English)
 *           example: "507f1f77bcf86cd799439012"
 *         firstName:
 *           type: string
 *           maxLength: 100
 *           description: Customer first name
 *           example: "John"
 *         lastName:
 *           type: string
 *           maxLength: 100
 *           description: Customer last name
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           description: Customer email address
 *           example: "john.doe@example.com"
 *         mobile:
 *           type: string
 *           maxLength: 20
 *           description: Customer mobile number
 *           example: "+1234567890"
 *         status:
 *           type: boolean
 *           default: true
 *           description: Customer account status
 *           example: true
 *         newsletter:
 *           type: boolean
 *           default: false
 *           description: Newsletter subscription status
 *           example: false
 *         emailVerified:
 *           type: boolean
 *           default: false
 *           description: Email verification status
 *           example: true
 *         mobileVerified:
 *           type: boolean
 *           default: false
 *           description: Mobile verification status
 *           example: false
 *         totalLogins:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Total number of logins
 *           example: 15
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *           example: "2024-01-15T10:30:00Z"
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CustomerAddress'
 *           description: Customer addresses
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     CustomerAddress:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - addressLine1
 *         - city
 *         - postcode
 *         - country
 *       properties:
 *         firstName:
 *           type: string
 *           maxLength: 100
 *           description: Address first name
 *           example: "John"
 *         lastName:
 *           type: string
 *           maxLength: 100
 *           description: Address last name
 *           example: "Doe"
 *         company:
 *           type: string
 *           maxLength: 200
 *           description: Company name (optional)
 *           example: "Acme Corp"
 *         addressLine1:
 *           type: string
 *           maxLength: 255
 *           description: Primary address line
 *           example: "123 Main Street"
 *         addressLine2:
 *           type: string
 *           maxLength: 255
 *           description: Secondary address line (optional)
 *           example: "Apt 4B"
 *         city:
 *           type: string
 *           maxLength: 100
 *           description: City name
 *           example: "New York"
 *         postcode:
 *           type: string
 *           maxLength: 20
 *           description: Postal/ZIP code
 *           example: "10001"
 *         country:
 *           type: string
 *           description: Country ID reference
 *           example: "507f1f77bcf86cd799439013"
 *         zone:
 *           type: string
 *           description: Zone/State ID reference (optional)
 *           example: "507f1f77bcf86cd799439014"
 *         preferedBillingAddress:
 *           type: boolean
 *           default: false
 *           description: Whether this is the preferred billing address
 *           example: true
 *
 *     CustomerLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Customer email address
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Customer password
 *           example: "password123"
 *
 *     CustomerCreate:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - mobile
 *         - password
 *       properties:
 *         languageId:
 *           type: string
 *           description: Language ID reference (optional, defaults to English) (optional, defaults to en-gb language)
 *           example: "507f1f77bcf86cd799439012"
 *         firstName:
 *           type: string
 *           maxLength: 100
 *           description: Customer first name
 *           example: "John"
 *         lastName:
 *           type: string
 *           maxLength: 100
 *           description: Customer last name
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           description: Customer email address
 *           example: "john.doe@example.com"
 *         mobile:
 *           type: string
 *           maxLength: 20
 *           description: Customer mobile number
 *           example: "+1234567890"
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Customer password
 *           example: "password123"
 *         confirmPassword:
 *           type: string
 *           minLength: 6
 *           description: Password confirmation (must match password)
 *           example: "password123"
 *         newsletter:
 *           type: boolean
 *           default: false
 *           description: Newsletter subscription preference
 *           example: false
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CustomerAddress'
 *           description: Customer addresses (optional)
 *
 *     CustomerUpdate:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           maxLength: 100
 *           description: Customer first name (optional)
 *         lastName:
 *           type: string
 *           maxLength: 100
 *           description: Customer last name (optional)
 *         mobile:
 *           type: string
 *           maxLength: 20
 *           description: Customer mobile number (optional)
 *         newsletter:
 *           type: boolean
 *           description: Newsletter subscription preference (optional)
 *         password:
 *           type: string
 *           minLength: 6
 *           maxLength: 40
 *           description: New password (optional, minimum 6 characters)
 *         confirmPassword:
 *           type: string
 *           minLength: 6
 *           maxLength: 40
 *           description: Password confirmation (required if password is provided, must match password)
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CustomerAddress'
 *           description: Customer addresses (optional)
 *
 *     CustomerAuthResponse:
 *       type: object
 *       properties:
 *         customer:
 *           $ref: '#/components/schemas/Customer'
 *         accessToken:
 *           type: string
 *           description: JWT access token
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         refreshToken:
 *           type: string
 *           description: JWT refresh token
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *     CustomerPasswordReset:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Customer email address
 *           example: "john.doe@example.com"
 *
 *     CustomerPasswordUpdate:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: Current password
 *           example: "oldpassword123"
 *         newPassword:
 *           type: string
 *           minLength: 6
 *           description: New password
 *           example: "newpassword123"
 */

// === PUBLIC ROUTES ===

/**
 * @swagger
 * /customers/login:
 *   post:
 *     summary: Customer login
 *     description: Authenticate a customer and return access tokens for API access
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerLogin'
 *           examples:
 *             loginExample:
 *               summary: Login example
 *               value:
 *                 email: "john.doe@example.com"
 *                 password: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customer:
 *                   $ref: '#/components/schemas/Customer'
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             examples:
 *               success:
 *                 summary: Successful login
 *                 value:
 *                   customer:
 *                     _id: "507f1f77bcf86cd799439011"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                     email: "john.doe@example.com"
 *                     status: true
 *                     totalLogins: 16
 *                   accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation error - Invalid email format or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validationError:
 *                 summary: Validation error
 *                 value:
 *                   message: "Invalid email format"
 *                   error: "VALIDATION_ERROR"
 *                   type: "VALIDATION_ERROR"
 *       401:
 *         description: Authentication failed - Invalid credentials, account disabled, or email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidCredentials:
 *                 summary: Invalid credentials
 *                 value:
 *                   message: "Invalid email or password"
 *                   error: "INVALID_CREDENTIALS"
 *                   type: "AUTH_ERROR"
 *               accountDisabled:
 *                 summary: Account disabled
 *                 value:
 *                   message: "Account is disabled"
 *                   error: "ACCOUNT_DISABLED"
 *                   type: "AUTH_ERROR"
 *               emailNotVerified:
 *                 summary: Email not verified
 *                 value:
 *                   message: "Please verify your email address before logging in. Check your email for verification instructions."
 *                   emailVerificationRequired: true
 *                   error: "EMAIL_NOT_VERIFIED"
 *                   type: "AUTH_ERROR"
 *       429:
 *         description: Too many login attempts - Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               rateLimitExceeded:
 *                 summary: Rate limit exceeded
 *                 value:
 *                   message: "Too many login attempts. Please try again later."
 *                   error: "RATE_LIMIT_EXCEEDED"
 *                   type: "RATE_LIMIT_ERROR"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               serverError:
 *                 summary: Server error
 *                 value:
 *                   message: "Internal server error"
 *                   error: "INTERNAL_ERROR"
 *                   type: "SERVER_ERROR"
 */
router.post(
  '/login',
  // customerLoginLimiter,
  validateCustomerLogin,
  handleValidationErrors,
  customerController.loginCustomer
);

/**
 * @swagger
 * /customers/send-otp:
 *   post:
 *     summary: Send OTP for registration
 *     description: |
 *       Send OTP to mobile number for customer registration with HMAC signature authentication.
 *
 *       **Security Requirements:**
 *       - Must include `X-Client-Source` header (mobile or web)
 *       - Must include `X-Signature` header (HMAC SHA256 of request payload)
 *
 *       **Signature Generation:**
 *       1. Create payload string: `mobile=9876543210`
 *       2. Generate HMAC: `HMAC-SHA256(payload, SECRET_KEY)`
 *       3. Send as hex string in `X-Signature` header
 *
 *       **Note:** Each signature can only be used once (replay protection).
 *     tags: [Customers]
 *     parameters:
 *       - in: header
 *         name: X-Client-Source
 *         required: true
 *         schema:
 *           type: string
 *           enum: [mobile, web]
 *         description: Client source identifier (mobile app or web)
 *         example: mobile
 *       - in: header
 *         name: X-Signature
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-f0-9]{64}$'
 *         description: HMAC SHA256 signature of request payload (64 character hex string)
 *         example: "7f3a9b2c4d1e6f8a5b9c2d4e7f1a3b6c8d2e5f7a9b3c6d8e1f4a7b9c2d5e7f1a"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *             properties:
 *               mobile:
 *                 type: string
 *                 description: Mobile number to receive OTP
 *                 example: "9876543210"
 *           examples:
 *             mobileApp:
 *               summary: Mobile app request
 *               value:
 *                 mobile: "9876543210"
 *             webRequest:
 *               summary: Web request
 *               value:
 *                 mobile: "9123456789"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully to your mobile number"
 *                 expiresIn:
 *                   type: number
 *                   description: OTP expiration time in seconds (10 minutes)
 *                   example: 600
 *                 canResendAfter:
 *                   type: number
 *                   description: Seconds to wait before requesting another OTP
 *                   example: 60
 *                 remainingRequests:
 *                   type: number
 *                   description: Number of OTP requests remaining for this mobile
 *                   example: 4
 *                 maxRequests:
 *                   type: number
 *                   description: Maximum OTP requests allowed per mobile in time window
 *                   example: 5
 *                 resetIn:
 *                   type: number
 *                   description: Seconds until OTP quota resets
 *                   example: 900
 *             examples:
 *               success:
 *                 summary: OTP sent successfully
 *                 value:
 *                   message: "OTP sent successfully to your mobile number"
 *                   expiresIn: 600
 *                   canResendAfter: 60
 *                   remainingRequests: 4
 *                   maxRequests: 5
 *                   resetIn: 900
 *       400:
 *         description: Validation error - Invalid mobile number format or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidMobile:
 *                 summary: Invalid mobile number
 *                 value:
 *                   message: "Invalid phone number format"
 *                   error: "VALIDATION_ERROR"
 *               missingMobile:
 *                 summary: Missing mobile number
 *                 value:
 *                   message: "Mobile number is required"
 *                   error: "VALIDATION_ERROR"
 *       403:
 *         description: Security validation failed - Missing or invalid signature/headers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 *             examples:
 *               missingSignature:
 *                 summary: Missing signature header
 *                 value:
 *                   message: "Missing authentication signature"
 *                   error: "MISSING_SIGNATURE"
 *                   details: "Request must include X-Signature header"
 *               invalidSignature:
 *                 summary: Invalid signature
 *                 value:
 *                   message: "Invalid authentication signature"
 *                   error: "INVALID_SIGNATURE"
 *               signatureUsed:
 *                 summary: Signature already used (replay attack)
 *                 value:
 *                   message: "This request has already been processed"
 *                   error: "SIGNATURE_ALREADY_USED"
 *               invalidClientSource:
 *                 summary: Invalid or missing client source
 *                 value:
 *                   message: "SMS OTP is only available through the official mobile app or website"
 *                   error: "UNAUTHORIZED_CLIENT"
 *               unauthorizedOrigin:
 *                 summary: Unauthorized web origin (web requests only)
 *                 value:
 *                   message: "SMS OTP is only available through the official website"
 *                   error: "UNAUTHORIZED_ORIGIN"
 *       409:
 *         description: Conflict - Mobile number already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               mobileExists:
 *                 summary: Mobile already registered
 *                 value:
 *                   message: "Mobile number already registered"
 *                   error: "DUPLICATE_MOBILE"
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 waitTime:
 *                   type: integer
 *                 canResendAt:
 *                   type: string
 *                   format: date-time
 *                 remainingRequests:
 *                   type: integer
 *                 maxRequests:
 *                   type: integer
 *                 resetAt:
 *                   type: string
 *                   format: date-time
 *                 waitMinutes:
 *                   type: integer
 *             examples:
 *               cooldownActive:
 *                 summary: Cooldown period active (60 seconds between requests)
 *                 value:
 *                   message: "Please wait 45 seconds before requesting a new OTP"
 *                   waitTime: 45
 *                   canResendAt: "2024-10-21T10:00:45.000Z"
 *               rateLimitExceeded:
 *                 summary: Rate limit exceeded (5 per 15 minutes per mobile)
 *                 value:
 *                   message: "Maximum OTP requests exceeded for this mobile number. Please try again in 8 minutes."
 *                   remainingRequests: 0
 *                   maxRequests: 5
 *                   resetAt: "2024-10-21T10:23:15.000Z"
 *                   waitMinutes: 8
 *       500:
 *         description: Internal server error - Failed to send OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               smsFailed:
 *                 summary: SMS service failed
 *                 value:
 *                   message: "Failed to send OTP. Please try again."
 *                   error: "SMS_SERVICE_ERROR"
 *               serverError:
 *                 summary: Server configuration error
 *                 value:
 *                   message: "Server configuration error"
 *                   error: "MISSING_SECRET_KEY"
 */
router.post(
  '/send-otp',
  validateOTPSecurity(), // Dynamic signature validation
  validateSendOTP, // Request body validation
  handleValidationErrors,
  customerController.sendRegistrationOTP
);

/**
 * @swagger
 * /customers/register:
 *   post:
 *     summary: Customer registration
 *     description: Register a new customer account with OTP validation. OTP must be requested first via /send-otp endpoint.
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CustomerCreate'
 *               - type: object
 *                 required:
 *                   - otp
 *                 properties:
 *                   otp:
 *                     type: string
 *                     description: 6-digit OTP received on mobile
 *                     example: "123456"
 *           examples:
 *             registrationExample:
 *               summary: Registration example
 *               value:
 *                 languageId: "507f1f77bcf86cd799439012"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 email: "john.doe@example.com"
 *                 mobile: "+919876543210"
 *                 otp: "123456"
 *                 password: "password123"
 *                 confirmPassword: "password123"
 *                 newsletter: false
 *     responses:
 *       201:
 *         description: Registration successful - Account created with mobile verified, email verification sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Registration successful. Please check your email to verify your account and complete the registration."
 *                 emailVerificationRequired:
 *                   type: boolean
 *                   example: true
 *                 mobileVerified:
 *                   type: boolean
 *                   example: true
 *             examples:
 *               success:
 *                 summary: Successful registration
 *                 value:
 *                   message: "Registration successful. Please check your email to verify your account and complete the registration."
 *                   emailVerificationRequired: true
 *                   mobileVerified: true
 *       400:
 *         description: Validation error, invalid OTP, or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     remainingAttempts:
 *                       type: integer
 *             examples:
 *               validationError:
 *                 summary: Validation error
 *                 value:
 *                   message: "OTP is required"
 *                   error: "VALIDATION_ERROR"
 *               invalidOTP:
 *                 summary: Invalid OTP with remaining attempts
 *                 value:
 *                   message: "Invalid OTP"
 *                   remainingAttempts: 3
 *               invalidOTPLastAttempt:
 *                 summary: Invalid OTP - last attempt
 *                 value:
 *                   message: "Invalid OTP"
 *                   remainingAttempts: 0
 *               expiredOTP:
 *                 summary: OTP expired or not found
 *                 value:
 *                   message: "Invalid or expired OTP. Please request a new OTP."
 *               invalidMobileFormat:
 *                 summary: Invalid mobile number format
 *                 value:
 *                   message: "Invalid phone number format"
 *       409:
 *         description: Conflict - Mobile number or email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               emailExists:
 *                 summary: Email already registered
 *                 value:
 *                   message: "Email already registered"
 *                   error: "EMAIL_EXISTS"
 *               mobileExists:
 *                 summary: Mobile already registered
 *                 value:
 *                   message: "Mobile number already registered"
 *                   error: "MOBILE_EXISTS"
 *       429:
 *         description: Too many attempts - Rate limit exceeded or max OTP verification attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               rateLimitExceeded:
 *                 summary: Rate limit exceeded
 *                 value:
 *                   message: "Too many registration attempts, please try again later"
 *                   error: "RATE_LIMIT_EXCEEDED"
 *               maxOTPAttemptsExceeded:
 *                 summary: Maximum OTP verification attempts exceeded
 *                 value:
 *                   message: "Maximum OTP verification attempts exceeded. Please request a new OTP."
 *                   error: "MAX_ATTEMPTS_EXCEEDED"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               serverError:
 *                 summary: Server error
 *                 value:
 *                   message: "Registration failed. Please try again."
 *                   error: "INTERNAL_ERROR"
 */
router.post(
  '/register',
  // customerRegistrationLimiter,
  validateCustomerRegister,
  handleValidationErrors,
  customerController.registerCustomer
);

/**
 * @swagger
 * /customers/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a refresh token
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: JWT refresh token
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: New JWT access token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   description: New JWT refresh token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh-token', customerController.refreshAccessToken);

/**
 * @swagger
 * /customers/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: Initiate password reset process
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer email address
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Password reset initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "If email exists, reset link has been sent"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/forgot-password',
  // passwordResetLimiter,
  customerController.forgotPassword
);

/**
 * @swagger
 * /customers/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset password using reset token
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password
 *             required:
 *               - token
 *               - newPassword
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully"
 *       400:
 *         description: Invalid or expired reset token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/reset-password',
  validatePasswordResetConfirm,
  handleValidationErrors,
  customerController.resetPassword
);

/**
 * @swagger
 * /customers/verify-email:
 *   post:
 *     summary: Verify email address
 *     description: Verify customer email address using verification token
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Email verification token
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer email address
 *             required:
 *               - token
 *               - email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email verified successfully. Welcome to AnneCreations Hub!"
 *       400:
 *         description: Invalid or expired verification token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-email', customerController.verifyEmail);

/**
 * @swagger
 * /customers/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     description: Resend email verification link to customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer email address
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Verification email sent (if email exists and is unverified)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "If the email exists and is unverified, a verification email has been sent."
 *       400:
 *         description: Email already verified or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/resend-verification', customerController.resendVerificationEmail);

// === CUSTOMER AUTHENTICATED ROUTES ===

/**
 * @swagger
 * /customers/profile:
 *   get:
 *     summary: Get customer profile
 *     description: Retrieve the current customer's profile information
 *     tags: [Customers - Authenticated]
 *     security:
 *       - customerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Customer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', authenticateCustomer, customerController.getProfile);

/**
 * @swagger
 * /customers/profile:
 *   put:
 *     summary: Update customer profile
 *     description: Update the current customer's profile information
 *     tags: [Customers - Authenticated]
 *     security:
 *       - customerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 maxLength: 100
 *               lastName:
 *                 type: string
 *                 maxLength: 100
 *               mobile:
 *                 type: string
 *                 maxLength: 20
 *               newsletter:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Customer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/profile',
  authenticateCustomer,
  validateCustomerUpdate,
  handleValidationErrors,
  customerController.updateProfile
);

/**
 * @swagger
 * /customers/change-password:
 *   post:
 *     summary: Change password
 *     description: Change the current customer's password
 *     tags: [Customers - Authenticated]
 *     security:
 *       - customerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password
 *             required:
 *               - currentPassword
 *               - newPassword
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *       400:
 *         description: Current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Customer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/change-password',
  authenticateCustomer,
  validatePasswordChange,
  handleValidationErrors,
  customerController.changePassword
);

/**
 * @swagger
 * /customers/addresses:
 *   get:
 *     summary: Get customer addresses
 *     description: Retrieve all addresses for the current customer
 *     tags: [Customers - Authenticated]
 *     security:
 *       - customerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CustomerAddress'
 *                 message:
 *                   type: string
 *                   example: "Addresses retrieved successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Customer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/addresses', authenticateCustomer, customerController.getAddresses);

/**
 * @swagger
 * /customers/addresses:
 *   post:
 *     summary: Add customer address
 *     description: Add a new address for the current customer
 *     tags: [Customers - Authenticated]
 *     security:
 *       - customerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerAddress'
 *     responses:
 *       201:
 *         description: Address added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/CustomerAddress'
 *                 message:
 *                   type: string
 *                   example: "Address added successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Customer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/addresses', authenticateCustomer, customerController.addAddress);

/**
 * @swagger
 * /customers/addresses/{addressId}:
 *   put:
 *     summary: Update customer address
 *     description: Update an existing address for the current customer
 *     tags: [Customers - Authenticated]
 *     security:
 *       - customerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerAddress'
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/CustomerAddress'
 *                 message:
 *                   type: string
 *                   example: "Address updated successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Customer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer or address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/addresses/:addressId', authenticateCustomer, customerController.updateAddress);

/**
 * @swagger
 * /customers/addresses/{addressId}:
 *   delete:
 *     summary: Delete customer address
 *     description: Delete an address for the current customer
 *     tags: [Customers - Authenticated]
 *     security:
 *       - customerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Address deleted successfully"
 *                 message:
 *                   type: string
 *                   example: "Address deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Customer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/addresses/:addressId', authenticateCustomer, customerController.deleteAddress);

/**
 * @swagger
 * /customers/logout:
 *   post:
 *     summary: Customer logout
 *     description: Logout the current customer and invalidate their access session. The accessId is blacklisted when provided to invalidate both access and refresh tokens. Authentication is not required to call this endpoint.
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', customerController.logoutCustomer);

// === ADMIN ROUTES ===

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers (Admin only)
 *     description: Retrieve a paginated list of all customers with filtering and sorting
 *     tags: [Customers - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for first name, last name, email, or mobile
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter by customer status
 *       - in: query
 *         name: newsletter
 *         schema:
 *           type: boolean
 *         description: Filter by newsletter subscription
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [firstName, lastName, email, createdAt, lastLogin, totalOrderAmount]
 *           default: createdAt
 *         description: Sort field (totalOrderAmount sorts by total paid order amount)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Customer'
 *                       - type: object
 *                         properties:
 *                           totalOrderAmount:
 *                             type: number
 *                             description: Total amount from all paid orders
 *                             example: 1299.50
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/',
  authenticateAdmin,
  checkPermission(Feature.CUSTOMERS, PermissionAction.READ),
  customerListLimiter,
  validatePagination,
  handleValidationErrors,
  customerController.getAllCustomers
);

/**
 * @swagger
 * /customers/active:
 *   get:
 *     summary: Get active customers (Admin only)
 *     description: Retrieve customers who have made purchases within the specified number of days
 *     tags: [Customers - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Number of days to look back for active customers
 *         example: 30
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for first name, last name, email, or mobile
 *     responses:
 *       200:
 *         description: Active customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Customer'
 *                       - type: object
 *                         properties:
 *                           orderStats:
 *                             type: object
 *                             properties:
 *                               totalOrders:
 *                                 type: number
 *                                 description: Number of orders in the specified period
 *                                 example: 3
 *                               totalSpent:
 *                                 type: number
 *                                 description: Total amount spent in the specified period
 *                                 example: 299.97
 *                               lastOrderDate:
 *                                 type: string
 *                                 format: date-time
 *                                 description: Date of the last order
 *                                 example: "2024-01-15T10:30:00Z"
 *                               daysSinceLastOrder:
 *                                 type: number
 *                                 description: Days since the last order
 *                                 example: 5
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 filters:
 *                   type: object
 *                   properties:
 *                     days:
 *                       type: number
 *                       description: Number of days used for filtering
 *                       example: 30
 *                     search:
 *                       type: string
 *                       nullable: true
 *                       description: Search term used
 *                       example: "john"
 *             examples:
 *               success:
 *                 summary: Active customers with 30 days filter
 *                 value:
 *                   data:
 *                     - _id: "507f1f77bcf86cd799439011"
 *                       firstName: "John"
 *                       lastName: "Doe"
 *                       email: "john.doe@example.com"
 *                       status: true
 *                       orderStats:
 *                         totalOrders: 2
 *                         totalSpent: 199.98
 *                         lastOrderDate: "2024-01-15T10:30:00Z"
 *                         daysSinceLastOrder: 5
 *                   pagination:
 *                     currentPage: 1
 *                     totalPages: 1
 *                     totalCount: 1
 *                     limit: 20
 *                     hasNextPage: false
 *                     hasPrevPage: false
 *                   filters:
 *                     days: 30
 *                     search: null
 *       400:
 *         description: Invalid days parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidDays:
 *                 summary: Invalid days parameter
 *                 value:
 *                   message: "Days parameter must be a number between 1 and 365"
 *                   error: "INVALID_DAYS_PARAMETER"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/active',
  authenticateAdmin,
  checkPermission(Feature.CUSTOMERS, PermissionAction.READ),
  customerListLimiter,
  validatePagination,
  handleValidationErrors,
  customerController.getActiveCustomers
);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get customer by ID (Admin only)
 *     description: Retrieve detailed information about a specific customer
 *     tags: [Customers - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid customer ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:id',
  authenticateAdmin,
  checkPermission(Feature.CUSTOMERS, PermissionAction.READ),
  validateObjectId,
  handleValidationErrors,
  customerController.getCustomerById
);

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create customer (Admin only)
 *     description: Create a new customer account
 *     tags: [Customers - Admin]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerCreate'
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  authenticateAdmin,
  checkPermission(Feature.CUSTOMERS, PermissionAction.CREATE),
  validateCustomerUpdate,
  handleValidationErrors,
  customerController.createCustomer
);

/**
 * @swagger
 * /customers/{id}:
 *   put:
 *     summary: Update customer (Admin only)
 *     description: Update an existing customer's information
 *     tags: [Customers - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 maxLength: 100
 *               lastName:
 *                 type: string
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 255
 *               mobile:
 *                 type: string
 *                 maxLength: 20
 *               status:
 *                 type: boolean
 *               newsletter:
 *                 type: boolean
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 40
 *                 description: New password (optional, minimum 6 characters)
 *               confirmPassword:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 40
 *                 description: Password confirmation (required if password is provided, must match password)
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Validation error or invalid customer ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "confirmPassword"
 *                       message:
 *                         type: string
 *                         example: "Password confirmation does not match password"
 *                       value:
 *                         type: string
 *                         example: "differentPassword"
 *             examples:
 *               passwordMismatch:
 *                 summary: Password confirmation mismatch
 *                 value:
 *                   message: "Validation failed"
 *                   errors:
 *                     - field: "confirmPassword"
 *                       message: "Password confirmation does not match password"
 *                       value: "differentPassword"
 *               invalidPassword:
 *                 summary: Invalid password format
 *                 value:
 *                   message: "Validation failed"
 *                   errors:
 *                     - field: "password"
 *                       message: "Password must be at least 6 characters long"
 *                       value: "weak"
 *               missingConfirmPassword:
 *                 summary: Missing password confirmation
 *                 value:
 *                   message: "Validation failed"
 *                   errors:
 *                     - field: "confirmPassword"
 *                       message: "Password confirmation is required when password is provided"
 *                       value: null
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  authenticateAdmin,
  checkPermission(Feature.CUSTOMERS, PermissionAction.UPDATE),
  validateObjectId,
  validateCustomerUpdate,
  handleValidationErrors,
  customerController.updateCustomer
);

/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     summary: Delete customer (Admin only)
 *     description: Delete a customer account
 *     tags: [Customers - Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Deleted customer ID
 *                   example: "507f1f77bcf86cd799439011"
 *                 email:
 *                   type: string
 *                   description: Deleted customer email
 *                   example: "john.doe@example.com"
 *       400:
 *         description: Invalid customer ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  authenticateAdmin,
  checkPermission(Feature.CUSTOMERS, PermissionAction.DELETE),
  validateObjectId,
  handleValidationErrors,
  customerController.deleteCustomer
);

export default router;
