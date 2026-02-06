import { Model } from 'mongoose';

import { IBaseDocument } from './base';

export interface ICountry extends IBaseDocument {
  name: string;
  isoCode2: string;
  isoCode3: string;
  addressFormat: string;
  postcodeRequired: boolean;
  status: boolean;

  // Virtuals
  displayName: string;

  // Methods
  getFullCountry(): Promise<ICountry>;
}

export interface ICountryModel extends Model<ICountry> {
  findByIsoCode(_isoCode: string): Promise<ICountry | null>;
  findActive(): Promise<ICountry[]>;
  findByName(_name: string): Promise<ICountry | null>;
}
