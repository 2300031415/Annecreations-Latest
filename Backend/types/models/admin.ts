import { Model } from 'mongoose';
import { Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface IAdmin extends IBaseDocument {
  username: string;
  password: string;
  salt: string;
  firstName: string;
  lastName: string;
  email: string;
  image?: string;
  ipAddress?: string;
  status: boolean;
  lastLogin?: Date;
  lastIp?: string;
  totalLogins?: number;
  resetToken?: string;
  role?: Types.ObjectId; // Can be ObjectId or populated Role object
  createdBy?: Types.ObjectId; // Admin ObjectId who created this admin

  // Virtuals
  fullName: string;

  // Methods
  getFullAdmin(): Promise<IAdmin>;
  updateLoginInfo(_ip: string): Promise<IAdmin>;
  isActive(): boolean;
  isSuperAdmin(): Promise<boolean>;
}

export interface IAdminModel extends Model<IAdmin> {
  findByEmail(_email: string): Promise<IAdmin | null>;
  findByUsername(_username: string): Promise<IAdmin | null>;
  findActive(): Promise<IAdmin[]>;
}
