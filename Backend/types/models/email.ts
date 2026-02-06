import { Model, Types } from 'mongoose';

import { IBaseDocument } from './base';

export interface IEmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables: string[];
  category: 'welcome' | 'order' | 'password-reset' | 'admin-notification' | 'marketing';
  status: boolean;
  language: string;
}

export interface IEmailData {
  to: string | string[];
  subject: string;
  template: string;
  variables: Record<string, any>;
  attachments?: IEmailAttachment[];
  cc?: string[];
  bcc?: string[];
}

export interface IEmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
  encoding?: string;
}

export interface IEmailLog extends IBaseDocument {
  template: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  variables: Record<string, any>;
  attachments?: IEmailAttachment[];
  ipAddress?: string;
  userAgent?: string;

  // Methods
  markAsSent(): Promise<void>;
  markAsFailed(_error: string): Promise<void>;
  incrementRetryCount(): Promise<void>;
  shouldRetry(): boolean;
}

export interface IEmailLogModel extends Model<IEmailLog> {
  findByStatus(_status: string): Promise<IEmailLog[]>;
  findByTemplate(_template: string): Promise<IEmailLog[]>;
  findByRecipient(_recipient: string): Promise<IEmailLog[]>;
  getEmailStats(): Promise<{
    totalEmails: number;
    sentEmails: number;
    failedEmails: number;
    successRate: number;
  }>;
  cleanupOldLogs(_daysToKeep: number): Promise<number>;
}

export interface IEmailSettings {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: {
    name: string;
    email: string;
  };
  replyTo?: string;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  rateLimit: {
    maxEmails: number;
    timeWindow: number;
  };
}
