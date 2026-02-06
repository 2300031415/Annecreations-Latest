import { Request, Response } from 'express';

import Admin from '../models/admin.model';
import Role from '../models/role.model';
import { Feature, IFeaturePermission } from '../types/models/role';
import { getAllFeatures, validatePermissions, normalizePermissions } from '../utils/permissions';

/**
 * Helper function to check if permissions represent SuperAdmin-level access
 * SuperAdmin has all features with all actions (create, read, update, delete) enabled
 */
function hasSuperAdminPermissions(permissions: IFeaturePermission[]): boolean {
  const allFeatures = Object.values(Feature);
  const normalizedPerms = normalizePermissions(permissions);

  // Check if all features are present
  if (normalizedPerms.length !== allFeatures.length) {
    return false;
  }

  // Check if all features have all actions enabled
  for (const feature of allFeatures) {
    const perm = normalizedPerms.find(p => p.feature === feature);
    if (!perm) {
      return false;
    }
    // Check all actions are true (create, read, update, delete)
    if (!perm.create || !perm.read || !perm.update || !perm.delete) {
      return false;
    }
  }

  return true;
}

/**
 * Helper function to check if two permission sets are identical
 */
function arePermissionsIdentical(
  perms1: IFeaturePermission[],
  perms2: IFeaturePermission[]
): boolean {
  const normalized1 = normalizePermissions(perms1);
  const normalized2 = normalizePermissions(perms2);

  if (normalized1.length !== normalized2.length) {
    return false;
  }

  // Sort by feature for comparison
  const sorted1 = [...normalized1].sort((a, b) => a.feature.localeCompare(b.feature));
  const sorted2 = [...normalized2].sort((a, b) => a.feature.localeCompare(b.feature));

  for (let i = 0; i < sorted1.length; i++) {
    const p1 = sorted1[i];
    const p2 = sorted2[i];

    if (
      p1.feature !== p2.feature ||
      p1.create !== p2.create ||
      p1.read !== p2.read ||
      p1.update !== p2.update ||
      p1.delete !== p2.delete
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Get all roles with pagination
 */
export const getAllRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status;

    const query: any = {};
    if (status !== undefined) {
      query.status = status === 'true';
    }

    const skip = (page - 1) * limit;

    const [roles, total] = await Promise.all([
      Role.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'username email firstName lastName')
        .lean(),
      Role.countDocuments(query),
    ]);

    // Normalize permissions for all roles before returning
    const normalizedRoles = roles.map(role => ({
      ...role,
      permissions: normalizePermissions(role.permissions || []),
    }));

    res.status(200).json({
      success: true,
      data: normalizedRoles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      message: 'Roles retrieved successfully',
    });
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve roles',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get role by ID
 */
export const getRoleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id)
      .populate('createdBy', 'username email firstName lastName')
      .lean();

    if (!role) {
      res.status(404).json({
        success: false,
        message: 'Role not found',
        error: 'ROLE_NOT_FOUND',
      });
      return;
    }

    // Normalize permissions before returning
    const normalizedRole = {
      ...role,
      permissions: normalizePermissions(role.permissions || []),
    };

    res.status(200).json({
      success: true,
      data: normalizedRole,
      message: 'Role retrieved successfully',
    });
  } catch (error) {
    console.error('Get role by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve role',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Create a new role
 */
export const createRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, permissions, status } = req.body;

    // Validate permissions structure
    const validation = validatePermissions(permissions || []);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        message: 'Invalid permissions',
        errors: validation.errors,
      });
      return;
    }

    // Normalize permissions
    const normalizedPermissions = normalizePermissions(permissions || []);

    // Prevent creating role with SuperAdmin-level permissions
    if (hasSuperAdminPermissions(normalizedPermissions)) {
      res.status(403).json({
        success: false,
        message:
          'Cannot create role with SuperAdmin-level permissions. This permission set is system-protected.',
        error: 'SUPERADMIN_PERMISSIONS_FORBIDDEN',
      });
      return;
    }

    // Check if role name already exists
    const existingRole = await Role.findByName(name);
    if (existingRole) {
      res.status(409).json({
        success: false,
        message: 'Role name already exists',
        error: 'DUPLICATE_ROLE_NAME',
      });
      return;
    }

    // Check for duplicate permissions (same permissions as existing role)
    const allRoles = await Role.find({}).lean();
    for (const existingRoleItem of allRoles) {
      if (arePermissionsIdentical(normalizedPermissions, existingRoleItem.permissions || [])) {
        res.status(409).json({
          success: false,
          message: `A role with identical permissions already exists: ${existingRoleItem.name}`,
          error: 'DUPLICATE_PERMISSIONS',
          existingRoleName: existingRoleItem.name,
        });
        return;
      }
    }

    // Create new role
    const role = new Role({
      name,
      description,
      permissions: normalizedPermissions,
      status: status !== undefined ? status : true,
      createdBy: req.admin?.id,
    });

    await role.save();

    // Convert to plain object and ensure permissions are plain objects too
    const roleResponse = role.toObject({ flattenMaps: true });
    // Convert permissions array items to plain objects to remove Mongoose internals
    roleResponse.permissions = (roleResponse.permissions || []).map((perm: IFeaturePermission) => ({
      feature: perm.feature,
      create: perm.create,
      read: perm.read,
      update: perm.update,
      delete: perm.delete,
    }));
    // Normalize permissions
    roleResponse.permissions = normalizePermissions(roleResponse.permissions);

    res.status(201).json({
      success: true,
      data: roleResponse,
      message: 'Role created successfully',
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create role',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update a role
 */
export const updateRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, permissions, status } = req.body;

    // Find role
    const role = await Role.findById(id);
    if (!role) {
      res.status(404).json({
        success: false,
        message: 'Role not found',
        error: 'ROLE_NOT_FOUND',
      });
      return;
    }

    // Check if current role has SuperAdmin permissions
    const currentRolePermissions = normalizePermissions(role.permissions || []);
    const isCurrentSuperAdmin = hasSuperAdminPermissions(currentRolePermissions);

    // Prevent updating role with SuperAdmin-level permissions
    if (isCurrentSuperAdmin) {
      res.status(403).json({
        success: false,
        message: 'Role with SuperAdmin-level permissions cannot be modified',
        error: 'SUPERADMIN_PERMISSIONS_IMMUTABLE',
      });
      return;
    }

    // Check if new name conflicts with existing role
    if (name && name !== role.name) {
      const existingRole = await Role.findByName(name);
      if (existingRole) {
        res.status(409).json({
          success: false,
          message: 'Role name already exists',
          error: 'DUPLICATE_ROLE_NAME',
        });
        return;
      }
    }

    // Validate permissions if provided
    if (permissions) {
      const validation = validatePermissions(permissions);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: 'Invalid permissions',
          errors: validation.errors,
        });
        return;
      }

      const normalizedNewPermissions = normalizePermissions(permissions);

      // Prevent updating to SuperAdmin-level permissions
      if (hasSuperAdminPermissions(normalizedNewPermissions)) {
        res.status(403).json({
          success: false,
          message:
            'Cannot update role to have SuperAdmin-level permissions. This permission set is system-protected.',
          error: 'SUPERADMIN_PERMISSIONS_FORBIDDEN',
        });
        return;
      }

      // Check for duplicate permissions (same permissions as another existing role)
      const allRoles = await Role.find({ _id: { $ne: id } }).lean();
      for (const existingRoleItem of allRoles) {
        if (arePermissionsIdentical(normalizedNewPermissions, existingRoleItem.permissions || [])) {
          res.status(409).json({
            success: false,
            message: `A role with identical permissions already exists: ${existingRoleItem.name}`,
            error: 'DUPLICATE_PERMISSIONS',
            existingRoleName: existingRoleItem.name,
          });
          return;
        }
      }

      // Normalize permissions
      role.permissions = normalizedNewPermissions;
    }

    // Update fields
    if (name) role.name = name;
    if (description !== undefined) role.description = description;
    if (status !== undefined) role.status = status;

    await role.save();

    // Convert to plain object and ensure permissions are plain objects too
    const roleResponse = role.toObject({ flattenMaps: true });
    // Convert permissions array items to plain objects to remove Mongoose internals
    roleResponse.permissions = (roleResponse.permissions || []).map((perm: IFeaturePermission) => ({
      feature: perm.feature,
      create: perm.create,
      read: perm.read,
      update: perm.update,
      delete: perm.delete,
    }));
    // Normalize permissions
    roleResponse.permissions = normalizePermissions(roleResponse.permissions);

    res.status(200).json({
      success: true,
      data: roleResponse,
      message: 'Role updated successfully',
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete a role
 */
export const deleteRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Find role
    const role = await Role.findById(id);
    if (!role) {
      res.status(404).json({
        success: false,
        message: 'Role not found',
        error: 'ROLE_NOT_FOUND',
      });
      return;
    }

    // Check if role has SuperAdmin permissions
    const rolePermissions = normalizePermissions(role.permissions || []);
    const hasSuperAdminPerms = hasSuperAdminPermissions(rolePermissions);

    // Prevent deleting role with SuperAdmin-level permissions
    if (hasSuperAdminPerms) {
      res.status(403).json({
        success: false,
        message: 'Role with SuperAdmin-level permissions cannot be deleted',
        error: 'SUPERADMIN_PERMISSIONS_IMMUTABLE',
      });
      return;
    }

    // Check if role is in use by any admins
    const adminCount = await Admin.countDocuments({ role: id });
    if (adminCount > 0) {
      res.status(409).json({
        success: false,
        message: `Cannot delete role. ${adminCount} admin(s) are currently assigned to this role`,
        error: 'ROLE_IN_USE',
        adminCount,
      });
      return;
    }

    await Role.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      data: {
        id: role._id,
        name: role.name,
      },
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get available features list for UI
 */
export const getFeaturesList = async (req: Request, res: Response): Promise<void> => {
  try {
    const features = getAllFeatures();

    res.status(200).json({
      success: true,
      data: {
        features,
      },
      message: 'Features list retrieved successfully',
    });
  } catch (error) {
    console.error('Get features list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve features list',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get admins by role ID
 */
export const getAdminsByRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Find role
    const role = await Role.findById(id);
    if (!role) {
      res.status(404).json({
        success: false,
        message: 'Role not found',
        error: 'ROLE_NOT_FOUND',
      });
      return;
    }

    // Find admins with this role
    const admins = await Admin.find({ role: id })
      .select('username email firstName lastName status lastLogin')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        role: {
          id: role._id,
          name: role.name,
        },
        admins,
        count: admins.length,
      },
      message: 'Admins retrieved successfully',
    });
  } catch (error) {
    console.error('Get admins by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admins',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export default {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getFeaturesList,
  getAdminsByRole,
};
