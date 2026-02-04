import { Request, Response } from 'express';
import mongoose from 'mongoose';
import DesignRequest from '../models/designRequest.model';
import { BaseController } from '../utils/baseController';
import { sendErrorResponse, sendResponse, validateObjectId } from '../utils/controllerUtils';
import { saveFileToDisk, deleteFileIfExists } from '../utils/fileUtils';
import { createRazorpayOrder, verifyPaymentSignature } from '../utils/razorpayUtils';

class DesignRequestController extends BaseController {
    constructor() {
        super('DesignRequest');
    }

    createRequest = async (req: Request, res: Response) => {
        await this.withAuth(req, res, 'createRequest', 'customer', async () => {
            try {
                const customerId = req.customer?.id;
                const { description, colors } = req.body;

                let imagePaths: string[] = [];
                if (req.files && Array.isArray(req.files)) {
                    imagePaths = (req.files as Express.Multer.File[]).map(file =>
                        saveFileToDisk(file, 'requests/images')
                    );
                } else if (req.file) {
                    imagePaths.push(saveFileToDisk(req.file, 'requests/images'));
                }

                if (imagePaths.length === 0) {
                    return sendErrorResponse(res, 400, 'At least one reference image is required');
                }

                const newRequest = new DesignRequest({
                    customer: customerId,
                    images: imagePaths,
                    description,
                    colors,
                    status: 'pending'
                });

                await newRequest.save();
                sendResponse(res, 201, newRequest);

            } catch (error) {
                console.error('Error creating design request:', error);
                sendErrorResponse(res, 500, 'Failed to create design request');
            }
        });
    };

    getUserRequests = async (req: Request, res: Response) => {
        await this.withAuth(req, res, 'getUserRequests', 'customer', async () => {
            const customerId = req.customer?.id;
            const requests = await DesignRequest.find({ customer: customerId }).sort({ createdAt: -1 });
            sendResponse(res, 200, requests);
        });
    };

    getRequestById = async (req: Request, res: Response) => {
        await this.withAuth(req, res, 'getRequestById', 'customer', async () => {
            const { id } = req.params;
            if (!validateObjectId(id)) return sendErrorResponse(res, 400, 'Invalid ID');

            const request = await DesignRequest.findOne({
                _id: id,
                customer: req.customer?.id
            });

            if (!request) return sendErrorResponse(res, 404, 'Request not found');
            sendResponse(res, 200, request);
        });
    };

    // Method to allow downloading the final design if paid
    downloadDesign = async (req: Request, res: Response) => {
        await this.withAuth(req, res, 'downloadDesign', 'customer', async () => {
            const { id } = req.params;
            if (!validateObjectId(id)) return sendErrorResponse(res, 400, 'Invalid ID');

            const request = await DesignRequest.findOne({
                _id: id,
                customer: req.customer?.id
            });

            if (!request) return sendErrorResponse(res, 404, 'Request not found');

            if (request.status !== 'completed' && request.status !== 'paid') { // Assuming 'paid' might be enough or it needs to be 'completed' with file
                // If status isn't completed/paid, check if payment is pending
                if (request.status === 'reviewed' && request.paymentStatus !== 'paid') {
                    return sendErrorResponse(res, 402, 'Payment required');
                }
                return sendErrorResponse(res, 403, 'Design not ready for download');
            }

            if (!request.designFile) {
                return sendErrorResponse(res, 404, 'Design file not available');
            }

            // Logic to download file (similar to product download)
            // For now, redirect or send file. Assuming file path is local.
            const path = await import('path');
            const fullPath = path.join(process.cwd(), request.designFile);
            res.download(fullPath);
        });
    };

    createPayment = async (req: Request, res: Response) => {
        await this.withAuth(req, res, 'createPayment', 'customer', async () => {
            const { id } = req.params;
            if (!validateObjectId(id)) return sendErrorResponse(res, 400, 'Invalid ID');

            const request = await DesignRequest.findOne({ _id: id, customer: req.customer?.id });
            if (!request) return sendErrorResponse(res, 404, 'Request not found');

            if (request.status !== 'reviewed') return sendErrorResponse(res, 400, 'Request is not in reviewed state');
            if (request.paymentStatus === 'paid') return sendErrorResponse(res, 400, 'Already paid');
            if (!request.cost || request.cost <= 0) return sendErrorResponse(res, 400, 'Cost not set by admin');

            try {
                const order = await createRazorpayOrder(request.cost, 'INR', id);
                sendResponse(res, 200, {
                    orderId: order.id,
                    amount: request.cost,
                    currency: 'INR',
                    key: process.env.RAZORPAY_KEY_ID
                });
            } catch (error) {
                console.error('Razorpay Error:', error);
                sendErrorResponse(res, 500, 'Payment init failed');
            }
        });
    };

    verifyPayment = async (req: Request, res: Response) => {
        await this.withAuth(req, res, 'verifyPayment', 'customer', async () => {
            const { id } = req.params;
            const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

            if (!validateObjectId(id)) return sendErrorResponse(res, 400, 'Invalid ID');

            const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
            if (!isValid) return sendErrorResponse(res, 400, 'Invalid signature');

            const request = await DesignRequest.findOneAndUpdate(
                { _id: id, customer: req.customer?.id },
                {
                    status: 'paid',
                    paymentStatus: 'paid',
                    $push: {
                        // Optional: Add logging/history if model supported it 
                    }
                },
                { new: true }
            );

            if (!request) return sendErrorResponse(res, 404, 'Request not found');

            sendResponse(res, 200, { success: true, request });
        });
    };
}

const designRequestController = new DesignRequestController();
export default designRequestController;
