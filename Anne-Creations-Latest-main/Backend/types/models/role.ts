import mongoose, { Document, Model } from 'mongoose';

// Permission actions
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

// Available features in the system
export enum Feature {
  ROLES = 'roles',
  ADMINS = 'admins',
  PRODUCTS = 'products',
  CATEGORIES = 'categories',
  CUSTOMERS = 'customers',
  ORDERS = 'orders',
  BANNERS = 'banners',
  POPUPS = 'popups',
  COUPONS = 'coupons',
  DASHBOARD = 'dashboard',
  ANALYTICS = 'analytics',
  LOGIN_AS_USER = 'loginAsUser',
}

// Features to show in UI (exclude disabled features and SuperAdmin-only features)
export const AVAILABLE_FEATURES = [
  Feature.ROLES,
  Feature.ADMINS,
  Feature.PRODUCTS,
  Feature.CATEGORIES,
  Feature.CUSTOMERS,
  Feature.ORDERS,
  // Feature.BANNERS,  // Temporarily disabled
  // Feature.POPUPS,   // Temporarily disabled
  Feature.COUPONS,
  Feature.DASHBOARD,
  Feature.ANALYTICS,
  Feature.LOGIN_AS_USER,
];

// Permission structure for a single feature
export interface IFeaturePermission {
  feature: Feature;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

// Role document interface
export interface IRole extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  permissions: IFeaturePermission[];
  status: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Role model interface (static methods)
export interface IRoleModel extends Model<IRole> {
  findByName(_name: string): Promise<IRole | null>;
  findActive(): Promise<IRole[]>;
  canDelete(_roleId: string): Promise<boolean>;
}
