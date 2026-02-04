import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

import { sendEmail } from '../utils/emailService';

class ContactController {
  // Validation rules for contact form
  static validateContactForm = [
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('First name can only contain letters and spaces'),

    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Last name can only contain letters and spaces'),

    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),

    body('mobileNumber')
      .trim()
      .notEmpty()
      .withMessage('Mobile number is required')
      .matches(/^[\\+]?[1-9][\d]{0,15}$/)
      .withMessage('Please provide a valid mobile number'),

    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be between 10 and 2000 characters'),
  ];

  // Send contact form email to admin
  sendContactMessage = async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { firstName, lastName, email, mobileNumber, message } = req.body;

      // Prepare email data
      const emailData = {
        firstName,
        lastName,
        email,
        mobileNumber,
        message,
        fullName: `${firstName} ${lastName}`,
        timestamp: new Date().toLocaleString('en-US', {
          timeZone: 'UTC',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      // Send email to admin (non-blocking)
      try {
        await sendEmail({
          to: process.env.CONTACT_ADMIN_EMAIL || 'support@annecreations.com',
          subject: `New Contact Form Submission from ${emailData.fullName}`,
          template: 'contact-form',
          data: emailData,
        });
      } catch (emailError) {
        console.error('Failed to send admin notification email:', emailError);
        // Continue - don't block the response
      }

      // Send confirmation email to customer (non-blocking)
      try {
        await sendEmail({
          to: email,
          subject: 'Thank you for contacting us - AnneCreations Hub',
          template: 'contact-confirmation',
          data: emailData,
        });
      } catch (emailError) {
        console.error('Failed to send customer confirmation email:', emailError);
        // Continue - don't block the response
      }

      res.status(200).json({
        success: true,
        message: 'Your message has been sent successfully. We will get back to you soon!',
        data: {
          firstName,
          lastName,
          email,
          mobileNumber,
          messageLength: message.length,
          sentAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send your message. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
      });
    }
  };
}

export default ContactController;
export const contactController = new ContactController();
