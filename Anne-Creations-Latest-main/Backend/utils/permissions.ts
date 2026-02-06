import {
  Feature,
  PermissionAction,
  AVAILABLE_FEATURES,
  IFeaturePermission,
} from '../types/models/role';

// Feature configuration with available CRUD operations
export interface FeatureConfig {
  name: string;
  description: string;
  allowedActions: PermissionAction[];
}

// All available features with their configurations
export const FEATURE_CONFIGS: Record<Feature, FeatureConfig> = {
  [Feature.ROLES]: {
    name: 'Role Management',
    description: 'Manage roles and permissions',
    allowedActions: [
      PermissionAction.CREATE,
      PermissionAction.READ,
      PermissionAction.UPDATE,
      PermissionAction.DELETE,
    ],
  },
  [Feature.ADMINS]: {
    name: 'Admin Management',
    description: 'Manage admin users, roles, and permissions (SuperAdmin-only feature)',
    allowedActions: [
      PermissionAction.CREATE,
      PermissionAction.READ,
      PermissionAction.UPDATE,
      PermissionAction.DELETE,
    ],
  },
  [Feature.PRODUCTS]: {
    name: 'Product Management',
    description: 'Manage products, options, and catalog',
    allowedActions: [
      PermissionAction.CREATE,
      PermissionAction.READ,
      PermissionAction.UPDATE,
      PermissionAction.DELETE,
    ],
  },
  [Feature.CATEGORIES]: {
    name: 'Category Management',
    description: 'Manage product categories and hierarchies',
    allowedActions: [
      PermissionAction.CREATE,
      PermissionAction.READ,
      PermissionAction.UPDATE,
      PermissionAction.DELETE,
    ],
  },
  [Feature.CUSTOMERS]: {
    name: 'Customer Management',
    description: 'Manage customer accounts and data',
    allowedActions: [
      PermissionAction.CREATE,
      PermissionAction.READ,
      PermissionAction.UPDATE,
      PermissionAction.DELETE,
    ],
  },
  [Feature.ORDERS]: {
    name: 'Order Management',
    description: 'Manage orders, status, and fulfillment',
    allowedActions: [
      PermissionAction.CREATE,
      PermissionAction.READ,
      PermissionAction.UPDATE,
      PermissionAction.DELETE,
    ],
  },
  [Feature.BANNERS]: {
    name: 'Banner Management',
    description: 'Manage promotional banners and sliders',
    allowedActions: [
      PermissionAction.CREATE,
      PermissionAction.READ,
      PermissionAction.UPDATE,
      PermissionAction.DELETE,
    ],
  },
  [Feature.POPUPS]: {
    name: 'Popup Management',
    description: 'Manage popup notifications and promotions',
    allowedActions: [
      PermissionAction.CREATE,
      PermissionAction.READ,
      PermissionAction.UPDATE,
      PermissionAction.DELETE,
    ],
  },
  [Feature.COUPONS]: {
    name: 'Coupon Management',
    description: 'Manage discount coupons and promotions',
    allowedActions: [
      PermissionAction.CREATE,
      PermissionAction.READ,
      PermissionAction.UPDATE,
      PermissionAction.DELETE,
    ],
  },
  [Feature.DASHBOARD]: {
    name: 'Dashboard Analytics',
    description: 'View dashboard analytics and reports',
    allowedActions: [PermissionAction.READ],
  },
  [Feature.ANALYTICS]: {
    name: 'System Analytics',
    description: 'View system analytics, logs, and online users',
    allowedActions: [PermissionAction.READ],
  },
  [Feature.LOGIN_AS_USER]: {
    name: 'Login as User',
    description: 'Allow admin to login as a customer',
    allowedActions: [PermissionAction.READ],
  },
};

// Helper function to validate permissions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validatePermissions(permissions: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(permissions)) {
    errors.push('Permissions must be an array');
    return { valid: false, errors };
  }

  const seenFeatures = new Set<string>();

  for (const permission of permissions) {
    // Check required fields
    if (!permission.feature) {
      errors.push('Permission missing feature field');
      continue;
    }

    // Check for duplicate features
    if (seenFeatures.has(permission.feature)) {
      errors.push(`Duplicate permission for feature: ${permission.feature}`);
    }
    seenFeatures.add(permission.feature);

    // Check if feature is valid
    if (!Object.values(Feature).includes(permission.feature)) {
      errors.push(`Invalid feature: ${permission.feature}`);
      continue;
    }

    // Check if actions are boolean
    const actions = ['create', 'read', 'update', 'delete'];
    for (const action of actions) {
      if (permission[action] !== undefined && typeof permission[action] !== 'boolean') {
        errors.push(`Permission ${action} must be a boolean for feature ${permission.feature}`);
      }
    }

    // Check if trying to assign actions that are not allowed for the feature
    const feature = permission.feature as Feature;
    const featureConfig = FEATURE_CONFIGS[feature];
    if (featureConfig) {
      if (
        permission.create === true &&
        !featureConfig.allowedActions.includes(PermissionAction.CREATE)
      ) {
        errors.push(
          `Feature ${permission.feature} does not support 'create' action. Only allowed actions: ${featureConfig.allowedActions.join(', ')}`
        );
      }
      if (
        permission.update === true &&
        !featureConfig.allowedActions.includes(PermissionAction.UPDATE)
      ) {
        errors.push(
          `Feature ${permission.feature} does not support 'update' action. Only allowed actions: ${featureConfig.allowedActions.join(', ')}`
        );
      }
      if (
        permission.delete === true &&
        !featureConfig.allowedActions.includes(PermissionAction.DELETE)
      ) {
        errors.push(
          `Feature ${permission.feature} does not support 'delete' action. Only allowed actions: ${featureConfig.allowedActions.join(', ')}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Helper function to normalize permissions
// Automatically sets create/update/delete to false for features that don't support those actions
export function normalizePermissions(permissions: IFeaturePermission[]): IFeaturePermission[] {
  return permissions.map(permission => {
    const feature = permission.feature as Feature;
    const config = FEATURE_CONFIGS[feature];

    if (!config) {
      return permission;
    }

    // Create normalized permission object
    const normalized: IFeaturePermission = {
      ...permission,
    };

    // Set create/update/delete to false if not in allowedActions
    if (!config.allowedActions.includes(PermissionAction.CREATE)) {
      normalized.create = false;
    }
    if (!config.allowedActions.includes(PermissionAction.UPDATE)) {
      normalized.update = false;
    }
    if (!config.allowedActions.includes(PermissionAction.DELETE)) {
      normalized.delete = false;
    }

    return normalized;
  });
}

// Helper function to check if action is allowed for feature
export function isActionAllowed(feature: Feature, action: PermissionAction): boolean {
  const config = FEATURE_CONFIGS[feature];
  return config.allowedActions.includes(action);
}

// Get all features list for UI (filtered to show only available features)
export function getAllFeatures(): Array<{
  feature: Feature;
  name: string;
  description: string;
  allowedActions: PermissionAction[];
}> {
  return AVAILABLE_FEATURES.filter(feature => FEATURE_CONFIGS[feature]) // Only include features that have config
    .map(feature => {
      const config = FEATURE_CONFIGS[feature];
      return {
        feature,
        name: config.name,
        description: config.description,
        allowedActions: config.allowedActions,
      };
    });
}
