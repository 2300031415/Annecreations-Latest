import express from 'express';

import ContactController, { contactController } from '../controllers/contact.controller';
import { handleValidationErrors } from '../middleware/validation.middleware';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ContactForm:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - mobileNumber
 *         - message
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: Contact person's first name
 *           example: "John"
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: Contact person's last name
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: Contact person's email address
 *           example: "john.doe@example.com"
 *         mobileNumber:
 *           type: string
 *           pattern: '^[\\+]?[1-9][\d]{0,15}$'
 *           description: Contact person's mobile number
 *           example: "+1234567890"
 *         message:
 *           type: string
 *           minLength: 10
 *           maxLength: 2000
 *           description: Contact message
 *           example: "I would like to know more about your products and services."
 *
 *     ContactResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Response message
 *           example: "Your message has been sent successfully. We will get back to you soon!"
 *         data:
 *           type: object
 *           properties:
 *             firstName:
 *               type: string
 *               description: Contact person's first name
 *               example: "John"
 *             lastName:
 *               type: string
 *               description: Contact person's last name
 *               example: "Doe"
 *             email:
 *               type: string
 *               description: Contact person's email address
 *               example: "john.doe@example.com"
 *             mobileNumber:
 *               type: string
 *               description: Contact person's mobile number
 *               example: "+1234567890"
 *             messageLength:
 *               type: number
 *               description: Length of the message
 *               example: 45
 *             sentAt:
 *               type: string
 *               format: date-time
 *               description: Timestamp when the message was sent
 *               example: "2024-01-15T10:30:00.000Z"
 */

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Send contact form message
 *     description: Send a contact form message to the admin and receive a confirmation email
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactForm'
 *           examples:
 *             contactExample:
 *               summary: Contact form submission example
 *               value:
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 email: "john.doe@example.com"
 *                 mobileNumber: "+1234567890"
 *                 message: "I would like to know more about your products and services. Could you please provide more information about pricing and availability?"
 *     responses:
 *       200:
 *         description: Contact message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Your message has been sent successfully. We will get back to you soon!"
 *                 data:
 *                   $ref: '#/components/schemas/ContactResponse/properties/data'
 *             examples:
 *               success:
 *                 summary: Successful contact form submission
 *                 value:
 *                   success: true
 *                   message: "Your message has been sent successfully. We will get back to you soon!"
 *                   data:
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                     email: "john.doe@example.com"
 *                     mobileNumber: "+1234567890"
 *                     messageLength: 45
 *                     sentAt: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Validation error or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "email"
 *                       message:
 *                         type: string
 *                         example: "Please provide a valid email address"
 *             examples:
 *               validationError:
 *                 summary: Validation error example
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   errors:
 *                     - field: "email"
 *                       message: "Please provide a valid email address"
 *                     - field: "mobileNumber"
 *                       message: "Please provide a valid mobile number"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to send your message. Please try again later."
 *                 error:
 *                   type: string
 *                   description: Error details (only in development mode)
 *                   example: "SMTP connection failed"
 */
router.post(
  '/',
  ContactController.validateContactForm,
  handleValidationErrors,
  contactController.sendContactMessage
);

export default router;
