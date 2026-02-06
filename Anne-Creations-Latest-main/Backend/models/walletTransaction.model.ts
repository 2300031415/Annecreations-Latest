import { Schema, model, Document, Types } from 'mongoose';

export interface IWalletTransaction extends Document {
    wallet: Types.ObjectId;
    user: Types.ObjectId;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    description?: string;
    referenceId?: string; // Order ID or Payment ID
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    createdAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
    {
        wallet: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
        user: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
        amount: { type: Number, required: true },
        type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
        description: { type: String },
        referenceId: { type: String },
        status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'COMPLETED' },
    },
    { timestamps: true }
);

export const WalletTransaction = model<IWalletTransaction>('WalletTransaction', walletTransactionSchema);
