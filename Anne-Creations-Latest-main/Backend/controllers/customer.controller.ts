import { Request, Response } from 'express';

import Customer from '../models/customer.model';
import OnlineUser from '../models/onlineUser.model';
import Order from '../models/order.model';
import OTP from '../models/otp.model';
import { BaseController } from '../utils/baseController';
import {
  sanitizeData,
  ensureLanguageId,
  getFrontendUrl,
  escapeRegex,
} from '../utils/controllerUtils';
import { sendErrorResponse, sendResponse } from '../utils/controllerUtils';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
} from '../utils/emailService';
import {
  blacklistAccessId,
  generateResetPasswordToken,
  generateEmailVerificationToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  verifyResetPasswordToken,
  verifyEmailVerificationToken,
} from '../utils/jwtUtils';
import { hashPassword, comparePassword } from '../utils/passwordUtils';
import { formatCustomerResponse } from '../utils/responseFormatter';
import { getClientSource } from '../utils/sessionUtils';
import { sendOTP as sendSMSOTP } from '../utils/smsService';
import { ValidationHelpers } from '../utils/validationHelpers';

class CustomerController extends BaseController {
  constructor() {
    super('Customer');
  }

  getAllCustomers = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getAllCustomers', 'admin', async () => {
      try {
        const page = parseInt((req.query.page as string) || '1', 10);
        const limit = parseInt((req.query.limit as string) || '20', 10);
        const skip = (page - 1) * limit;
        const sortField = (req.query.sortBy as string) || 'createdAt';
        const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;

        // Build filters
        const filters = this.buildCustomerFilters(req);

        // Determine if we need to sort by total order amount
        const sortByOrderAmount = sortField === 'totalOrderAmount';

        let customers: Record<string, unknown>[];
        let totalCount: number;

        if (sortByOrderAmount) {
          // Step 1: Get all customer IDs that match filters
          const matchingCustomers = await Customer.find(filters).select('_id').lean();
          const customerIds = matchingCustomers.map(c => c._id);
          totalCount = customerIds.length;

          // Step 2: Get total order amounts for each customer using aggregation on orders
          const orderTotals = await Order.aggregate([
            {
              $match: {
                customer: { $in: customerIds },
                orderStatus: 'paid',
              },
            },
            {
              $group: {
                _id: '$customer',
                totalOrderAmount: { $sum: '$orderTotal' },
              },
            },
          ]);

          // Step 3: Create a map of customerId -> totalOrderAmount
          const totalAmountMap = new Map<string, number>();
          orderTotals.forEach((item: { _id: string; totalOrderAmount: number }) => {
            totalAmountMap.set(item._id.toString(), item.totalOrderAmount);
          });

          // Step 4: Sort customer IDs by total order amount
          const sortedCustomerIds = matchingCustomers
            .map(c => {
              const customerId = c._id.toString();
              return {
                _id: customerId,
                totalOrderAmount: totalAmountMap.get(customerId) || 0,
              };
            })
            .sort((a, b) => {
              return sortOrder === 1
                ? a.totalOrderAmount - b.totalOrderAmount
                : b.totalOrderAmount - a.totalOrderAmount;
            })
            .map(c => c._id);

          // Step 5: Apply pagination to sorted IDs
          const paginatedCustomerIds = sortedCustomerIds.slice(skip, skip + limit);

          // Step 6: Fetch full customer data for paginated IDs
          const customerDocs = await Customer.find({
            _id: { $in: paginatedCustomerIds },
          })
            .populate('languageId', 'name code')
            .lean();

          // Step 7: Create a map of fetched customers by ID for quick lookup
          const customerMap = new Map<string, Record<string, unknown>>();
          customerDocs.forEach((customer: Record<string, unknown>) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            customerMap.set((customer._id as any).toString(), customer);
          });

          // Step 8: Reorder customers according to paginatedCustomerIds order and add totalOrderAmount
          customers = paginatedCustomerIds.map((customerId: string) => {
            const customer = customerMap.get(customerId);
            return {
              ...customer,
              totalOrderAmount: totalAmountMap.get(customerId) || 0,
            };
          });
        } else {
          // Standard sorting (createdAt or other fields)
          let query = Customer.find(filters).populate('languageId', 'name code');

          if (sortField && sortField !== 'totalOrderAmount') {
            query = query.sort({ [sortField]: sortOrder } as Record<string, 1 | -1>);
          } else {
            query = query.sort({ createdAt: sortOrder } as Record<string, 1 | -1>);
          }

          const customerDocs = await query.skip(skip).limit(limit).lean();

          totalCount = await Customer.countDocuments(filters);

          // Calculate total order amount for each customer
          customers = await Promise.all(
            customerDocs.map(async (customer: Record<string, unknown>) => {
              const orderStats = await Order.aggregate([
                {
                  $match: {
                    customer: customer._id,
                    orderStatus: 'paid',
                  },
                },
                {
                  $group: {
                    _id: null,
                    totalOrderAmount: { $sum: '$orderTotal' },
                  },
                },
              ]);

              return {
                ...customer,
                totalOrderAmount: orderStats[0]?.totalOrderAmount || 0,
              };
            })
          );
        }

