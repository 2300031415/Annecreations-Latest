import dotenv from 'dotenv';
import { Request, Response } from 'express';

import Admin from '../models/admin.model';
import Customer from '../models/customer.model';
import Role from '../models/role.model';
import { IFeaturePermission } from '../types/models/role';
import auditLogService from '../utils/auditLogService';
import { BaseController } from '../utils/baseController';
import {
  getPaginationOptions,
  getSortOptions,
  sanitizeData,
  sendErrorResponse,
  validateObjectId,
  escapeRegex,
} from '../utils/controllerUtils';
import { sendEmail } from '../utils/emailService';
import {
  blacklistAccessId,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/jwtUtils';
import { compareAdminPassword, hashAdminPassword } from '../utils/passwordUtils';
import { normalizePermissions } from '../utils/permissions';
import { getClientSource } from '../utils/sessionUtils';

dotenv.config();

// Helper function to send admin notification
const sendAdminNotification = async (
  subject = '',
  message = '',
  admin: any,
  actionUrl = '',
  actionLabel = ''
) => {
  try {
    await sendEmail({
      to: admin?.email || '',
      subject: subject,
      template: 'admin-notification',
      data: {
        subject,
        message,
        notification_date: new Date().toLocaleString(),
        ip_address: admin?.ip || 'Unknown',
        user_agent: 'API Request',
        action_url: actionUrl,
        action_label: actionLabel,
      },
    });
    return true;
  } catch (error) {
    return false;
  }
};

class AdminController extends BaseController {
  constructor() {
    super('Admin');
  }

  loginAdmin = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'loginAdmin', 'public', async () => {
      const { username, password } = req.body;

      const admin = await Admin.findOne({ username });

      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      if (!admin.status) {
        return res.status(403).json({ message: 'Account is disabled' });
      }

      // Use secure password comparison
      const isPasswordValid = await compareAdminPassword(password, admin.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const deviceType = getClientSource(req);

      // Check if user is SuperAdmin
      const isSuperAdmin = await admin.isSuperAdmin();

      const payload = {
        id: admin._id.toString(),
        username: admin.username,
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
        isAdmin: true,
        deviceType,
      };

      const { accessToken, refreshToken } = generateTokens(payload);

      // Update login information
      admin.lastLogin = new Date();
      admin.lastIp = req.ip;
      admin.ipAddress = req.ip;
      admin.totalLogins = (admin.totalLogins || 0) + 1;
      await admin.save();

      // Optional: Send login notification for security
      if (admin.email) {
        sendAdminNotification(
          'Admin Login Alert',
          `Admin account ${admin.username} was logged in successfully.`,
          admin,
          `${req.protocol}://${req.get('host')}/admin/dashboard`,
          'View Dashboard'
        ).catch(() => {
          // Notification failure shouldn't affect login success
          console.warn('Failed to send login notification email');
        });
      }
      const role = await Role.findById(admin.role).select('name description permissions').lean();

      // Convert permissions array items to plain objects to remove Mongoose internals
      let rolePermissions = role?.permissions || [];
      if (rolePermissions && rolePermissions.length > 0) {
        rolePermissions = rolePermissions.map((perm: IFeaturePermission) => ({
          feature: perm.feature,
          create: perm.create,
          read: perm.read,
          update: perm.update,
          delete: perm.delete,
        }));
      }

      const responseData = {
        admin: {
          ...payload,
          role: role
            ? {
                name: role.name,
                description: role.description,
                permissions: normalizePermissions(rolePermissions),
              }
            : null,
          isSuperAdmin,
        },
        accessToken,
        refreshToken,
      };

      return res.status(200).json(responseData);
    });
  };

  getProfile = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getProfile', 'admin', async () => {
      const admin = await Admin.findById(req?.admin?.id);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      // Check if user is SuperAdmin
      const isSuperAdmin = await admin.isSuperAdmin();

      const role = await Role.findById(admin.role).select('name description permissions').lean();

      // Convert permissions array items to plain objects to remove Mongoose internals
      let rolePermissions = role?.permissions || [];
      if (rolePermissions && rolePermissions.length > 0) {
        rolePermissions = rolePermissions.map((perm: IFeaturePermission) => ({
          feature: perm.feature,
          create: perm.create,
          read: perm.read,
          update: perm.update,
          delete: perm.delete,
        }));
      }

      const profileData = {
        id: admin._id.toString(),
        username: admin.username,
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
        image: admin.image ? `image/${admin.image}` : admin.image,
        status: admin.status,
        role: role
          ? {
              name: role.name,
              description: role.description,
              permissions: normalizePermissions(rolePermissions),
            }
          : null,
        isSuperAdmin,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      };

      return res.status(200).json(profileData);
    });
  };

  updateAdmin = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'updateAdmin', 'admin', async () => {
      const adminId = req.params.id;
      const { firstName, lastName, username } = req.body;

      // Only allow admins to update themselves (or add additional permission logic here)
      if (req?.admin?.id !== adminId) {
        return res.status(403).json({ message: 'Permission denied - can only update own profile' });
      }

      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      // Sanitize and update fields
      const updateData = sanitizeData({
        firstName,
        lastName,
        username,
      });

      // Check for duplicate username if username is being updated
      if (updateData.username && updateData.username !== admin.username) {
        const existingUsername = await Admin.findOne({ username: updateData.username });
        if (existingUsername) {
          return res.status(409).json({
            message: 'Username already exists',
            error: 'DUPLICATE_USERNAME',
          });
        }
      }

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          (admin as any)[key] = updateData[key];
        }
      });

      await admin.save();

      // Send notification if another admin updated this profile
      if (req.admin?.id !== adminId && admin.email) {
        sendAdminNotification(
          'Admin Profile Updated',
          `Your admin profile was updated by administrator ${req.admin?.username}.`,
          admin,
          `${req.protocol}://${req.get('host')}/admin/profile`,
          'View Your Profile'
        ).catch(() => {
          console.warn('Failed to send profile update notification');
        });
      }

      const responseData = {
        id: admin._id.toString(),
        username: admin.username,
        name: `${admin.firstName} ${admin.lastName}`,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        status: admin.status,
        updatedAt: admin.updatedAt,
      };

      return res.status(200).json(responseData);
    });
  };

  changePassword = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'changePassword', 'admin', async () => {
      const adminId = req?.admin?.id;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(422).json({ message: 'New passwords did not match' });
      }

      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      // Use secure password comparison
      const isCurrentPasswordValid = await compareAdminPassword(currentPassword, admin.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Use secure password hashing
      const { hashedPassword, salt } = await hashAdminPassword(newPassword);
      admin.password = hashedPassword;
      admin.salt = salt;

      await admin.save();

      // Send notification email
      if (admin.email) {
        sendAdminNotification(
          'Password Changed',
          'Your admin account password was changed. If you did not make this change, please contact the system administrator immediately.',
          admin,
          `${req.protocol}://${req.get('host')}/admin/login`,
          'Login to Your Account'
        ).catch(() => {
          console.warn('Failed to send password change notification');
        });
      }

      return res.status(200).json({ message: 'Password changed successfully' });
    });
  };

  getAllAdmins = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getAllAdmins', 'admin', async () => {
      const { page, limit, skip } = getPaginationOptions(req);
      const filters = this.buildAdminFilters(req);
      const sortOptions = getSortOptions(req, { createdAt: -1 });

      const admins = await Admin.find(filters)
        .select('-password -salt')
        .populate('role', 'name description status permissions')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Admin.countDocuments(filters);

      // Format admins for response
      const formattedAdmins = admins.map(this.formatAdminResponse);

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      };

      return res.status(200).json({ data: formattedAdmins, pagination });
    });
  };

  getAdminById = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getAdminById', 'admin', async () => {
      const adminId = req.params.id;

      if (!validateObjectId(adminId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid admin ID',
          error: 'INVALID_ADMIN_ID',
        });
      }

      const admin = await Admin.findById(adminId)
        .select('-password -salt')
        .populate('role', 'name description status permissions')
        .lean();

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found',
          error: 'ADMIN_NOT_FOUND',
        });
      }

      // Format admin for response (formatAdminResponse already handles permission conversion)
      const formattedAdmin = this.formatAdminResponse(admin);

      return res.status(200).json({
        success: true,
        data: formattedAdmin,
        message: 'Admin retrieved successfully',
      });
    });
  };

  deleteAdmin = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'deleteAdmin', 'admin', async () => {
      const adminId = req.params.id;

      if (!validateObjectId(adminId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid admin ID',
          error: 'INVALID_ADMIN_ID',
        });
      }

      // Prevent deleting yourself
      if (req?.admin?.id === adminId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete your own account',
          error: 'CANNOT_DELETE_SELF',
        });
      }

      const admin = await Admin.findById(adminId).populate('role');
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found',
          error: 'ADMIN_NOT_FOUND',
        });
      }

      // Check if admin is SuperAdmin
      const isSuperAdmin = await admin.isSuperAdmin();

      // Only SuperAdmins can delete other SuperAdmins
      if (isSuperAdmin) {
        const requestingAdmin = await Admin.findById(req.admin?.id).populate('role');
        const isRequestingSuperAdmin = requestingAdmin
          ? await requestingAdmin.isSuperAdmin()
          : false;

        if (!isRequestingSuperAdmin) {
          return res.status(403).json({
            success: false,
            message: 'Only SuperAdmins can delete SuperAdmin accounts',
            error: 'SUPERADMIN_DELETE_FORBIDDEN',
          });
        }
      }

      if (isSuperAdmin && admin.role) {
        const role = typeof admin.role === 'object' ? admin.role : await Role.findById(admin.role);
        if (role) {
          // Check if this is the only SuperAdmin
          const superAdminCount = await Admin.countDocuments({
            role: role._id,
            status: true, // Only count active admins
          });

          if (superAdminCount === 1) {
            return res.status(403).json({
              success: false,
              message: 'Cannot delete the last SuperAdmin. At least one SuperAdmin must exist.',
              error: 'LAST_SUPERADMIN_IMMUTABLE',
            });
          }
        }
      }

      // Store admin info for response before deletion
      const adminInfo = {
        id: admin._id.toString(),
        username: admin.username,
        email: admin.email,
        name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
      };

      // Delete the admin
      await Admin.findByIdAndDelete(adminId);

      // Log the deletion for audit purposes
      await auditLogService.logDelete(
        req,
        'Admin',
        adminInfo,
        `Admin ${adminInfo.username} was deleted by ${req.admin?.username}`
      );

      return res.status(200).json({
        success: true,
        data: adminInfo,
        message: 'Admin deleted successfully',
      });
    });
  };

  /**
   * Private helper method to build admin-specific filters
   */
  private buildAdminFilters(req: Request): Record<string, any> {
    const filters: Record<string, any> = {};

    // Enhanced admin-specific filters
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      const escapedSearch = escapeRegex(searchTerm);
      filters.$or = [
        { firstName: { $regex: escapedSearch, $options: 'i' } },
        { lastName: { $regex: escapedSearch, $options: 'i' } },
        { username: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    if (req.query.status !== undefined) {
      filters.status = req.query.status === 'true';
    }

    return filters;
  }

  refreshAccessToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      const decoded = await verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens({
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        username: decoded.username,
        isAdmin: decoded.isAdmin,
        deviceType: decoded.deviceType,
      });

      return res.status(200).json({
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  };

  logoutAdmin = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'logoutAdmin', 'admin', async () => {
      const adminId = req.admin?.id;
      const accessToken = req.headers['authorization']?.split(' ')[1];

      if (!adminId) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }

      try {
        // Verify access token and extract accessId
        if (accessToken) {
          try {
            const decoded = await verifyAccessToken(accessToken);
            if (decoded.accessId) {
              await blacklistAccessId(decoded.accessId, adminId, 'admin', 'logout');
            }
          } catch (error) {
            console.warn('Access token verification failed:', error);
            // Continue with logout even if token verification fails
          }
        }

        // Clear session cookie
        res.clearCookie('sessionId');

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
    });
  };

  adminLoginAsUser = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'adminLoginAsUser', 'admin', async () => {
      const { customerId } = req.body;

      // Validate required fields
      if (!customerId) {
        sendErrorResponse(res, 400, 'Customer ID is required');
        return;
      }

      // Validate ObjectId format
      if (!validateObjectId(customerId)) {
        sendErrorResponse(res, 400, 'Invalid customer ID format');
        return;
      }

      try {
        // Find customer by ID
        const customer = await Customer.findById(customerId);
        if (!customer) {
          sendErrorResponse(res, 404, 'Customer not found');
          return;
        }

        // Check if customer account is active
        if (!customer.status) {
          sendErrorResponse(res, 403, 'Customer account is disabled');
          return;
        }

        // Generate tokens for the customer (as if they logged in)
        const deviceType = getClientSource(req);
        const payload = {
          id: customer._id.toString(),
          email: customer?.email,
          name: `${customer?.firstName} ${customer?.lastName}`,
          isAdmin: false, // This is a customer session
          deviceType,
        };

        const { accessToken, refreshToken } = generateTokens(payload);

        // Log the admin action for audit purposes
        await auditLogService.logCreate(
          req,
          'Customer',
          {
            _id: customer._id.toString(),
            email: customer?.email,
            firstName: customer?.firstName,
            lastName: customer?.lastName,
          },
          `Admin ${req.admin?.username} logged in as customer ${customer?.email}`
        );

        // Format customer response to match standard login response
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

        // Send response matching standard login format for frontend compatibility
        return res.status(200).json({
          customer: customerResponse,
          accessToken,
          refreshToken,
          // Include admin context for frontend to know this is an admin session
          isAdminSession: true,
          adminContext: {
            adminId: req.admin?.id,
            adminUsername: req.admin?.username,
          },
        });
      } catch (error) {
        console.error('Error in adminLoginAsUser:', error);
        sendErrorResponse(res, 500, 'Failed to login as customer');
      }
    });
  };

  /**
   * Private helper method to format admin response
   */
  private formatAdminResponse = (admin: any) => {
    // Convert role permissions to plain objects to remove Mongoose internals
    let rolePermissions = admin.role?.permissions || [];
    if (rolePermissions && rolePermissions.length > 0) {
      rolePermissions = rolePermissions.map((perm: any) => ({
        feature: perm.feature,
        create: perm.create,
        read: perm.read,
        update: perm.update,
        delete: perm.delete,
      }));
    }

    return {
      id: admin._id.toString(),
      username: admin.username,
      firstName: admin.firstName || '',
      lastName: admin.lastName || '',
      name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
      email: admin.email,
      status: admin.status,
      image: admin.image ? `image/${admin.image}` : admin.image,
      role: admin.role
        ? {
            id: admin.role._id?.toString() || admin.role.id?.toString(),
            name: admin.role.name,
            description: admin.role.description,
            permissions: normalizePermissions(rolePermissions),
          }
        : null,
      lastLogin: admin.lastLogin ? new Date(admin.lastLogin).toISOString() : null,
      lastIp: admin.lastIp || null,
      totalLogins: admin.totalLogins || 0,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  };
}

