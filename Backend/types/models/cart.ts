import { Model, Types } from 'mongoose';

import { IBaseDocument, IProductItem } from './base';

export interface ICart extends IBaseDocument {
  customerId?: Types.ObjectId;
  items: IProductItem[];

  // Virtuals
  itemCount: number;
  isEmpty: boolean;
  subtotal: number;

  // Methods
  getFullCart(): Promise<ICart>;
}

export interface ICartModel extends Model<ICart> {
  findByCustomer(_customerId: Types.ObjectId): Promise<ICart | null>;
  findActive(): Promise<ICart[]>;
  findEmpty(): Promise<ICart[]>;
}
