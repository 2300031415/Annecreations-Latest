import { Request } from 'express';
import { Types } from 'mongoose';

import { getClientIp } from '../middleware/activityTracker.middleware';
import AuditLog from '../models/auditLog.model';

// Helper function to set appropriate entity field based on entity type
const setEntityFields = (entityType: string, entityId?: Types.ObjectId) => {
  const entityFields: any = {};

  if (entityId) {
    switch (entityType) {
      case 'Product':
        entityFields.productId = entityId;
        break;
      case 'Order':
        entityFields.orderId = entityId;
        break;
      case 'Customer':
        entityFields.customerId = entityId;
        break;
      case 'Category':
        entityFields.categoryId = entityId;
        break;
      case 'Admin':
        entityFields.adminId = entityId;
        break;
      default:
        entityFields.entityId = entityId.toString();
    }
  }

  return entityFields;
};

class AuditLogService {
  async createLog(
    req: Request & { admin?: unknown; customer?: unknown },
    action: string,
    entityType: string,
    prevState: Record<string, unknown> | null,
    newState: Record<string, unknown> | null,
    details: string = '',
    entityId?: Types.ObjectId
  ) {
    try {
      let userId: Types.ObjectId;
      let userType: 'admin' | 'customer';
      let username: string;
      let email: string;

      if (req.admin) {
        userId = new Types.ObjectId(req.admin.id);
        userType = 'admin';
        username = req.admin?.username || '';
        email = req.admin.email;
      } else if (req.customer) {
        userId = new Types.ObjectId(req.customer.id);
        userType = 'customer';
        username = req.customer?.name || '';
        email = req.customer?.email || '';
      } else {
        return null;
      }

      const ip = getClientIp(req);

      const entityFields = setEntityFields(entityType, entityId);

      const auditLog = new AuditLog({
        user: userId,
        userType: userType,
        username,
        email,
        ipAddress: ip,
        action,
        entityType: entityType,
        ...entityFields,
        previousState: prevState,
        newState: newState,
        details,
      });

      await auditLog.save();
      return auditLog.toObject();
    } catch (error) {
      console.error('Error creating audit log:', error);
      return null;
    }
  }

  async logCreate(req: Request, entityType: string, entity: Record<string, unknown>, details = '') {
    const entityId = entity._id as Types.ObjectId;
    return this.createLog(req as Request, 'create', entityType, null, entity, details, entityId);
  }

  async logUpdate(
    req: Request,
    entityType: string,
    prevEntity: Record<string, unknown> | null,
    newEntity: Record<string, unknown> | null,
    details = ''
  ) {
    const entityId = newEntity?._id as Types.ObjectId;
    return this.createLog(
      req as Request,
      'update',
      entityType,
      prevEntity,
      newEntity,
      details,
      entityId
    );
  }

  async logDelete(
    req: Request,
    entityType: string,
    entity: Record<string, unknown> | null,
    details = ''
  ) {
    const entityId = entity?._id as Types.ObjectId;
    return this.createLog(req as Request, 'delete', entityType, entity, null, details, entityId);
  }

  async logCustomAction(
    req: Request,
    action: string,
    entityType: string,
    entityId: Types.ObjectId,
    data = {},
    details = ''
  ) {
    return this.createLog(req, action, entityType, null, data, details, entityId);
  }
}

export default new AuditLogService();
