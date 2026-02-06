import { Model } from 'mongoose';

import { IBaseDocument } from './base';

export interface ILanguage extends IBaseDocument {
  name: string;
  code: string;
  locale: string;
  image?: string;
  directory?: string;
  sortOrder: number;
  status: boolean;

  // Virtuals
  displayName: string;
  localeCode: string;

  // Methods
  getFullLanguage(): Promise<ILanguage>;
}

export interface ILanguageModel extends Model<ILanguage> {
  findByCode(_code: string): Promise<ILanguage | null>;
  findActive(): Promise<ILanguage[]>;
  findDefault(): Promise<ILanguage | null>;
}
