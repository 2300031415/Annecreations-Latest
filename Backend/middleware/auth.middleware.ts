// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import Admin from '../models/admin.model';
import Customer from '../models/customer.model';
import OnlineUser from '../models/onlineUser.model';
import { verifyAccessToken } from '../utils/jwtUtils';

export const authenticateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Token missing' });
    return;
  }

  try {
    const decoded = await verifyAccessToken(token);
    req.customer = {
      id: decoded.id,
      name: decoded.name,
      firstName: decoded.name,
      lastName: decoded.name,
      email: decoded.email,
      isAdmin: decoded.isAdmin,
    };

    const customer = await Customer.findById(req?.customer?.id);
    if (!customer) {
      res.status(401).json({ message: 'Customer not found' });
      return;
    }
    if (!customer.status) {
      res.status(403).json({ message: 'Customer account is disabled' });
      return;
    }

    // Update online user session for customers
    try {
      const browserId = req.cookies?.browserId;
      if (browserId) {
        const result = await OnlineUser.updateOne(
          { browserId },
          {
            $set: {
              userType: 'customer',
              customer: new mongoose.Types.ObjectId(decoded.id),
              lastActivity: new Date(),
            },
          }
        );

        console.log(
          `Customer session update result: modified=${result.modifiedCount}, customerId=${decoded.id}`
        );
      } else {
        console.log('No session cookie found in authenticated request');
      }
    } catch (err) {
      console.error('Error updating session:', err);
    }

    next();
  } catch {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Token missing' });
    return;
  }

  try {
    const decoded = await verifyAccessToken(token);
    // Check if token is for an admin
    if (!decoded.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }
    req.admin = {
      id: decoded.id,
      username: decoded.username,
      name: decoded.username,
      email: decoded.email || '',
      isAdmin: decoded.isAdmin,
    };

    const admin = await Admin.findById(req?.admin?.id);
    if (!admin) {
      res.status(401).json({ message: 'Admin not found' });
      return;
    }

    if (!admin.status) {
      res.status(403).json({ message: 'Admin account is disabled' });
      return;
    }

    next();
  } catch {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Middleware that allows either customer or admin access
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Token missing' });
    return;
  }

  try {
    const decoded = await verifyAccessToken(token);

    // Update session for customers only
    try {
      const browserId = req.cookies?.browserId;
      if (browserId && !decoded.isAdmin) {
        await OnlineUser.updateOne(
          { browserId },
          {
            $set: {
              userType: 'customer',
              customer: new mongoose.Types.ObjectId(decoded.id),
              lastActivity: new Date(),
            },
          }
        );
      }
    } catch (err) {
      console.error('Error updating session:', err);
    }

    // Set the appropriate user object
    if (decoded.isAdmin) {
      req.admin = {
        id: decoded.id,
        username: decoded.username,
        name: decoded.username,
        email: decoded.email || '',
        isAdmin: decoded.isAdmin,
      };
      const admin = await Admin.findById(req?.admin?.id);
      if (!admin) {
        res.status(401).json({ message: 'Admin not found' });
        return;
      }
      if (!admin.status) {
        res.status(403).json({ message: 'Admin account is disabled' });
        return;
      }
    } else {
      req.customer = {
        id: decoded.id,
        name: decoded.name,
        firstName: decoded.name,
        lastName: decoded.name,
        email: decoded.email,
        isAdmin: decoded.isAdmin,
      };
      const customer = await Customer.findById(req?.customer?.id);
      if (!customer) {
        res.status(401).json({ message: 'Customer not found' });
        return;
      }
      if (!customer.status) {
        res.status(403).json({ message: 'Customer account is disabled' });
        return;
      }
    }

    next();
  } catch {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Optional authentication middleware - populates req.customer if token is valid, but doesn't fail if no token
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    // No token provided, continue without authentication
    return next();
  }

  try {
    const decoded = await verifyAccessToken(token);

    // Update session for customers only
    try {
      const browserId = req.cookies?.browserId;
      if (browserId && !decoded.isAdmin) {
        await OnlineUser.updateOne(
          { browserId },
          {
            $set: {
              userType: 'customer',
              customer: new mongoose.Types.ObjectId(decoded.id),
              lastActivity: new Date(),
            },
          }
        );
      }
    } catch (err) {
      console.error('Error updating session:', err);
    }

    // Set the appropriate user object
    if (decoded.isAdmin) {
      req.admin = {
        id: decoded.id,
        username: decoded.username,
        name: decoded.username,
        email: decoded.email || '',
        isAdmin: decoded.isAdmin,
      };
      const admin = await Admin.findById(req?.admin?.id);
      if (!admin) {
        res.status(401).json({ message: 'Admin not found' });
        return;
      }
      if (!admin.status) {
        res.status(403).json({ message: 'Admin account is disabled' });
        return;
      }
    } else {
      req.customer = {
        id: decoded.id,
        name: decoded.name,
        firstName: decoded.name,
        lastName: decoded.name,
        email: decoded.email,
        isAdmin: decoded.isAdmin,
      };
      const customer = await Customer.findById(req?.customer?.id);
      if (!customer) {
        res.status(401).json({ message: 'Customer not found' });
        return;
      }
      if (!customer.status) {
        res.status(403).json({ message: 'Customer account is disabled' });
        return;
      }
    }

    next();
  } catch {
    // Invalid token, but continue without authentication instead of failing
    console.warn('Invalid token in optional auth middleware, continuing without authentication');
    next();
  }
};
