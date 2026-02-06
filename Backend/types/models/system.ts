import { Model } from 'mongoose';

import { IBaseDocument } from './base';

export interface ISystemHealth {
  database: boolean;
  fileSystem: boolean;
  overall: boolean;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export interface IDatabaseStatus {
  status: 'disconnected' | 'connected' | 'connecting' | 'disconnecting';
  readyState: number;
  collections: number;
  totalDocuments: number;
  totalIndexes: number;
}

export interface IFileSystemStatus {
  catalogAccessible: boolean;
  uploadsAccessible: boolean;
  availableSpace: number;
  totalSpace: number;
}

export interface ICollectionStats {
  count: number;
  size: number;
  avgObjSize: number;
  indexes: number;
  error?: string;
}

export interface ISystemOverview {
  database: IDatabaseStatus;
  fileSystem: IFileSystemStatus;
  collections: Record<string, ICollectionStats>;
  systemInfo: {
    nodeVersion: string;
    platform: string;
    memory: {
      used: number;
      total: number;
      free: number;
    };
    uptime: number;
  };
  timestamp: Date;
}

export interface ISystem extends IBaseDocument {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  health: ISystemHealth;
  lastCheck: Date;
  checks: Array<{
    name: string;
    status: boolean;
    duration: number;
    error?: string;
    timestamp: Date;
  }>;

  // Methods
  runHealthCheck(): Promise<ISystemHealth>;
  getSystemOverview(): Promise<ISystemOverview>;
}

export interface ISystemModel extends Model<ISystem> {
  getCurrentStatus(): Promise<ISystem | null>;
  updateHealth(_health: ISystemHealth): Promise<void>;
  getHealthHistory(_days: number): Promise<ISystem[]>;
}
