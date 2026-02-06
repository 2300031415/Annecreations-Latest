// controllers/backup.controller.ts
import path from 'path';

import { Request, Response } from 'express';

import { BaseController } from '../utils/baseController';
import {
  createBackup,
  restoreBackup,
  listBackups,
  deleteBackup,
  formatBytes,
} from '../utils/dbBackupRestore';

class BackupController extends BaseController {
  constructor() {
    super('Backup');
  }

  createBackupHandler = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'createBackup', 'admin', async () => {
      const { name } = req.body;

      // Validate backup name if provided
      if (name && (!/^[a-zA-Z0-9_-]+$/.test(name) || name.length > 50)) {
        res.status(400).json({
          success: false,
          message:
            'Invalid backup name. Use only letters, numbers, hyphens, and underscores. Max 50 characters.',
        });
        return;
      }

      const backupPath = await createBackup(name);
      const backupName = path.basename(backupPath);

      res.status(201).json({
        success: true,
        message: 'Backup created successfully',
        data: {
          backupName,
          path: backupPath,
          timestamp: new Date().toISOString(),
        },
      });
    });
  };

  restoreBackupHandler = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'restoreBackup', 'admin', async () => {
      const { backupName } = req.params;

      // Validate backup name
      if (!backupName) {
        res.status(400).json({
          success: false,
          message: 'Backup name is required',
        });
        return;
      }

      // Get available backups to check if the requested backup exists
      const backups = await listBackups();
      const backup = backups.find(b => b.name === backupName);

      if (!backup) {
        res.status(404).json({
          success: false,
          message: 'Backup not found',
        });
        return;
      }

      await restoreBackup(backup.path);

      res.json({
        success: true,
        message: 'Database restored successfully',
        data: {
          backupName,
          timestamp: new Date().toISOString(),
        },
      });
    });
  };

  getBackupsHandler = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getBackups', 'admin', async () => {
      const backups = await listBackups();

      // Format backup sizes to be human-readable
      const formattedBackups = backups.map(backup => ({
        ...backup,
        size_raw: backup.size,
        size: formatBytes(backup.size),
      }));

      res.json({
        success: true,
        data: {
          count: formattedBackups.length,
          backups: formattedBackups,
        },
      });
    });
  };

  deleteBackupHandler = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'deleteBackup', 'admin', async () => {
      const { backupName } = req.params;

      // Validate backup name
      if (!backupName) {
        res.status(400).json({
          success: false,
          message: 'Backup name is required',
        });
        return;
      }

      // Get available backups to check if the requested backup exists
      const backups = await listBackups();
      const backup = backups.find(b => b.name === backupName);

      if (!backup) {
        res.status(404).json({
          success: false,
          message: 'Backup not found',
        });
        return;
      }

      await deleteBackup(backupName);

      res.json({
        success: true,
        message: 'Backup deleted successfully',
        data: {
          backupName,
        },
      });
    });
  };
}

// Create controller instance
const backupController = new BackupController();

// Export all controller methods
export const { createBackupHandler, restoreBackupHandler, getBackupsHandler, deleteBackupHandler } =
  backupController;

// Export default for backward compatibility
export default {
  createBackupHandler,
  restoreBackupHandler,
  getBackupsHandler,
  deleteBackupHandler,
};
