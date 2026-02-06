// routes/admin.routes.ts
import express from 'express';

import {
  loginAdmin,
  getProfile,
  updateAdmin,
  changePassword,
  getAllAdmins,
  getAdminById,
  deleteAdmin,
  refreshAccessToken,
  logoutAdmin,
  adminLoginAsUser,
  createAdmin,
  updateAdminById,
} from '../controllers/admin.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { authLimiter } from '../middleware/rate-limit.middleware';
import {
  validatePasswordChange,
  validateAdminCreate,
  handleValidationErrors,
  validateObjectId,
} from '../middleware/validation.middleware';
import { Feature, PermissionAction } from '../types/models/role';

const router = express.Router();

// Public routes

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     description: Authenticate admin user and receive access token
 *     tags: [Admin, Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLogin'
 *     responses:
 *       200:
 *         description: Admin login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLoginResponse'
 *       400:
 *         description: Bad request - Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid username or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authLimiter, loginAdmin);

/**
 * @swagger
 * /admin/refresh-token:
 *   post:
 *     summary: Refresh admin access token
 *     description: Generate a new access token using a valid refresh token
 *     tags: [Admin, Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refresh successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: New access token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   description: New refresh token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Bad request - Refresh token is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh-token', refreshAccessToken);

// Protected routes (require authentication)

/**
 * @swagger
 * /admin/profile:
 *   get:
 *     summary: Get admin profile
 *     description: Retrieve the current admin user's profile information
 *     tags: [Admin]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminProfile'
 *       401:
 *         description: Unauthorized - Admin authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', authenticateAdmin, getProfile);

/**
 * @swagger
 * /admin/logout:
 *   post:
 *     summary: Admin logout
 *     description: Logout the current admin and invalidate their access session. The accessId is blacklisted to invalidate both access and refresh tokens.
 *     tags: [Admin, Authentication]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', authenticateAdmin, logoutAdmin);

/**
 * @swagger
 * /admin/update/{id}:
 *   put:
 *     summary: Update admin user
 *     description: Update an admin user's information (admin only)
 *     tags: [Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 maxLength: 100
 *                 description: Admin username
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 255
 *                 description: Admin email address
 *               firstName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Admin first name
 *               lastName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Admin last name
 *               status:
 *                 type: boolean
 *                 description: Admin account status
 *     responses:
 *       200:
 *         description: Admin user updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin updated successfully"
 *                 admin:
 *                   $ref: '#/components/schemas/AdminProfile'
 *       400:
 *         description: Bad request - Invalid admin data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Admin user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Username or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/update/:id', authenticateAdmin, updateAdmin);

/**
 * @swagger
 * /admin/change-password:
 *   post:
 *     summary: Change admin password
 *     description: Change the current admin user's password
 *     tags: [Admin]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *               confirmPassword:
 *                 type: string
 *                 description: Confirm new password
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *       400:
 *         description: Bad request - Invalid password data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin authentication required or invalid current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Unprocessable entity - New passwords don't match
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/change-password',
  authenticateAdmin,
  validatePasswordChange,
  handleValidationErrors,
  changePassword
);

/**
 * @swagger
 * /admin/all:
 *   get:
 *     summary: Get all admin users
 *     description: Retrieve a list of all admin users (admin only)
 *     tags: [Admin]
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
 *         description: Number of admins per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter by admin status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search admins by username, email, or name
 *     responses:
 *       200:
 *         description: Admin users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Admin'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 message:
 *                   type: string
 *                   example: "Admin users retrieved successfully"
 *       401:
 *         description: Unauthorized - Admin authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/all',
  authenticateAdmin,
  checkPermission(Feature.ADMINS, PermissionAction.READ),
  getAllAdmins
);

/**
 * @swagger
 * /admin/login-as-user:
 *   post:
 *     summary: Admin login as user
 *     description: Allows admin to login as a specific customer by customer ID and receive customer tokens
 *     tags: [Admin]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *             properties:
 *               customerId:
 *                 type: string
 *                 description: The ID of the customer to login as
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Successfully logged in as customer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customer:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     mobile:
 *                       type: string
 *                       example: "+1234567890"
 *                     status:
 *                       type: boolean
 *                       example: true
 *                     newsletter:
 *                       type: boolean
 *                       example: false
 *                     totalLogins:
 *                       type: number
 *                       example: 5
 *                     lastLogin:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-12-01T10:30:00.000Z"
 *                 accessToken:
 *                   type: string
 *                   description: Customer access token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   description: Customer refresh token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 isAdminSession:
 *                   type: boolean
 *                   description: Indicates this is an admin session
 *                   example: true
 *                 adminContext:
 *                   type: object
 *                   description: Admin context information
 *                   properties:
 *                     adminId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439012"
 *                     adminUsername:
 *                       type: string
 *                       example: "admin_user"
 *       400:
 *         description: Bad request - Customer ID is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Customer account is disabled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found - Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Login as Customer feature - requires LOGIN_AS_USER permission
 */