        // Format customers for response
        const formattedCustomers = customers.map((customer: Record<string, unknown>) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const formatted = formatCustomerResponse(customer as any);
          return {
            ...formatted,
            totalOrderAmount: customer.totalOrderAmount || 0,
          };
        });

        const pagination = {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        };

        sendResponse(res, 200, formattedCustomers, pagination);
      } catch (error) {
        console.error('Error in getAllCustomers:', error);
        sendErrorResponse(res, 500, 'Internal server error');
      }
    });
  };

  getCustomerById = async (req: Request, res: Response) => {
    await this.getResourceById(req, res, Customer, 'getCustomerById', 'admin', {
      populate: ['languageId', 'addresses.country', 'addresses.zone'],
      responseFields: formatCustomerResponse,
    });
  };

  createCustomer = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'createCustomer', 'admin', async () => {
      try {
        // Check if email already exists
        const existingCustomer = await Customer.findByEmail(req.body.email as string);
        if (existingCustomer) {
          sendErrorResponse(res, 409, 'Email already registered');
          return;
        }

        // Hash password
        const { hashedPassword, salt } = await hashPassword(req.body.password as string);

        // Get languageId - use provided one or default to English
        const languageId = await ensureLanguageId(req.body.languageId);

        // Apply defaults and formatting
        // Remove confirmPassword as it's only for validation, not stored in the model
        const customerBody = { ...req.body };
        delete customerBody.confirmPassword;
        const customerData = {
          ...customerBody,
          languageId,
          password: hashedPassword,
          salt,
          ip: req.ip,
          status: req.body.status !== undefined ? req.body.status : true,
          approved: req.body.approved !== undefined ? req.body.approved : true,
          safe: req.body.safe !== undefined ? req.body.safe : true,
          dateAdded: new Date(),
        };

        const customer = new Customer(customerData);
        await customer.save();

        // Send welcome email if email is provided
        if (customer?.email) {
          try {
            await sendWelcomeEmail(customer);
          } catch (emailError) {
            console.warn('Failed to send welcome email:', emailError);
          }
        }

        const response = formatCustomerResponse(customer);
        sendResponse(res, 201, response);
      } catch (error) {
        console.error('Error in createCustomer:', error);
        throw new Error('Internal server error');
      }
    });
  };

  updateCustomer = async (req: Request, res: Response) => {
    await this.updateResource(req, res, Customer, 'updateCustomer', 'admin', {
      beforeUpdate: async (data: Record<string, unknown>) => {
        // Hash password if provided
        if (data.password) {
          const { hashedPassword, salt } = await hashPassword(data.password as string);
          return {
            ...data,
            password: hashedPassword,
            salt,
          };
        }
        return data;
      },
      populate: ['languageId', 'addresses.country', 'addresses.zone'],
      responseFields: formatCustomerResponse,
    });
  };

  deleteCustomer = async (req: Request, res: Response) => {
    await this.deleteResource(req, res, Customer, 'deleteCustomer', 'admin');
  };

  loginCustomer = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'loginCustomer', 'public', async () => {
      const { email, password } = req.body;

      // Find customer by email
      const customer = await Customer.findOne({ email }).select('+password +salt');
      if (!customer) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if account is active
      if (!customer.status) {
        return res.status(401).json({ message: 'Account is disabled' });
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, customer.password, customer.salt);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update login information
      customer.lastLogin = new Date();
      customer.lastIp = req.ip;
      customer.totalLogins = (customer.totalLogins || 0) + 1;
      await customer.save();

      // Generate tokens
      const deviceType = getClientSource(req);
      const { accessToken, refreshToken } = generateTokens({
        id: customer._id.toString(),
        email: customer?.email,
        deviceType,
      });

      // Format response
      const customerResponse = {
        _id: customer._id.toString(),
        firstName: customer?.firstName,
        lastName: customer?.lastName,
        email: customer?.email,
        mobile: customer.mobile,
        status: customer.status,
        newsletter: customer.newsletter,
        totalLogins: customer.totalLogins,
        lastLogin: customer.lastLogin,
      };

      return res.status(200).json({
        customer: customerResponse,
        accessToken,
        refreshToken,
      });
    });
  };

  refreshAccessToken = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'refreshAccessToken', 'public', async () => {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token required' });
      }

      const decoded = await verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      // Generate new tokens
      const deviceType = getClientSource(req);
      const { accessToken, refreshToken: newRefreshToken } = generateTokens({
        id: decoded.id,
        email: decoded.email,
        deviceType,
      });

      return res.status(200).json({
        accessToken,
        refreshToken: newRefreshToken,
      });
    });
  };

  /**
   * Send Registration OTP
   * Sends SMS OTP for customer registration after security validation
   *
   * Security: Validated by otpSecurity middleware (dynamic signature authentication)
   * Rate Limiting: None - Relies on signature validation to prevent abuse
   */
  sendRegistrationOTP = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'sendRegistrationOTP', 'public', async () => {
      try {
        const { mobile } = req.body;

        // Validate required fields
        if (!mobile) {
          return res.status(400).json({ message: 'Mobile number is required' });
        }

        // Validate phone number format
        if (!ValidationHelpers.isValidPhone(mobile)) {
          return res.status(400).json({ message: 'Invalid phone number format' });
        }

        // Check for duplicate mobile number
        const existingCustomer = await Customer.findByMobile(mobile);
        if (existingCustomer) {
          return res.status(409).json({ message: 'Mobile number already registered' });
        }

        // Check if there's a recent OTP (less than 60 seconds old) - Cooldown period
        const recentOtp = await OTP.findOne({
          mobile,
          purpose: 'registration',
          createdAt: { $gte: new Date(Date.now() - 60 * 1000) }, // Last 60 seconds
        }).sort({ createdAt: -1 });

        if (recentOtp) {
          const waitTime = 60 - Math.floor((Date.now() - recentOtp.createdAt.getTime()) / 1000);
          return res.status(429).json({
            message: `Please wait ${waitTime} seconds before requesting a new OTP`,
            waitTime,
            canResendAt: new Date(recentOtp.createdAt.getTime() + 60 * 1000),
          });
        }

        // Check mobile-based rate limit (5 OTPs per 15 minutes per mobile number)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentOtpCount = await OTP.countDocuments({
          mobile,
          purpose: 'registration',
          createdAt: { $gte: fifteenMinutesAgo },
        });

        if (recentOtpCount >= 5) {
          // Find the oldest OTP in the window to calculate wait time
          const oldestOtp = await OTP.findOne({
            mobile,
            purpose: 'registration',
            createdAt: { $gte: fifteenMinutesAgo },
          }).sort({ createdAt: 1 });

          const resetTime = oldestOtp
            ? new Date(oldestOtp.createdAt.getTime() + 15 * 60 * 1000)
            : new Date(Date.now() + 15 * 60 * 1000);

          const waitMinutes = Math.ceil((resetTime.getTime() - Date.now()) / (60 * 1000));

          return res.status(429).json({
            message: `Maximum OTP requests exceeded for this mobile number. Please try again in ${waitMinutes} minutes.`,
            remainingRequests: 0,
            maxRequests: 5,
            resetAt: resetTime,
            waitMinutes,
          });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Delete any existing OTPs for this mobile and purpose
        await OTP.deleteMany({ mobile, purpose: 'registration' });

        // Save OTP to database with 10 minutes expiry
        const otpDoc = new OTP({
          mobile,
          otp,
          purpose: 'registration',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        });
        await otpDoc.save();

        // Send OTP via SMS
        let smsResult;

        // Bypass SMS in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV MODE] OTP for ${mobile}: ${otp}`);
          smsResult = { success: true, message: 'OTP sent (Dev Mode)' };
        } else {
          smsResult = await sendSMSOTP(mobile, otp);
        }

        if (!smsResult.success) {
          // Delete OTP if SMS failed
          await OTP.deleteOne({ _id: otpDoc._id });
          return res.status(500).json({
            message: 'Failed to send OTP. Please try again.',
            error: smsResult.message,
          });
        }

        // Calculate remaining requests for this mobile
        const currentOtpCount = await OTP.countDocuments({
          mobile,
          purpose: 'registration',
          createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
        });

        return res.status(200).json({
          message: 'OTP sent successfully to your mobile number',
          expiresIn: 600, // 10 minutes in seconds
          canResendAfter: 60, // seconds
          remainingRequests: 5 - currentOtpCount,
          maxRequests: 5,
          resetIn: 15 * 60, // 15 minutes in seconds
        });
      } catch (error) {
        console.error('Error in sendRegistrationOTP:', error);
        return res.status(500).json({ message: 'Failed to send OTP' });
      }
    });
  };

  registerCustomer = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'registerCustomer', 'public', async () => {
      try {
        const sanitizedData = sanitizeData(req.body);
        const { mobile, otp: userOtp } = req.body;

        // Validate required fields
        if (!mobile) {
          return res.status(400).json({ message: 'Mobile number is required' });
        }

        if (!userOtp) {
          return res.status(400).json({ message: 'OTP is required' });
        }

        // Validate email format
        if (!ValidationHelpers.isValidEmail(sanitizedData.email)) {
          return res.status(400).json({ message: 'Invalid email format' });
        }

        // Validate phone number
        if (!ValidationHelpers.isValidPhone(sanitizedData.mobile)) {
          return res.status(400).json({ message: 'Invalid phone number format' });
        }

        // Validate password strength
        if (!ValidationHelpers.isValidPassword(sanitizedData.password)) {
          return res.status(400).json({
            message: 'Password must be at least 6 characters long',
          });
        }

        // Check if mobile already exists
        const existingMobileCustomer = await Customer.findByMobile(sanitizedData.mobile);
        if (existingMobileCustomer) {
          return res.status(409).json({ message: 'Mobile number already registered' });
        }

        // Check if email already exists
        const existingEmailCustomer = await Customer.findByEmail(sanitizedData.email);
        if (existingEmailCustomer) {
          return res.status(409).json({ message: 'Email already registered' });
        }

        // Verify OTP
        const otpDoc = await OTP.findValidOTP(mobile, 'registration');
        if (!otpDoc) {
          return res.status(400).json({
            message: 'Invalid or expired OTP. Please request a new OTP.',
          });
        }

        // Check if OTP has exceeded maximum attempts
        if (otpDoc.attempts >= 5) {
          await OTP.deleteOne({ _id: otpDoc._id });
          return res.status(429).json({
            message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.',
          });
        }

        // Verify OTP matches
        if (otpDoc.otp !== userOtp.toString()) {
          // Increment attempts
          otpDoc.attempts += 1;
          await otpDoc.save();

          const remainingAttempts = 5 - otpDoc.attempts;
          return res.status(400).json({
            message: 'Invalid OTP',
            remainingAttempts,
          });
        }

        // Mark OTP as used
        otpDoc.isUsed = true;
        await otpDoc.save();

        // Hash password
        const { hashedPassword, salt } = await hashPassword(sanitizedData.password);

        // Get languageId - use provided one or default to English
        const languageId = await ensureLanguageId(sanitizedData.languageId);

        // Create customer with mobile and email verified
        const customer = new Customer({
          ...sanitizedData,
          languageId,
          password: hashedPassword,
          salt,
          ip: req.ip,
          status: true,
          mobileVerified: true, // Mobile is verified via OTP
          emailVerified: false, // Email verification removed for registration
          dateAdded: new Date(),
        });

        customer.lastLogin = new Date();
        customer.lastIp = req.ip;
        customer.totalLogins = (customer.totalLogins || 0) + 1;
        await customer.save();

        // Send welcome email directly
        if (customer?.email) {
          try {
            sendWelcomeEmail(customer);
          } catch (emailError) {
            console.warn('Failed to send welcome email:', emailError);
          }
        }

        // Delete used OTP
        await OTP.deleteOne({ _id: otpDoc._id });

        const deviceType = getClientSource(req);
        const { accessToken, refreshToken } = generateTokens({
          id: customer._id.toString(),
          email: customer?.email,
          deviceType,
        });

        // Format response
        const customerResponse = {
          _id: customer._id.toString(),
          firstName: customer?.firstName,
          lastName: customer?.lastName,
          email: customer?.email,
          mobile: customer.mobile,
          status: customer.status,
          newsletter: customer.newsletter,
          totalLogins: customer.totalLogins,
          lastLogin: customer.lastLogin,
        };

        return res.status(201).json({
          message: 'Registration successful! Welcome to AnneCreations Hub.',
          customer: customerResponse,
          accessToken,
          refreshToken,
        });
      } catch (error: unknown) {
        console.error('Error in registerCustomer:', error);

        // Handle duplicate key error
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
          const mongoError = error as { keyPattern?: Record<string, unknown> };
          if (mongoError.keyPattern) {
            const field = Object.keys(mongoError.keyPattern)[0];
            if (field === 'mobile') {
              return res.status(409).json({ message: 'Mobile number already registered' });
            } else if (field === 'email') {
              return res.status(409).json({ message: 'Email already registered' });
            }
          }
          return res.status(409).json({ message: 'Registration failed - duplicate entry' });
        }

        return res.status(500).json({ message: 'Registration failed. Please try again.' });
      }
    });
  };

  getProfile = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getProfile', 'customer', async () => {
      const customerId = req.customer?.id;
      if (!customerId) {
        return res.status(401).json({ message: 'Customer authentication required' });
      }

      const customer = await Customer.findById(customerId)
        .populate('languageId', 'name code')
        .populate('addresses.country', 'name')
        .populate('addresses.zone', 'name');

      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const customerResponse = formatCustomerResponse(customer);
      return res.status(200).json(customerResponse);
    });
  };

  updateProfile = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'updateProfile', 'customer', async () => {
      try {
        const customerId = req.customer?.id;
        if (!customerId) {
          return res.status(401).json({ message: 'Customer authentication required' });
        }

        const updateData = sanitizeData(req.body);

        // Remove sensitive fields that shouldn't be updated via this endpoint
        delete updateData.password;
        delete updateData.salt;
        delete updateData._id;
        delete updateData.status;
        delete updateData.approved;

        const updatedCustomer = await Customer.findByIdAndUpdate(customerId, updateData, {
          new: true,
          runValidators: true,
        })
          .populate('languageId', 'name code')
          .populate('addresses.country', 'name')
          .populate('addresses.zone', 'name');

        if (!updatedCustomer) {
          return res.status(404).json({ message: 'Customer not found' });
        }

        const customerResponse = formatCustomerResponse(updatedCustomer);
        return res.status(200).json(customerResponse);
      } catch (error: unknown) {
        console.error('Error in updateProfile:', error);

        // Handle duplicate key error
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
          const mongoError = error as { keyPattern?: Record<string, unknown> };
          const field = mongoError.keyPattern ? Object.keys(mongoError.keyPattern)[0] : 'field';
          return res.status(409).json({ message: `This ${field} is already in use` });
        }

        return res.status(500).json({ message: 'Failed to update profile' });
      }
    });
  };

  changePassword = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'changePassword', 'customer', async () => {
      const customerId = req.customer?.id;
      if (!customerId) {
        return res.status(401).json({ message: 'Customer authentication required' });
      }

      const { currentPassword, newPassword } = req.body;

      const customer = await Customer.findById(customerId).select('+password +salt');
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(
        currentPassword,
        customer.password,
        customer.salt
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const { hashedPassword, salt } = await hashPassword(newPassword);

      // Update password
      customer.password = hashedPassword;
      customer.salt = salt;
      await customer.save();

      return res.status(200).json({ message: 'Password changed successfully' });
    });
  };

  forgotPassword = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'forgotPassword', 'public', async () => {
      const { email } = req.body;

      const customer = await Customer.findByEmail(email);
      if (!customer) {
        // Don't reveal if email exists or not for security
        return res.status(200).json({ message: 'If email exists, reset link has been sent' });
      }

      // Generate reset token
      const resetToken = generateResetPasswordToken({ id: customer._id.toString(), type: 'reset' });

      // Send reset password email
      const frontendUrl = getFrontendUrl();

      // For web apps, append the reset-password path
      const baseUrl = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
      const resetUrl = `${baseUrl}/reset-password`;

      try {
        await sendPasswordResetEmail(customer?.email, resetToken, resetUrl);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Continue anyway - don't reveal if email exists
      }

      return res.status(200).json({ message: 'If email exists, reset link has been sent' });
    });
  };

  resetPassword = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'resetPassword', 'public', async () => {
      try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
          return res.status(400).json({ message: 'Token and new password are required' });
        }

        const decoded = verifyResetPasswordToken(token);
        if (!decoded) {
          return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const customer = await Customer.findById(decoded.id);
        if (!customer) {
          return res.status(404).json({ message: 'Customer not found' });
        }

        // Hash new password
        const { hashedPassword, salt } = await hashPassword(newPassword);

        // Update password
        customer.password = hashedPassword;
        customer.salt = salt;
        await customer.save();

        return res.status(200).json({ message: 'Password reset successfully' });
      } catch (error) {
        console.error('Error in resetPassword:', error);
        return res.status(500).json({ message: 'Failed to reset password' });
      }
    });
  };

  verifyEmail = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'verifyEmail', 'public', async () => {
      try {
        const { token, email } = req.body;

        if (!token || !email) {
          return res.status(400).json({ message: 'Token and email are required' });
        }

        // First check if token exists in database
        const customer = await Customer.findByEmailVerificationToken(token);
        if (!customer) {
          return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Verify the customer email matches
        if (customer?.email !== email) {
          return res.status(400).json({ message: 'Email does not match customer record' });
        }

        // Then verify JWT token
        const decoded = verifyEmailVerificationToken(token);
        if (!decoded) {
          return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Verify the email matches the token
        if (decoded.email !== email) {
          return res.status(400).json({ message: 'Email does not match verification token' });
        }

        // Update customer verification status
        customer.emailVerified = true;
        customer.emailVerificationToken = undefined;
        customer.emailVerificationExpires = undefined;
        customer.lastLogin = new Date();
        customer.lastIp = req.ip;
        customer.totalLogins = (customer.totalLogins || 0) + 1;
        await customer.save();

        // Send welcome email after successful verification
        try {
          sendWelcomeEmail(customer);
        } catch (emailError) {
          console.warn('Failed to send welcome email:', emailError);
        }

        // Generate tokens
        const deviceType = getClientSource(req);
        const { accessToken, refreshToken } = generateTokens({
          id: customer._id.toString(),
          email: customer?.email,
          deviceType,
        });

        // Format response
        const customerResponse = {
          _id: customer._id.toString(),
          firstName: customer?.firstName,
          lastName: customer?.lastName,
          email: customer?.email,
          mobile: customer.mobile,
          status: customer.status,
          newsletter: customer.newsletter,
          totalLogins: customer.totalLogins,
          lastLogin: customer.lastLogin,
        };

        return res.status(200).json({
          customer: customerResponse,
          accessToken,
          refreshToken,
        });
      } catch (error) {
        console.error('Email verification error:', error);
        return res.status(500).json({ message: 'Failed to verify email' });
      }
    });
  };

  resendVerificationEmail = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'resendVerificationEmail', 'public', async () => {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const customer = await Customer.findByEmail(email);
      if (!customer) {
        // Don't reveal if email exists or not for security
        return res.status(200).json({
          message: 'If the email exists and is unverified, a verification email has been sent.',
        });
      }

      // Check if email is already verified
      if (customer?.emailVerified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }

      // Generate new verification token
      const emailVerificationToken = generateEmailVerificationToken({
        id: customer._id.toString(),
        email: customer?.email,
        type: 'email_verification',
      });

      // Update customer with new token
      customer.emailVerificationToken = emailVerificationToken;
      customer.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await customer.save();

      // Send verification email
      try {
        const frontendUrl = getFrontendUrl();

        // For web apps, append the reset-password path
        const baseUrl = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
        const verificationUrl = `${baseUrl}/verify-email`;

        await sendEmailVerificationEmail(customer, emailVerificationToken, verificationUrl);
      } catch (emailError) {
        console.warn('Failed to send verification email:', emailError);
        return res.status(500).json({ message: 'Failed to send verification email' });
      }

      return res.status(200).json({
        message: 'If the email exists and is unverified, a verification email has been sent.',
      });
    });
  };

  getAddresses = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getAddresses', 'customer', async () => {
      const customerId = req.customer?.id;
      if (!customerId) {
        return res.status(401).json({ message: 'Customer authentication required' });
      }

      const customer = await Customer.findById(customerId)
        .populate('addresses.country', 'name')
        .populate('addresses.zone', 'name')
        .select('addresses');

      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      return res.status(200).json(customer.addresses || []);
    });
  };

  addAddress = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'addAddress', 'customer', async () => {
      const customerId = req.customer?.id;
      if (!customerId) {
        return res.status(401).json({ message: 'Customer authentication required' });
      }

      const addressData = sanitizeData(req.body);

      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Add address to customer
      customer.addresses = customer.addresses || [];
      customer.addresses.push(addressData);
      await customer.save();

      // Populate and return updated addresses
      const updatedCustomer = await Customer.findById(customerId)
        .populate('addresses.country', 'name')
        .populate('addresses.zone', 'name')
        .select('addresses');

      return res.status(201).json(updatedCustomer?.addresses || []);
    });
  };

  updateAddress = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'updateAddress', 'customer', async () => {
      const customerId = req.customer?.id;
      const addressId = req.params.addressId;

      if (!customerId) {
        return res.status(401).json({ message: 'Customer authentication required' });
      }

      const addressData = sanitizeData(req.body);

      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Find and update address
      const addressIndex = customer.addresses?.findIndex(
        addr => addr._id?.toString() === addressId
      );
      if (addressIndex === -1 || addressIndex === undefined) {
        return res.status(404).json({ message: 'Address not found' });
      }

      // Update address
      if (customer.addresses) {
        customer.addresses[addressIndex] = { ...customer.addresses[addressIndex], ...addressData };
        await customer.save();
      }

      // Populate and return updated addresses
      const updatedCustomer = await Customer.findById(customerId)
        .populate('addresses.country', 'name')
        .populate('addresses.zone', 'name')
        .select('addresses');

      return res.status(200).json(updatedCustomer?.addresses || []);
    });
  };

  deleteAddress = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'deleteAddress', 'customer', async () => {
      const customerId = req.customer?.id;
      const addressId = req.params.addressId;

      if (!customerId) {
        return res.status(401).json({ message: 'Customer authentication required' });
      }

      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Remove address
      if (customer.addresses) {
        customer.addresses = customer.addresses.filter(addr => addr._id?.toString() !== addressId);
        await customer.save();
      }

      return res.status(200).json({ message: 'Address deleted successfully' });
    });
  };

  logoutCustomer = async (req: Request, res: Response) => {
    const accessToken = req.headers['authorization']?.split(' ')[1];

    try {
      let userId = req.customer?.id; // Might be set if middleware ran
      let accessId: string | undefined;

      // Try to decode token to blacklist session details if available
      if (accessToken) {
        try {
          const decoded = await verifyAccessToken(accessToken);
          userId = userId || decoded.id;
          accessId = decoded.accessId;
        } catch (error) {
          console.warn('Access token verification failed:', error);
          // Continue logout even when verification fails
        }
      }

      if (accessId && userId) {
        await blacklistAccessId(accessId, userId, 'customer', 'logout');
      }

      // Remove user from online users collection
      const browserId = req.cookies?.browserId;
      if (browserId) {
        await OnlineUser.deleteOne({ browserId });
      }

      // Clear browser ID cookie
      res.clearCookie('browserId');

      return res.status(200).json({
        message: 'Logged out successfully',
        success: true,
      });
    } catch (error) {
      console.error('Error during logout:', error);
      return res.status(500).json({
        message: 'Logout failed',
        error: 'LOGOUT_ERROR',
      });
    }
  };

  getActiveCustomers = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getActiveCustomers', 'admin', async () => {
      try {
        const { days = 30 } = req.query;
        const daysNumber = parseInt(days as string, 10);

        // Validate days parameter
        if (isNaN(daysNumber) || daysNumber < 1 || daysNumber > 365) {
          return res.status(400).json({
            message: 'Days parameter must be a number between 1 and 365',
            error: 'INVALID_DAYS_PARAMETER',
          });
        }

        // Calculate the date threshold
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - daysNumber);

        // Find customers who have orders within the specified days
        const activeCustomerIds = await Order.distinct('customer', {
          createdAt: { $gte: thresholdDate },
          orderStatus: { $in: ['paid', 'authorized'] }, // Only count successful orders
        });

        // Get customer details with pagination
        const page = parseInt((req.query.page as string) || '1', 10);
        const limit = parseInt((req.query.limit as string) || '20', 10);
        const skip = (page - 1) * limit;

        // Build search filters
        const searchFilters: Record<string, unknown> = {
          _id: { $in: activeCustomerIds },
          status: true, // Only active customers
        };

        // Add search term if provided
        if (req.query.search) {
          const searchTerm = req.query.search as string;
          const escapedSearch = escapeRegex(searchTerm);
          searchFilters.$or = [
            { firstName: { $regex: escapedSearch, $options: 'i' } },
            { lastName: { $regex: escapedSearch, $options: 'i' } },
            { email: { $regex: escapedSearch, $options: 'i' } },
          ];
        }

        // Get total count for pagination
        const totalCount = await Customer.countDocuments(searchFilters);

        // Get customers with pagination
        const customers = await Customer.find(searchFilters)
          .populate('languageId', 'name code')
          .sort({ lastLogin: -1 })
          .skip(skip)
          .limit(limit)
          .lean();

        // Get order statistics for each customer
        const customersWithStats = await Promise.all(
          customers.map(async customer => {
            const orderStats = await Order.aggregate([
              {
                $match: {
                  customer: customer._id,
                  createdAt: { $gte: thresholdDate },
                  orderStatus: { $in: ['paid', 'authorized'] },
                },
              },
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  totalSpent: { $sum: '$orderTotal' },
                  lastOrderDate: { $max: '$createdAt' },
                },
              },
            ]);

            const stats = orderStats[0] || {
              totalOrders: 0,
              totalSpent: 0,
              lastOrderDate: null,
            };

            return {
              ...formatCustomerResponse(customer),
              orderStats: {
                totalOrders: stats.totalOrders,
                totalSpent: stats.totalSpent,
                lastOrderDate: stats.lastOrderDate,
                daysSinceLastOrder: stats.lastOrderDate
                  ? Math.floor(
                    (new Date().getTime() - new Date(stats.lastOrderDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                  )
                  : null,
              },
            };
          })
        );

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        const response = {
          data: customersWithStats,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNextPage,
            hasPrevPage,
          },
          filters: {
            days: daysNumber,
            search: req.query.search || null,
          },
        };

        sendResponse(res, 200, response);
      } catch (error) {
        console.error('Error in getActiveCustomers:', error);
        sendErrorResponse(res, 500, 'Internal server error');
      }
    });
  };

  private buildCustomerFilters(req: Request): Record<string, unknown> {
    const filters: Record<string, unknown> = {};
    if (req.query.status !== undefined) {
      filters.status = req.query.status === 'true';
    }
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      if (searchTerm) {
        const escapedSearch = escapeRegex(searchTerm);
        const searchField = req.query.searchField as string;
        if (searchField) {
          if (searchField === 'firstName') {
            filters.$or = [
              { firstName: { $regex: escapedSearch, $options: 'i' } },
              { lastName: { $regex: escapedSearch, $options: 'i' } },
            ];
          } else if (searchField === 'email') {
            filters.$or = [{ email: { $regex: escapedSearch, $options: 'i' } }];
          } else if (searchField === 'mobile') {
            filters.$or = [{ mobile: { $regex: escapedSearch, $options: 'i' } }];
          }
        } else {
          // Default search fields
          filters.$or = [
            { firstName: { $regex: escapedSearch, $options: 'i' } },
            { lastName: { $regex: escapedSearch, $options: 'i' } },
            { email: { $regex: escapedSearch, $options: 'i' } },
            { mobile: { $regex: escapedSearch, $options: 'i' } },
          ];
        }
      }
    }
    return filters;
  }
}

// Create controller instance
const customerController = new CustomerController();

// Export refactored methods
export const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getActiveCustomers,
  loginCustomer,
  refreshAccessToken,
  sendRegistrationOTP,
  registerCustomer,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  logoutCustomer,
} = customerController;

// Export default for backward compatibility
export default {
  // Admin methods
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getActiveCustomers,

  // Customer methods
  loginCustomer,
  refreshAccessToken,
  sendRegistrationOTP,
  registerCustomer,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  logoutCustomer,
};
