// utils/emailService.ts
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import type { SentMessageInfo } from 'nodemailer';
import type { Attachment } from 'nodemailer/lib/mailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isSecure = process.env.EMAIL_SECURE === 'true';
const port = Number(process.env.EMAIL_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || '',
  port: port,
  secure: isSecure, // true for 465 (SSL), false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  // Only apply TLS settings for non-secure connections (port 587)
  ...(!isSecure && port === 587
    ? {
        requireTLS: process.env.EMAIL_REQUIRE_TLS !== 'false',
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
          minVersion: 'TLSv1.2' as const,
        },
      }
    : {}),
  // Connection timeout
  connectionTimeout: 10000, // 10 seconds
  // Socket timeout
  socketTimeout: 10000, // 10 seconds
  // Pool connections
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
  attachments?: Attachment[];
}

interface Customer {
  email: string;
  firstName?: string;
  lastName?: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  orderId: string;
  dateAdded: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  quantity: number;
}

const loadTemplate = async (
  templateName: string,
  replacements: Record<string, unknown> = {}
): Promise<string> => {
  const templatesDir = path.join(__dirname, '..', 'templates', 'emails');

  try {
    await fs.mkdir(templatesDir, { recursive: true });
  } catch (err) {
    console.warn('Templates directory could not be created:', err);
  }

  const templatePath = path.join(templatesDir, `${templateName}.html`);
  let template: string;

  try {
    template = await fs.readFile(templatePath, 'utf8');
  } catch {
    template = await getDefaultTemplate(replacements);
  }

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    template = template.replace(regex, String(value));
  }

  return template;
};

const getDefaultTemplate = async (replacements: Record<string, unknown> = {}): Promise<string> => {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>{{ subject }}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 15px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>{{ companyName }}</h2>
        </div>
        <div class="content">
          <h3>{{ subject }}</h3>
          <p>{{ message }}</p>
          <p>{{ actionText }} <a href="{{ actionUrl }}">{{ actionLabel }}</a></p>
        </div>
        <div class="footer">
          <p>© {{ currentYear }} {{ companyName }}. All rights reserved.</p>
          <p>If you didn't request this email, please ignore it.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    html = html.replace(regex, String(value || ''));
  }

  html = html.replace(/{{.+?}}/g, '');
  return html;
};

export const sendEmail = async (options: EmailOptions): Promise<SentMessageInfo> => {
  try {
    // Verify transporter connection (optional - comment out if causing issues)
    try {
      await transporter.verify();
    } catch (verifyError: unknown) {
      console.warn(
        '⚠️ Email transporter verification failed:',
        verifyError instanceof Error ? verifyError.message : 'Unknown error'
      );
      // Continue anyway - the actual send might still work
    }

    const templateData = {
      companyName: process.env.EMAIL_FROM_NAME || 'Anne Creations',
      currentYear: new Date().getFullYear(),
      ...options.data,
    };

    const html = await loadTemplate(options.template, templateData);

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html,
      attachments: options.attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode =
      error && typeof error === 'object' && 'code' in error ? error.code : 'UNKNOWN';

    console.error('❌ Failed to send email:', {
      to: options.to,
      subject: options.subject,
      error: errorMessage,
      code: errorCode,
    });

    // Re-throw the error so calling code can handle it, but with more context
    // throw new Error(`Email sending failed: ${errorMessage}`);
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  resetUrl: string
): Promise<SentMessageInfo> => {
  const resetLink = `${resetUrl}?token=${token}&email=${encodeURIComponent(email)}`;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request - AnneCreations Hub',
    template: 'password-reset',
    data: {
      subject: 'Password Reset Request - AnneCreations Hub',
      message:
        'You have requested to reset your password. Click the button below to reset it. This link will expire in 15 minutes.',
      actionText: 'To reset your password, please click on this link:',
      actionUrl: resetLink,
      actionLabel: 'Reset Password',
    },
  });
};

