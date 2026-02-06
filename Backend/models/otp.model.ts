import mongoose, { Document, Model } from 'mongoose';

export interface IOTP extends Document {
  mobile: string;
  otp: string;
  purpose: 'registration' | 'password_reset' | 'login' | 'verification';
  attempts: number;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface IOTPModel extends Model<IOTP> {
  findValidOTP(mobile: string, purpose: string): Promise<IOTP | null>;
  cleanupExpired(): Promise<void>;
}

const otpSchema = new mongoose.Schema<IOTP>(
  {
    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 6,
    },
    purpose: {
      type: String,
      required: true,
      enum: ['registration', 'password_reset', 'login', 'verification'],
      default: 'registration',
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
otpSchema.index({ mobile: 1, purpose: 1, isUsed: 1, expiresAt: 1 });

// TTL index to automatically delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to find valid OTP
otpSchema.statics.findValidOTP = function (mobile: string, purpose: string) {
  return this.findOne({
    mobile,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
};

// Static method to cleanup expired OTPs manually
otpSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

// Pre-save hook to clean mobile number
otpSchema.pre('save', function (next) {
  if (this.isModified('mobile')) {
    // Clean mobile number (remove spaces, dashes, etc.)
    this.mobile = this.mobile.replace(/[\s\-+()\u202F]/g, '');
  }
  next();
});

const OTP = mongoose.model<IOTP, IOTPModel>('OTP', otpSchema);

export default OTP;
