import { Document, Model, Types } from 'mongoose';

/**
 * Interface for popup button
 */
export interface IPopupButton {
  _id?: Types.ObjectId;
  text: string;
  action: string; // URL or action identifier
  style?: 'primary' | 'secondary' | 'outline' | 'link';
  icon?: string;
}

/**
 * Interface for Popup document
 */
export interface IPopup extends Document {
  _id: Types.ObjectId;
  title: string;
  content: string; // Can be HTML content
  image?: string;
  buttons?: IPopupButton[];
  status: boolean; // true = active, false = inactive
  displayFrequency?: 'once' | 'always'; // How often to show
  sortOrder: number;
  deviceType?: 'all' | 'mobile' | 'desktop'; // Device targeting
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isActive(): boolean;
}

/**
 * Interface for Popup model with static methods
 */
export interface IPopupModel extends Model<IPopup> {
  getActivePopup(deviceType?: string): Promise<IPopup | null>;
  deactivateAll(): Promise<void>;
}