export const sendOrderConfirmationEmail = async (
  order: Order,
  customer: Customer,
  urls?: {
    ordersUrl?: string;
    downloadsUrl?: string;
  }
): Promise<SentMessageInfo> => {
  const orderItems = order.items
    .map(
      item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>₹${item.price.toFixed(2)}</td>
        <td>₹${item.subtotal.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  // Calculate total from items to ensure accuracy
  const calculatedTotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);

  return sendEmail({
    to: customer?.email,
    subject: `Order Confirmation #${order.orderId}`,
    template: 'order-confirmation',
    data: {
      subject: `Order Confirmation #${order.orderId}`,
      customerName: `${customer?.firstName || ''} ${customer?.lastName || ''}`,
      orderId: order.orderId,
      orderDate: new Date(order.dateAdded).toLocaleDateString(),
      orderItems: orderItems,
      orderTotal: `₹${calculatedTotal.toFixed(2)}`,
      paymentMethod: order.paymentMethod,
      ordersUrl: urls?.ordersUrl || `${process.env.frontEndUrl}/Profile?tab=orders`,
      downloadsUrl: urls?.downloadsUrl || `${process.env.frontEndUrl}/Profile?tab=downloads`,
    },
  });
};

export const sendWelcomeEmail = async (customer: Customer): Promise<SentMessageInfo> => {
  return sendEmail({
    to: customer?.email,
    subject: 'Welcome to AnneCreations Hub',
    template: 'welcome',
    data: {
      subject: 'Welcome to AnneCreations Hub',
      customerName: `${customer?.firstName || ''} ${customer?.lastName || ''}`,
      message:
        "Thank you for creating an account with us. We're excited to have you as a customer!",
    },
  });
};

export const sendEmailVerificationEmail = async (
  customer: Customer,
  verificationToken: string,
  verificationUrl: string
): Promise<SentMessageInfo> => {
  const verificationLink = `${verificationUrl}?token=${verificationToken}&email=${encodeURIComponent(customer?.email)}`;

  return sendEmail({
    to: customer?.email,
    subject: 'Verify Your Email - AnneCreations Hub',
    template: 'email-verification',
    data: {
      subject: 'Verify Your Email - AnneCreations Hub',
      customerName: `${customer?.firstName || ''} ${customer?.lastName || ''}`,
      message:
        'Please verify your email address to complete your account registration and start using our services.',
      actionText: 'To verify your email address, please click on this link:',
      actionUrl: verificationLink,
      actionLabel: 'Verify Email',
    },
  });
};

export const sendPaymentFailureEmail = async (
  order: Order,
  customer: Customer,
  errorReason?: string
): Promise<SentMessageInfo> => {
  const orderItems = order.items
    .map(
      item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>₹${item.price.toFixed(2)}</td>
        <td>₹${item.subtotal.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  return sendEmail({
    to: customer?.email,
    subject: `Payment Failed - Order #${order.orderId}`,
    template: 'payment-failure',
    data: {
      subject: `Payment Failed - Order #${order.orderId}`,
      customerName: `${customer?.firstName || ''} ${customer?.lastName || ''}`,
      orderNumber: order.orderId,
      orderDate: new Date(order.dateAdded).toLocaleDateString(),
      orderItems: orderItems,
      orderTotal: order.total.toFixed(2),
      paymentMethod: order.paymentMethod,
      errorReason: errorReason || 'Payment processing failed',
    },
  });
};

// Verify email configuration on startup (non-blocking)
transporter
  .verify()
  .then(() => {
    console.log('✅ Email service ready');
    console.log(
      `📧 Email configuration: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT} (secure: ${process.env.EMAIL_SECURE === 'true'})`
    );
  })
  .catch(err => {
    console.error('❌ Email service verification failed:', err.message);
    console.error(
      '⚠️  Email sending will be attempted but may fail. Please check your configuration:'
    );
    console.error('   - EMAIL_HOST:', process.env.EMAIL_HOST || '(not set)');
    console.error('   - EMAIL_PORT:', process.env.EMAIL_PORT || '(not set)');
    console.error('   - EMAIL_SECURE:', process.env.EMAIL_SECURE || '(not set)');
    console.error('   - EMAIL_USER:', process.env.EMAIL_USER ? '(set)' : '(not set)');
    console.error('   - EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '(set)' : '(not set)');
    console.error(
      '   - Recommended: Port 465 with EMAIL_SECURE=true OR Port 587 with EMAIL_SECURE=false'
    );
  });

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendWelcomeEmail,
  sendEmailVerificationEmail,
  sendPaymentFailureEmail,
};
