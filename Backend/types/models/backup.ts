import { Model } from 'mongoose';

import { IBaseDocument } from './base';

export interface IBackupInfo {
  name: string;
  path: string;
  size: number;
  createdAt: Date;
  status: 'completed' | 'failed' | 'in_progress';
  error?: string;
}

export interface IBackupResponse {
  message: string;
  backupName: string;
  path: string;
  timestamp: string;
}

export interface IRestoreResponse {
  message: string;
  backupName: string;
  timestamp: string;
}

export interface IBackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup?: Date;
  availableSpace: number;
}

export interface IBackup extends IBaseDocument {
  name: string;
  path: string;
  size: number;
  status: 'completed' | 'failed' | 'in_progress';
  error?: string;
  metadata?: Record<string, unknown>;

  // Methods
  getBackupInfo(): Promise<IBackupInfo>;
  validateBackup(): Promise<boolean>;
}

export interface IBackupModel extends Model<IBackup> {
  findByName(_name: string): Promise<IBackup | null>;
  findByStatus(_status: string): Promise<IBackup[]>;
  getBackupStats(): Promise<IBackupStats>;
  cleanupOldBackups(_daysToKeep: number): Promise<number>;
}
