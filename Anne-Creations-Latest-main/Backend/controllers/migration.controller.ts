import { Request, Response } from 'express';
import mongoose from 'mongoose';

import MigrationStatus from '../models/migrationStatus.model';
import { BaseController } from '../utils/baseController';
import { formatMigrationResponse } from '../utils/responseFormatter';

class MigrationController extends BaseController {
  constructor() {
    super('Migration');
  }

  getMigrationStatus = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getMigrationStatus', 'admin', async () => {
      const migrations = await MigrationStatus.find().sort({ createdAt: -1 }).lean();

      // Get collection counts
      const db = mongoose.connection.db;
      const collections = await db?.listCollections().toArray();

      if (!collections) {
        res.status(200).json({
          success: true,
          data: { message: 'No collections found' },
        });
        return;
      }

      const collectionCounts: Record<string, number> = {};
      for (const collection of collections) {
        try {
          const count = await db?.collection(collection.name).countDocuments();
          collectionCounts[collection.name] = count || 0;
        } catch (err) {
          collectionCounts[collection.name] = 0;
        }
      }

      // Calculate overall migration progress
      const totalMigrations = migrations.length;
      const completedMigrations = migrations.filter(m => m.status === 'completed').length;
      const failedMigrations = migrations.filter(m => m.status === 'failed').length;
      const runningMigrations = migrations.filter(m => m.status === 'inProgress').length;

      const response = {
        overview: {
          total_migrations: totalMigrations,
          completed: completedMigrations,
          failed: failedMigrations,
          running: runningMigrations,
          progress_percentage:
            totalMigrations > 0 ? Math.round((completedMigrations / totalMigrations) * 100) : 0,
        },
        migrations: migrations.map(migration => formatMigrationResponse(migration)),
        collections: collectionCounts,
        generated_at: new Date(),
      };

      res.status(200).json({
        success: true,
        data: response,
      });
    });
  };

  getMigrationDetails = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'getMigrationDetails', 'admin', async () => {
      const migrationName = req.params.name;
      const migration = await MigrationStatus.findOne({ name: migrationName }).lean();

      if (!migration) {
        res.status(404).json({
          success: false,
          message: 'Migration not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: formatMigrationResponse(migration),
      });
    });
  };

  resetMigrationStatus = async (req: Request, res: Response) => {
    await this.withAuth(req, res, 'resetMigrationStatus', 'admin', async () => {
      const migrationName = req.params.name;

      // Get migration to log deletion
      const migration = await MigrationStatus.findOne({ name: migrationName });
      if (!migration) {
        res.status(404).json({
          success: false,
          message: 'Migration not found',
        });
        return;
      }

      await MigrationStatus.deleteOne({ name: migrationName });

      const response = {
        message: 'Migration status reset successfully',
        migration_name: migrationName,
        migration_id: migration._id.toString(),
      };

      res.status(200).json({
        success: true,
        data: response,
      });
    });
  };
}

// Create controller instance
const migrationController = new MigrationController();

// Export all controller methods
export const { getMigrationStatus, getMigrationDetails, resetMigrationStatus } =
  migrationController;

// Export default for backward compatibility
export default {
  getMigrationStatus,
  getMigrationDetails,
  resetMigrationStatus,
};
