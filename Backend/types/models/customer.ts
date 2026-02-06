import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface IAddress extends IBaseDocument {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  country: Types.ObjectId;
  zone?: Types.ObjectId;
  preferedBillingAddress?: boolean;
}

export interface ICustomer extends IBaseDocument {
  languageId: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  salt: string;
  newsletter?: boolean;
  ipAddress: string;
  status: boolean;
  mobileVerified: boolean;
  emailVerified: boolean;
  resetToken?: string;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  addresses: IAddress[];
  lastLogin?: Date;
  lastIp?: string;
  totalLogins?: number;

  // Virtuals
  fullName: string;
  primaryAddress: IAddress;

  // Methods
  getFullCustomer(): Promise<ICustomer>;
}

export interface ICustomerModel extends Model<ICustomer> {
  findByEmail(_email: string): Promise<ICustomer | null>;
  findByMobile(_mobile: string): Promise<ICustomer | null>;
  findByStatus(_status: boolean): Promise<ICustomer[]>;
  findNewsletterSubscribers(): Promise<ICustomer[]>;
  findByEmailVerificationToken(_token: string): Promise<ICustomer | null>;
  findActive(): Promise<ICustomer[]>;
}
