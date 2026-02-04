import { Model } from 'mongoose';

import { IBaseDocument } from './base';

export interface IMigrationStatus extends IBaseDocument {
  name: string;
  migratedDetails: Array<{
    tableName: string;
    processed: number;
    succeeded: number;
    failed: number;
    batchSize: number;
    lastBatchSize: number;
    totalBatches: number;
    error?: string;
    status: 'pending' | 'inProgress' | 'completed' | 'failed';
  }>;
  durationSeconds: number;
  status: 'pending' | 'inProgress' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;

  // Methods
  getFullMigrationStatus(): Promise<IMigrationStatus>;
}

export interface IMigrationStatusModel extends Model<IMigrationStatus> {
  findByTable(_tableName: string): Promise<IMigrationStatus | null>;
  findByStatus(_status: string): Promise<IMigrationStatus[]>;
  findCompleted(): Promise<IMigrationStatus[]>;
  findFailed(): Promise<IMigrationStatus[]>;
  getMigrationStats(): Promise<{
    totalTables: number;
    completedTables: number;
    failedTables: number;
  }>;
}
