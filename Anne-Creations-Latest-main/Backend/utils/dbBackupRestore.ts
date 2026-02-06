import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

import dotenv from 'dotenv';

dotenv.config();

const BACKUP_DIR = process.env.BACKUP_DIR || './backups';

interface BackupMetadata {
  timestamp: string;
  database: string;
  collections: string[];
  createdBy: string;
}

interface BackupInfo {
  name: string;
  path: string;
  created: string | Date;
  database?: string;
  size: number;
}

export const createBackup = async (backupName = ''): Promise<string> => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dirName = backupName ? `${backupName}_${timestamp}` : `backup_${timestamp}`;
    const backupPath = path.join(BACKUP_DIR, dirName);

    await fs.mkdir(backupPath, { recursive: true });

    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) throw new Error('MongoDB URI not found in environment variables');

    const dbName = mongoURI.split('/').pop()?.split('?')[0] || 'unknown';

    const mongodump = spawn('mongodump', [`--uri=${mongoURI}`, `--out=${backupPath}`]);

    return await new Promise((resolve, reject) => {
      let errorOutput = '';

      mongodump.stderr.on('data', data => {
        errorOutput += data.toString();
      });

      mongodump.on('close', async code => {
        if (code !== 0) return reject(new Error(`mongodump failed: ${errorOutput}`));

        const metadata: BackupMetadata = {
          timestamp: new Date().toISOString(),
          database: dbName,
          collections: [],
          createdBy: 'OpenCart API',
        };

        try {
          await fs.writeFile(
            path.join(backupPath, 'backup-metadata.json'),
            JSON.stringify(metadata, null, 2)
          );
          resolve(backupPath);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Backup creation failed: ${msg}`);
  }
};

export const restoreBackup = async (backupPath: string): Promise<boolean> => {
  try {
    await fs.access(backupPath);

    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) throw new Error('MongoDB URI not found in environment variables');

    const mongorestore = spawn('mongorestore', ['--uri=' + mongoURI, '--drop', backupPath]);

    return await new Promise((resolve, reject) => {
      let errorOutput = '';

      mongorestore.stderr.on('data', data => {
        errorOutput += data.toString();
      });

      mongorestore.on('close', code => {
        if (code !== 0) {
          reject(new Error(`mongorestore failed with code ${code}: ${errorOutput}`));
        } else {
          resolve(true);
        }
      });
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Backup restoration failed: ${msg}`);
  }
};

export const listBackups = async (): Promise<BackupInfo[]> => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const files = await fs.readdir(BACKUP_DIR);
    const backups: BackupInfo[] = [];

    for (const file of files) {
      const fullPath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        try {
          const metadataPath = path.join(fullPath, 'backup-metadata.json');
          const metadataContent = await fs.readFile(metadataPath, 'utf8');
          const metadata: BackupMetadata = JSON.parse(metadataContent);

          backups.push({
            name: file,
            path: fullPath,
            created: metadata.timestamp,
            database: metadata.database,
            size: await calculateDirectorySize(fullPath),
          });
        } catch {
          backups.push({
            name: file,
            path: fullPath,
            created: stats.mtime,
            size: await calculateDirectorySize(fullPath),
          });
        }
      }
    }

    return backups.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to list backups: ${msg}`);
  }
};

export const deleteBackup = async (backupName: string): Promise<boolean> => {
  try {
    const backupPath = path.join(BACKUP_DIR, backupName);
    await fs.access(backupPath);
    await fs.rm(backupPath, { recursive: true, force: true });
    return true;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete backup: ${msg}`);
  }
};

async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;
  const files = await fs.readdir(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
      totalSize += await calculateDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  }

  return totalSize;
}

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
