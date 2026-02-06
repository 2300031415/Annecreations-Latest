import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Wallet } from '../models/wallet.model';
import { WalletTransaction } from '../models/walletTransaction.model';
import { BaseController } from '../utils/baseController';
import { createRazorpayOrder, verifyPaymentSignature, getPaymentDetails } from '../utils/razorpayUtils';
import { sendErrorResponse, sendResponse } from '../utils/controllerUtils';

class WalletController extends BaseController {
    constructor() {
        super('Wallet');
    }

    // Get Wallet Details
    getWallet = async (req: Request, res: Response) => {
        await this.withAuth(req, res, 'getWallet', 'customer', async () => {
            const customerId = req.customer?.id;

            let wallet = await Wallet.findOne({ user: customerId });
            if (!wallet) {
                wallet = new Wallet({ user: customerId });
                await wallet.save();
            }

            const transactions = await WalletTransaction.find({ wallet: wallet._id })
                .sort({ createdAt: -1 })
                .limit(20);

            sendResponse(res, 200, {
                balance: wallet.balance,
                currency: wallet.currency,
                transactions,
            }, 'Wallet details retrieved successfully');
        });
    };

    /**
     * Step 1: Initiate Add Funds - Create Razorpay Order
     */
    initiateAddFunds = async (req: Request, res: Response) => {
        await this.withAuth(req, res, 'initiateAddFunds', 'customer', async () => {
            const { amount } = req.body;

            if (!amount || amount < 1) { // Minimum 1 Rupee
                sendErrorResponse(res, 400, 'Invalid amount. Minimum amount is ₹1.');
                return;
            }

            // Create Razorpay Order
            const razorpayOrder = await createRazorpayOrder(Number(amount), 'INR');

            sendResponse(res, 200, {
                key: process.env.RAZORPAY_KEY_ID, // Send key to frontend
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount, // In paise
                currency: razorpayOrder.currency,
            }, 'Payment initiated successfully');
        });
    };

    /**
     * Step 2: Verify Payment & Credit Wallet
     */
    verifyAddFunds = async (req: Request, res: Response) => {
        await this.withAuth(req, res, 'verifyAddFunds', 'customer', async () => {
            const customerId = req.customer?.id;
            const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount } = req.body;

            if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !amount) {
                sendErrorResponse(res, 400, 'Missing payment details');
                return;
            }

            // 1. Verify Signature
            const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
            if (!isValid) {
                sendErrorResponse(res, 400, 'Invalid payment signature');
                return;
            }

            // 2. Double-check payment status from Razorpay (Optional but Recommended)
            const paymentDetails = await getPaymentDetails(razorpayPaymentId);
            if (paymentDetails.status !== 'captured') {
                sendErrorResponse(res, 400, 'Payment not captured');
                return;
            }

            // 3. Update Wallet Balance (Atomic Transaction)
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                let wallet = await Wallet.findOne({ user: customerId }).session(session);
                if (!wallet) {
                    wallet = new Wallet({ user: customerId });
                    await wallet.save({ session });
                }

                // Check for duplicate transaction to avoid double crediting
                const existingTx = await WalletTransaction.findOne({
                    'metadata.razorpayPaymentId': razorpayPaymentId
                }).session(session);

                if (existingTx) {
                    await session.abortTransaction();
                    sendResponse(res, 200, { balance: wallet.balance }, 'Transaction already processed');
                    return;
                }

                // Credit Balance
                wallet.balance += Number(amount); // Amount received in body (frontend sends rupees)
                await wallet.save({ session });

                // Record Transaction
                const transaction = new WalletTransaction({
                    wallet: wallet._id,
                    user: customerId,
                    amount: Number(amount),
                    type: 'CREDIT',
                    description: `Added funds via Razorpay`,
                    status: 'COMPLETED',
                    metadata: {
                        razorpayOrderId,
                        razorpayPaymentId
                    }
                });
                await transaction.save({ session });

                await session.commitTransaction();

                sendResponse(res, 200, {
                    balance: wallet.balance,
                    transactionId: transaction._id
                }, 'Funds added successfully');

            } catch (error) {
                await session.abortTransaction();
                throw error;
            } finally {
                session.endSession();
            }
        });
    };
}

const walletController = new WalletController();
export const { getWallet, initiateAddFunds, verifyAddFunds } = walletController;
export default walletController;
