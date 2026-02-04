import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface IOption extends IBaseDocument {
  languageId: Types.ObjectId;
  name: string;
  sortOrder: number;
  status: boolean;

  // Virtuals
  displayName: string;

  // Methods
  getFullProductOption(): Promise<IOption>;
}

export interface IOptionModel extends Model<IOption> {
  findActive(): Promise<IOption[]>;
  findByName(_name: string): Promise<IOption | null>;
  findByType(_type: string): Promise<IOption[]>;
}
