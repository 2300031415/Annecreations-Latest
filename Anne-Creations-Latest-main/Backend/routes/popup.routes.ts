import express from 'express';

import popupController from '../controllers/popup.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Feature, PermissionAction } from '../types/models/role';
import { imageUploader } from '../utils/multerConfig';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PopupButton:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Button ID
 *         text:
 *           type: string
 *           description: Button text
 *         action:
 *           type: string
 *           description: Button action (URL or action identifier)
 *         style:
 *           type: string
 *           enum: [primary, secondary, outline, link]
 *           description: Button style
 *         icon:
 *           type: string
 *           description: Optional icon identifier
 *
 *     Popup:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Popup ID
 *         title:
 *           type: string
 *           description: Popup title
 *         content:
 *           type: string
 *           description: Popup content (can be HTML)
 *         image:
 *           type: string
 *           description: Image path with /image/ prefix
 *           example: "image/catalog/popups/welcome-popup.jpg"
 *         buttons:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PopupButton'
 *         status:
 *           type: boolean
 *           description: Active status
 *         deviceType:
 *           type: string
 *           enum: [all, mobile, desktop]
 *           default: all
 *           description: Device type targeting
 *         displayFrequency:
 *           type: string
 *           enum: [once, always]
 *           description: How often to display the popup
 *         sortOrder:
 *           type: number
 *           description: Sort order
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PopupCreate:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 200
 *           description: Popup title
 *           example: "Welcome to AnneCreations!"
 *         content:
 *           type: string
 *           description: Popup content (can be HTML)
 *           example: "Get 20% off your first order with code WELCOME20"
 *         image:
 *           type: string
 *           format: binary
 *           description: Optional popup image (max 5MB)
 *         buttons:
 *           type: string
 *           description: JSON string of button objects
 *           example: '[{"text": "Shop Now", "action": "/products", "style": "primary"}, {"text": "Close", "action": "close", "style": "secondary"}]'
 *         displayFrequency:
 *           type: string
 *           enum: [once, always]
 *           default: once
 *           description: How often to display the popup
 *         sortOrder:
 *           type: number
 *           default: 0
 *           description: Sort order for display
 *         status:
 *           type: boolean
 *           default: false
 *           description: Active status (only one popup can be active at a time)
 *         deviceType:
 *           type: string
 *           enum: [all, mobile, desktop]
 *           default: all
 *           description: Device type targeting (all, mobile, or desktop)
 */

/**
 * @swagger
 * tags:
 *   name: Popups
 *   description: Popup notification management
 */

/**
 * @swagger
 * /api/popups/active:
 *   get:
 *     summary: Get active popup (Public)
 *     tags: [Popups]
 *     parameters:
 *       - in: query
 *         name: deviceType
 *         schema:
 *           type: string
 *           enum: [mobile, desktop]
 *         description: Device type for targeting (optional, auto-detected from user agent if not provided)
 *         example: "mobile"
 *     responses:
 *       200:
 *         description: Active popup retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Popup'
 *             examples:
 *               success:
 *                 summary: Active popup found
 *                 value:
 *                   success: true
 *                   data:
 *                     _id: "507f1f77bcf86cd799439011"
 *                     title: "Welcome to AnneCreations!"
 *                     content: "Get 20% off your first order with code WELCOME20"
 *                     image: "image/catalog/popups/welcome-popup.jpg"
 *                     displayFrequency: "once"
 *                     sortOrder: 1
 *                     deviceType: "all"
 *                     buttons:
 *                       - _id: "507f191e810c19729de860ea"
 *                         text: "Shop Now"
 *                         action: "/products"
 *                         style: "primary"
 *                         icon: "shopping-cart"
 *                       - _id: "507f191e810c19729de860eb"
 *                         text: "Close"
 *                         action: "close"
 *                         style: "secondary"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T10:30:00Z"
 *               noPopup:
 *                 summary: No active popup
 *                 value:
 *                   success: true
 *                   data: null
 *                   message: "No active popup available"
 *       500:
 *         description: Server error
 */
router.get('/active', popupController.getActivePopup);

/**
 * @swagger
 * /api/popups:
 *   get:
 *     summary: Get all popups (Admin)
 *     tags: [Popups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all popups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Popup'
 *                 count:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  authenticateAdmin,
  checkPermission(Feature.POPUPS, PermissionAction.READ),
  popupController.getAllPopups
);

/**
 * @swagger
 * /api/popups/{id}:
 *   get:
 *     summary: Get popup by ID (Admin)
 *     tags: [Popups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Popup ID
 *     responses:
 *       200:
 *         description: Popup details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Popup'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Popup not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  authenticateAdmin,
  checkPermission(Feature.POPUPS, PermissionAction.READ),
  popupController.getPopupById
);

/**
 * @swagger
 * /api/popups:
 *   post:
 *     summary: Create new popup (Admin)
 *     tags: [Popups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PopupCreate'
 *     responses:
 *       201:
 *         description: Popup created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authenticateAdmin,
  checkPermission(Feature.POPUPS, PermissionAction.CREATE),
  imageUploader.single('image'),
  popupController.createPopup
);

/**
 * @swagger
 * /api/popups/{id}:
 *   patch:
 *     summary: Update popup (Admin)
 *     tags: [Popups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Popup ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               buttons:
 *                 type: string
 *                 description: JSON string of button objects
 *               displayFrequency:
 *                 type: string
 *                 enum: [once, always]
 *               sortOrder:
 *                 type: number
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Popup updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Popup not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id',
  authenticateAdmin,
  checkPermission(Feature.POPUPS, PermissionAction.UPDATE),
  imageUploader.single('image'),
  popupController.updatePopup
);

/**
 * @swagger
 * /api/popups/{id}/toggle-status:
 *   patch:
 *     summary: Toggle popup status (Admin)
 *     tags: [Popups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Popup ID
 *     responses:
 *       200:
 *         description: Popup status toggled successfully
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Popup not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id/toggle-status',
  authenticateAdmin,
  checkPermission(Feature.POPUPS, PermissionAction.UPDATE),
  popupController.togglePopupStatus
);

/**
 * @swagger
 * /api/popups/{id}/image:
 *   delete:
 *     summary: Delete popup image (Admin)
 *     tags: [Popups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Popup ID
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       400:
 *         description: Invalid ID format or popup has no image
 *       404:
 *         description: Popup not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id/image',
  authenticateAdmin,
  checkPermission(Feature.POPUPS, PermissionAction.UPDATE),
  popupController.deletePopupImage
);

/**
 * @swagger
 * /api/popups/{id}:
 *   delete:
 *     summary: Delete popup (Admin)
 *     tags: [Popups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Popup ID
 *     responses:
 *       200:
 *         description: Popup deleted successfully
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Popup not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  authenticateAdmin,
  checkPermission(Feature.POPUPS, PermissionAction.DELETE),
  popupController.deletePopup
);

export default router;
