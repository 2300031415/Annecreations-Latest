import express from 'express';

import roleController from '../controllers/role.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import {
  validateRoleCreate,
  validateRoleUpdate,
  handleValidationErrors,
} from '../middleware/validation.middleware';
import { Feature, PermissionAction } from '../types/models/role';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles
 *     description: Retrieve all roles with pagination (Admin only with read permission)
 *     tags: [Roles, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter by role status
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 *       401:
 *         description: Unauthorized - Admin authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/', checkPermission(Feature.ROLES, PermissionAction.READ), roleController.getAllRoles);

/**
 * @swagger
 * /roles/features:
 *   get:
 *     summary: Get available features list
 *     description: Get list of all available features for role creation (Admin only)
 *     tags: [Roles, Admin]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Features list retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/features',
  checkPermission(Feature.ROLES, PermissionAction.READ),
  roleController.getFeaturesList
);

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     description: Retrieve detailed information about a specific role (Admin only)
 *     tags: [Roles, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *       400:
 *         description: Invalid role ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  checkPermission(Feature.ROLES, PermissionAction.READ),
  roleController.getRoleById
);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a new role
 *     description: Create a new role with permissions (Admin only with create permission)
 *     tags: [Roles, Admin]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name
 *                 example: "Content Editor"
 *               description:
 *                 type: string
 *                 description: Role description
 *                 example: "Can manage products, categories, and content"
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     feature:
 *                       type: string
 *                       enum: [admins, products, categories, customers, orders, banners, popups, coupons, dashboard, analytics]
 *                     create:
 *                       type: boolean
 *                     read:
 *                       type: boolean
 *                     update:
 *                       type: boolean
 *                     delete:
 *                       type: boolean
 *               status:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Role name already exists
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  checkPermission(Feature.ROLES, PermissionAction.CREATE),
  validateRoleCreate,
  handleValidationErrors,
  roleController.createRole
);

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: Update a role
 *     description: Update an existing role (Admin only with update permission)
 *     tags: [Roles, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     feature:
 *                       type: string
 *                     create:
 *                       type: boolean
 *                     read:
 *                       type: boolean
 *                     update:
 *                       type: boolean
 *                     delete:
 *                       type: boolean
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot modify superAdmin role
 *       404:
 *         description: Role not found
 *       409:
 *         description: Role name already exists
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  checkPermission(Feature.ROLES, PermissionAction.UPDATE),
  validateRoleUpdate,
  handleValidationErrors,
  roleController.updateRole
);

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     description: Delete a role (Admin only with delete permission)
 *     tags: [Roles, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       400:
 *         description: Invalid role ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot delete superAdmin role
 *       404:
 *         description: Role not found
 *       409:
 *         description: Role is in use by admins
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  checkPermission(Feature.ROLES, PermissionAction.DELETE),
  roleController.deleteRole
);

/**
 * @swagger
 * /roles/{id}/admins:
 *   get:
 *     summary: Get admins by role
 *     description: Get all admins assigned to a specific role (Admin only)
 *     tags: [Roles, Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Admins retrieved successfully
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id/admins',
  checkPermission(Feature.ROLES, PermissionAction.READ),
  roleController.getAdminsByRole
);

export default router;
