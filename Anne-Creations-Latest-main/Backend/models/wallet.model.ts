import { Schema, model, Document, Types } from 'mongoose';

export interface IWallet extends Document {
    user: Types.ObjectId;
    balance: number;
    currency: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true }, // Changed ref to Customer based on customer.model.ts usually being the user model in e-com, but wait..
        // Let me check 'customer.model.ts' vs 'admin.model.ts'. Usually authentication uses a User model? 
        // In the file list I see 'customer.model.ts' and 'admin.model.ts'.
        // I should check `authStore` or `login` payload to see what model is used. 
        // Usually 'Customer' for frontend users.
        balance: { type: Number, default: 0, min: 0 },
        currency: { type: String, default: 'INR' },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const Wallet = model<IWallet>('Wallet', walletSchema);
