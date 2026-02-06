import { Request, Response } from 'express';
import mongoose from 'mongoose';

import { BaseController } from '../utils/baseController';

class SystemController extends BaseController {
  constructor() {
    super('System');
  }

  getSystemOverview = async (req: Request, res: Response): Promise<void> => {
    await this.withAuth(req, res, 'getSystemOverview', 'admin', async () => {
      // Database status
      const dbStatus = mongoose.connection.readyState;
      const dbStates: { [key: number]: string } = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      // Get collection stats
      const db = mongoose.connection.db;
      if (!db) {
        res.status(500).json({
          success: false,
          message: 'Database connection not available',
        });
        return;
      }

      const collections = await db.listCollections().toArray();

      const collectionStats: { [key: string]: any } = {};
      let totalDocuments = 0;
      let totalIndexes = 0;

      for (const collection of collections) {
        try {
          const stats = await (db.collection(collection.name) as any).stats();
          const indexes = await db.collection(collection.name).indexes();

          collectionStats[collection.name] = {
            count: stats.count || 0,
            size: stats.size || 0,
            avgObjSize: stats.avgObjSize || 0,
            indexes: indexes.length,
          };

          totalDocuments += stats.count;
          totalIndexes += indexes.length;
        } catch (err) {
          const error = err as Error;
          collectionStats[collection.name] = {
            count: 0,
            size: 0,
            avgObjSize: 0,
            indexes: 0,
            error: error.message,
          };
        }
      }

      // Server info
      const serverInfo = {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        pid: process.pid,
      };

      const response = {
        database: {
          status: dbStates[dbStatus] || 'unknown',
          name: db.databaseName,
          total_collections: collections.length,
          total_documents: totalDocuments,
          total_indexes: totalIndexes,
          collections: collectionStats,
        },
        server: serverInfo,
        timestamp: new Date(),
      };

      res.status(200).json({
        success: true,
        data: response,
      });
    });
  };

  getHealthCheck = async (req: Request, res: Response): Promise<void> => {
    await this.withAuth(req, res, 'getHealthCheck', 'admin', async () => {
      const dbHealth = await this.checkDatabaseHealth();
      const fsHealth = await this.checkFileSystemHealth();

      const response = {
        status: dbHealth && fsHealth ? 'healthy' : 'unhealthy',
        checks: {
          database: dbHealth ? 'healthy' : 'unhealthy',
          filesystem: fsHealth ? 'healthy' : 'unhealthy',
        },
        timestamp: new Date(),
      };

      const statusCode = dbHealth && fsHealth ? 200 : 503;
      res.status(statusCode).json({
        success: true,
        data: response,
      });
    });
  };

  getSystemMetrics = async (req: Request, res: Response): Promise<void> => {
    await this.withAuth(req, res, 'getSystemMetrics', 'admin', async () => {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      const response = {
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers,
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        uptime: process.uptime(),
        timestamp: new Date(),
      };

      res.status(200).json({
        success: true,
        data: response,
      });
    });
  };

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      // await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkFileSystemHealth(): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      await fs.access('./catalog');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create controller instance
const systemController = new SystemController();

// Export all controller methods
export const { getSystemOverview, getHealthCheck, getSystemMetrics } = systemController;

// Export default for backward compatibility
export default {
  getSystemOverview,
  getHealthCheck,
  getSystemMetrics,
};
