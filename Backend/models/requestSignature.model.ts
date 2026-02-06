/**
 * Request Signature Model
 * Stores used signatures to prevent replay attacks
 * Signatures are automatically deleted after 2 minutes using MongoDB TTL index
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IRequestSignature extends Document {
  signature: string;
  endpoint: string;
  createdAt: Date;
}

const requestSignatureSchema = new Schema<IRequestSignature>(
  {
    signature: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 120, // Auto-delete after 2 minutes (TTL index)
    },
  },
  {
    timestamps: false,
  }
);

// Ensure TTL index for automatic cleanup (2 minutes = 120 seconds)
requestSignatureSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 });

const RequestSignature = mongoose.model<IRequestSignature>(
  'RequestSignature',
  requestSignatureSchema
);

export default RequestSignature;
