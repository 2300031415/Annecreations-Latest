import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface IZone extends IBaseDocument {
  country: Types.ObjectId;
  name: string;
  code: string;
  status: boolean;

  // Virtuals
  displayName: string;

  // Methods
  getFullZone(): Promise<IZone>;
}

export interface IZoneModel extends Model<IZone> {
  findByCountry(_countryId: Types.ObjectId): Promise<IZone[]>;
  findActive(): Promise<IZone[]>;
  findByCode(_code: string): Promise<IZone | null>;
  findByName(_name: string): Promise<IZone | null>;
}