router.post(
  '/login-as-user',
  authenticateAdmin,
  checkPermission(Feature.LOGIN_AS_USER, PermissionAction.READ),
  adminLoginAsUser
);

// ===== ADMIN MANAGEMENT ENDPOINTS =====

/**
 * @swagger
 * /admin:
 *   post:
 *     summary: Create new admin user
 *     description: Create a new admin user and optionally assign a role (SuperAdmin only)
 *     tags: [Admin]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *               - firstName
 *               - lastName
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username for the admin
 *                 example: "john_admin"
 *               password:
 *                 type: string
 *                 description: Admin password (will be hashed)
 *                 example: "SecurePassword123!"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin email address
 *                 example: "john@example.com"
 *               firstName:
 *                 type: string
 *                 description: Admin first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: Admin last name
 *                 example: "Doe"
 *               roleId:
 *                 type: string
 *                 description: Role ID to assign (optional, including SuperAdmin role)
 *                 example: "507f1f77bcf86cd799439011"
 *               status:
 *                 type: boolean
 *                 description: Admin account status
 *                 default: true
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: Invalid role or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires SuperAdmin access
 *       404:
 *         description: Role not found
 *       409:
 *         description: Username or email already exists
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  authenticateAdmin,
  checkPermission(Feature.ADMINS, PermissionAction.CREATE),
  validateAdminCreate,
  handleValidationErrors,
  createAdmin
);

/**
 * @swagger
 * /admin/{id}/role:
 *   put:
 *     summary: Assign role to admin
 *     description: Assign or update role for an admin user (Requires admin update permission)
 *     tags: [Admin, Roles]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleId:
 *                 type: string
 *                 description: Role ID to assign (null to remove role)
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *       400:
 *         description: Invalid admin ID or role ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot modify superAdmin
 *       404:
 *         description: Admin or role not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id/update',
  authenticateAdmin,
  checkPermission(Feature.ADMINS, PermissionAction.UPDATE),
  validateObjectId,
  handleValidationErrors,
  updateAdminById
);

/**
 * @swagger
 * /admin/{id}:
 *   get:
 *     summary: Get admin by ID
 *     description: Retrieve a specific admin user by ID (SuperAdmin only)
 *     tags: [Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *     responses:
 *       200:
 *         description: Admin user retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *                 message:
 *                   type: string
 *                   example: "Admin retrieved successfully"
 *       400:
 *         description: Bad request - Invalid admin ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - SuperAdmin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Admin user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:id/profile',
  authenticateAdmin,
  checkPermission(Feature.ADMINS, PermissionAction.READ),
  validateObjectId,
  handleValidationErrors,
  getAdminById
);

/**
 * @swagger
 * /admin/{id}:
 *   delete:
 *     summary: Delete admin user
 *     description: Delete an admin user (SuperAdmin only). Cannot delete the last SuperAdmin or yourself.
 *     tags: [Admin]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID to delete
 *     responses:
 *       200:
 *         description: Admin user deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: "Admin deleted successfully"
 *       400:
 *         description: Bad request - Invalid admin ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - SuperAdmin access required, cannot delete last SuperAdmin, or cannot delete yourself
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Admin user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  authenticateAdmin,
  checkPermission(Feature.ADMINS, PermissionAction.DELETE),
  validateObjectId,
  handleValidationErrors,
  deleteAdmin
);

export default router;
