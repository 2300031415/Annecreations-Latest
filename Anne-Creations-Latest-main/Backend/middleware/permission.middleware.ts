import { Request, Response, NextFunction } from 'express';

import Admin from '../models/admin.model';
import Role from '../models/role.model';
import { Feature, PermissionAction } from '../types/models/role';
import { normalizePermissions } from '../utils/permissions';

/**
 * Middleware to check if authenticated admin has permission for specific feature and action
 * @param feature - Feature to check permission for
 * @param action - Action to check permission for (create, read, update, delete)
 */
export const checkPermission = (feature: Feature, action: PermissionAction) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if admin is authenticated
      if (!req.admin || !req.admin.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'UNAUTHORIZED',
        });
      }

      // Get admin with role populated
      const admin = await Admin.findById(req.admin.id);

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin not found',
          error: 'ADMIN_NOT_FOUND',
        });
      }

      // Check if admin is active
      if (!admin.status) {
        return res.status(403).json({
          success: false,
          message: 'Admin account is disabled',
          error: 'ACCOUNT_DISABLED',
        });
      }

      // Check if admin has no role assigned
      if (!admin.role) {
        return res.status(403).json({
          success: false,
          message: 'No role assigned to this admin',
          error: 'NO_ROLE_ASSIGNED',
        });
      }

      // Get role
      const role = await Role.findById(admin.role).select('name status permissions');

      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'Invalid role assigned',
          error: 'INVALID_ROLE',
        });
      }

      // SuperAdmin bypass - if role name is 'SuperAdmin', allow all actions
      if (role?.name === 'SuperAdmin') {
        return next();
      }

      // Check if role is active
      if (!role?.status) {
        return res.status(403).json({
          success: false,
          message: 'Role is inactive',
          error: 'ROLE_INACTIVE',
        });
      }

      // Check if role has permission for the feature and action
      const hasPermission = role?.permissions.find(
        permission => permission.feature === feature && permission[action] === true
      );
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied',
          error: 'PERMISSION_DENIED',
        });
      }

      next();
    } catch {
      return res
        .status(403)
        .json({ success: false, message: 'Permission denied', error: 'PERMISSION_DENIED' });
    }
  };
};

/**
 * Middleware to check if admin is SuperAdmin
 */
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.admin || !req.admin.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED',
      });
    }

    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found',
        error: 'ADMIN_NOT_FOUND',
      });
    }

    if (!admin.role) {
      return res.status(403).json({
        success: false,
        message: 'SuperAdmin access required',
        error: 'SUPERADMIN_REQUIRED',
      });
    }

    // Get role
    const role = await Role.findById(admin.role).select('name status permissions');

    // Check if admin is SuperAdmin
    if (!role || role?.name !== 'SuperAdmin') {
      return res.status(403).json({
        success: false,
        message: 'SuperAdmin access required',
        error: 'SUPERADMIN_REQUIRED',
      });
    }

    next();
  } catch {
    return res.status(403).json({
      success: false,
      message: 'SuperAdmin access required',
      error: 'SUPERADMIN_REQUIRED',
    });
  }
};

/**
 * Utility function to get admin permissions (for API responses)
 */
export const getAdminPermissions = async (adminId: string) => {
  const admin = await Admin.findById(adminId);

  if (!admin) {
    return null;
  }

  if (!admin?.role) {
    return {
      isSuperAdmin: false,
      role: null,
      permissions: [],
    };
  }

  // Get role
  const role = await Role.findById(admin.role).select('name status permissions');

  // SuperAdmin has all permissions
  const isSuperAdmin = role?.name === 'SuperAdmin';

  // Build permissions (SuperAdmin gets all features, others get role permissions)
  const permissions = isSuperAdmin
    ? Object.values(Feature).map(feature => ({
        feature,
        create: true,
        read: true,
        update: true,
        delete: true,
      }))
    : role?.permissions || [];

  // Normalize permissions
  const normalizedPermissions = normalizePermissions(permissions);

  return {
    isSuperAdmin,
    role: {
      id: role?._id,
      name: role?.name,
      description: role?.description,
    },
    permissions: normalizedPermissions,
  };
};