// ===== ADMIN CREATION =====

/**
 * Create new admin user (SuperAdmin only)
 */
export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, email, firstName, lastName, roleId, status = true } = req.body;

    // Check if username already exists
    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      res.status(409).json({
        success: false,
        message: 'Username already exists',
        error: 'DUPLICATE_USERNAME',
      });
      return;
    }

    // Check if email already exists
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      res.status(409).json({
        success: false,
        message: 'Email already exists',
        error: 'DUPLICATE_EMAIL',
      });
      return;
    }

    // Validate role if provided
    let role = null;
    if (roleId) {
      role = await Role.findById(roleId);
      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Role not found',
          error: 'ROLE_NOT_FOUND',
        });
        return;
      }

      if (!role.status) {
        res.status(400).json({
          success: false,
          message: 'Cannot assign inactive role',
          error: 'ROLE_INACTIVE',
        });
        return;
      }

      // Only SuperAdmins can assign SuperAdmin role
      if (role.name === 'SuperAdmin') {
        const requestingAdmin = await Admin.findById(req.admin?.id);
        const requestingAdminRole = requestingAdmin?.role
          ? await Role.findById(requestingAdmin.role)
          : null;
        const isRequestingSuperAdmin = requestingAdminRole?.name === 'SuperAdmin';

        if (!isRequestingSuperAdmin) {
          res.status(403).json({
            success: false,
            message: 'Only SuperAdmins can assign SuperAdmin role',
            error: 'SUPERADMIN_ASSIGNMENT_FORBIDDEN',
          });
          return;
        }
      }
    }

    // Hash password
    const { hashedPassword, salt } = await hashAdminPassword(password);

    // Create new admin
    const newAdmin = new Admin({
      username,
      password: hashedPassword,
      salt,
      email,
      firstName,
      lastName,
      role: roleId || null,
      status,
      ipAddress: req.ip,
      createdBy: req.admin?.id,
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      data: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        role: roleId || null,
        status: newAdmin.status,
      },
      message: 'Admin created successfully',
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update admin by ID
 */
export const updateAdminById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, email, firstName, lastName, roleId, status, newPassword, confirmPassword } =
      req.body;

    // Validate admin ID
    if (!validateObjectId(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid admin ID',
        error: 'INVALID_ADMIN_ID',
      });
      return;
    }

    // Find admin
    const admin = await Admin.findById(id);
    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
        error: 'ADMIN_NOT_FOUND',
      });
      return;
    }

    // Get current role of the admin being updated
    const currentRole = admin.role ? await Role.findById(admin.role) : null;
    const isCurrentSuperAdmin = currentRole?.name === 'SuperAdmin';

    // Only SuperAdmins can update other SuperAdmins
    if (isCurrentSuperAdmin) {
      const requestingAdmin = await Admin.findById(req.admin?.id);
      const requestingAdminRole = requestingAdmin?.role
        ? await Role.findById(requestingAdmin.role)
        : null;
      const isRequestingSuperAdmin = requestingAdminRole?.name === 'SuperAdmin';

      if (!isRequestingSuperAdmin) {
        res.status(403).json({
          success: false,
          message: 'Only SuperAdmins can update SuperAdmin accounts',
          error: 'SUPERADMIN_UPDATE_FORBIDDEN',
        });
        return;
      }
    }

    // Scenario 1: If admin is active SuperAdmin, cannot set to inactive if they are the only SuperAdmin
    if (isCurrentSuperAdmin && admin.status === true && status === false) {
      const superAdminCount = await Admin.countDocuments({
        role: currentRole._id,
        status: true,
      });

      if (superAdminCount === 1) {
        res.status(403).json({
          success: false,
          message:
            'Cannot disable the last SuperAdmin. At least one SuperAdmin must remain active.',
          error: 'LAST_SUPERADMIN_IMMUTABLE',
        });
        return;
      }
    }

    // Scenario 2: If admin is NOT SuperAdmin, cannot change role of the last SuperAdmin
    // This prevents non-SuperAdmin from modifying the last SuperAdmin's role to inactive or another role
    if (!isCurrentSuperAdmin && roleId !== undefined) {
      // Check if trying to change to a different role or remove role
      const isChangingRole = roleId !== admin.role?.toString() && roleId !== null && roleId !== '';

      if (isChangingRole) {
        // Find the SuperAdmin role
        const superAdminRole = await Role.findOne({ name: 'SuperAdmin' });
        if (superAdminRole) {
          const superAdminCount = await Admin.countDocuments({
            role: superAdminRole._id,
            status: true,
          });

          // If there's only one SuperAdmin, prevent changing their role
          if (superAdminCount === 1) {
            const lastSuperAdmin = await Admin.findOne({
              role: superAdminRole._id,
              status: true,
            });

            // If the admin being updated is the last SuperAdmin, prevent role change
            if (lastSuperAdmin && lastSuperAdmin._id.toString() === id) {
              res.status(403).json({
                success: false,
                message:
                  'Cannot modify the role of the last SuperAdmin. At least one SuperAdmin must exist.',
                error: 'LAST_SUPERADMIN_IMMUTABLE',
              });
              return;
            }
          }
        }
      }
    }
    // Update username if provided
    if (username !== undefined) {
      // Check if username already exists (excluding current admin)
      const existingUsername = await Admin.findOne({ username, _id: { $ne: id } });
      if (existingUsername) {
        res.status(409).json({
          success: false,
          message: 'Username already exists',
          error: 'DUPLICATE_USERNAME',
        });
        return;
      }
      admin.username = username;
    }

    // Update email if provided
    if (email !== undefined) {
      // Check if email already exists (excluding current admin)
      const existingEmail = await Admin.findOne({ email, _id: { $ne: id } });
      if (existingEmail) {
        res.status(409).json({
          success: false,
          message: 'Email already exists',
          error: 'DUPLICATE_EMAIL',
        });
        return;
      }
      admin.email = email;
    }

    // Update firstName if provided
    if (firstName !== undefined) {
      admin.firstName = firstName;
    }

    // Update lastName if provided
    if (lastName !== undefined) {
      admin.lastName = lastName;
    }

    // Update status if provided
    if (status !== undefined) {
      admin.status = status;
    }

    // Update role if provided
    if (roleId !== undefined) {
      if (roleId === null || roleId === '') {
        // Remove role assignment
        admin.role = undefined;
      } else {
        if (!validateObjectId(roleId)) {
          res.status(400).json({
            success: false,
            message: 'Invalid role ID',
            error: 'INVALID_ROLE_ID',
          });
          return;
        }

        const role = await Role.findById(roleId);
        if (!role) {
          res.status(404).json({
            success: false,
            message: 'Role not found',
            error: 'ROLE_NOT_FOUND',
          });
          return;
        }

        if (!role.status) {
          res.status(400).json({
            success: false,
            message: 'Cannot assign inactive role',
            error: 'ROLE_INACTIVE',
          });
          return;
        }

        // Only SuperAdmins can assign SuperAdmin role
        if (role.name === 'SuperAdmin') {
          const requestingAdmin = await Admin.findById(req.admin?.id);
          const requestingAdminRole = requestingAdmin?.role
            ? await Role.findById(requestingAdmin.role)
            : null;
          const isRequestingSuperAdmin = requestingAdminRole?.name === 'SuperAdmin';

          if (!isRequestingSuperAdmin) {
            res.status(403).json({
              success: false,
              message: 'Only SuperAdmins can assign SuperAdmin role',
              error: 'SUPERADMIN_ASSIGNMENT_FORBIDDEN',
            });
            return;
          }
        }

        admin.role = roleId;
      }
    }

    // Update password if provided
    if (newPassword !== undefined) {
      // Validate password fields
      if (!newPassword || !confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'Both newPassword and confirmPassword are required when changing password',
          error: 'MISSING_PASSWORD_FIELDS',
        });
        return;
      }

      // Validate password match
      if (newPassword !== confirmPassword) {
        res.status(422).json({
          success: false,
          message: 'New password and confirmation password do not match',
          error: 'PASSWORD_MISMATCH',
        });
        return;
      }

      // Validate password length (minimum 6 characters as per model)
      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
          error: 'PASSWORD_TOO_SHORT',
        });
        return;
      }

      // Hash and update password
      const { hashedPassword, salt } = await hashAdminPassword(newPassword);
      admin.password = hashedPassword;
      admin.salt = salt;

      // Send notification email to the admin whose password was changed
      if (admin.email) {
        sendAdminNotification(
          'Password Changed by Administrator',
          `Your admin account password was changed by administrator ${req.admin?.username}. If you did not authorize this change, please contact the system administrator immediately.`,
          admin,
          `${req.protocol}://${req.get('host')}/admin/login`,
          'Login to Your Account'
        ).catch(() => {
          console.warn('Failed to send password change notification');
        });
      }
    }

    await admin.save();

    // Get updated role info for response
    let roleInfo = null;
    if (admin.role) {
      const role = await Role.findById(admin.role).select('name description');
      if (role) {
        roleInfo = {
          id: role._id.toString(),
          name: role.name,
          description: role.description,
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id: admin._id.toString(),
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: roleInfo,
        status: admin.status,
        updatedAt: admin.updatedAt,
      },
      message: 'Admin updated successfully',
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Create controller instance
const adminController = new AdminController();

// Export refactored methods
export const {
  loginAdmin,
  getProfile,
  updateAdmin,
  changePassword,
  getAllAdmins,
  getAdminById,
  deleteAdmin,
  refreshAccessToken,
  logoutAdmin,
  adminLoginAsUser,
} = adminController;

// Export default for backward compatibility
export default {
  loginAdmin,
  getProfile,
  updateAdmin,
  changePassword,
  getAllAdmins,
  getAdminById,
  deleteAdmin,
  refreshAccessToken,
  logoutAdmin,
  adminLoginAsUser,
  createAdmin,
  updateAdminById,
};
