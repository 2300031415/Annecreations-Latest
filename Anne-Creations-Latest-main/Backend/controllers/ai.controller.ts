import { Request, Response } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Product from '../models/product.model';
import Order from '../models/order.model';
import { BaseController } from '../utils/baseController';
import path from 'path';
import { createReadStream } from 'fs';

class AiController extends BaseController {
    constructor() {
        super('AI');
    }

    // 1. Process User Message
    chat = async (req: Request, res: Response) => {
        try {
            const { message } = req.body;
            if (!message) return res.status(400).json({ reply: "How can I help you?" });

            const lowerMsg = message.toLowerCase();

            // Intent: Product Discovery
            if (lowerMsg.includes('search') || lowerMsg.includes('find') || lowerMsg.includes('design') || lowerMsg.includes('looking for')) {
                const keyword = lowerMsg.replace(/search|find|design|looking for|show me/g, '').trim();
                // Basic product search
                const products = await Product.find({
                    $or: [
                        { productModel: { $regex: keyword, $options: 'i' } },
                        { description: { $regex: keyword, $options: 'i' } },
                        { 'seo.metaKeyword': { $regex: keyword, $options: 'i' } }
                    ],
                    status: true
                })
                    .select('productModel image options.price')
                    .limit(5)
                    .lean();

                if (products.length > 0) {
                    return res.json({
                        reply: `I found ${products.length} designs matching "${keyword}":`,
                        type: 'products',
                        data: products
                    });
                } else {
                    return res.json({ reply: `I couldn't find any designs for "${keyword}". Try checking our Categories!` });
                }
            }

            // Intent: Download Issue
            if (lowerMsg.includes('download') && (lowerMsg.includes('issue') || lowerMsg.includes('fail') || lowerMsg.includes('link'))) {
                return res.json({
                    reply: "I can help with download issues. Please provide your Order Number (or Payment ID) and the Product ID/Name.",
                    type: 'request_info',
                    fields: ['orderId', 'productId']
                });
            }

            // Default Greeting
            return res.json({ reply: "Hello! I am Anne Creations' AI Assistant. I can help you find designs or resolve download issues. How can I help?" });

        } catch (error) {
            console.error("AI Chat Error:", error);
            return res.status(500).json({ reply: "I encountered an error. Please contact human support." });
        }
    };

    // 2. Verify Purchase & Generate Link
    verifyAndLink = async (req: Request, res: Response) => {
        try {
            const { orderId, productId } = req.body;
            if (!orderId || !productId) return res.status(400).json({ success: false, message: "Missing Order ID or Product ID" });

            // Try to find order by ID or Order Number
            let order;
            if (mongoose.Types.ObjectId.isValid(orderId)) {
                order = await Order.findOne({ _id: orderId, orderStatus: 'paid' }).lean();
            }
            if (!order) {
                order = await Order.findOne({ orderNumber: orderId, orderStatus: 'paid' }).lean();
            }

            if (!order) {
                return res.json({ success: false, message: "I could not verify that order. It might be unpaid or incorrect. Escalating to admin." });
            }

            // Verify Product exists in order
            // Note: order.products is an array of { product: ObjectId, ... }
            // User might send Product ID or Product Name (model)
            let targetProduct = null;
            let targetOption = null;

            // Resolve productId (user input) to actual Product ObjectId
            // First check if input is a valid ID
            if (mongoose.Types.ObjectId.isValid(productId)) {
                const p = order.products.find((p: any) => p.product.toString() === productId);
                if (p) targetProduct = p;
            }

            // If not found by ID, search details inside order (populate not usually here, so we might need to fetch product info)
            if (!targetProduct) {
                // If user sent a name/model, we need to map it. 
                // Since 'order.products' contains 'product' reference, checking model name requires population or separate query.
                // Let's assume for simplicity we require Product ID or we match against Order's known product list if possible.
                // WE will fetch the full order with products to check names
                const fullOrder = await Order.findById(order._id).populate('products.product').lean();
                if (fullOrder) {
                    const found = fullOrder.products.find((p: any) =>
                        p.product.productModel.toLowerCase().includes(productId.toLowerCase()) ||
                        p.product._id.toString() === productId
                    );
                    if (found) {
                        targetProduct = found;
                        // Default to first option if not specified
                        targetOption = found.options[0];
                    }
                }
            }

            if (!targetProduct) {
                return res.json({ success: false, message: "Order verified, but I couldn't find that product in it. Escalating." });
            }

            // Generate Token
            const token = jwt.sign(
                {
                    orderId: order._id,
                    productId: targetProduct.product._id || targetProduct.product, // Handle populated or not
                    optionId: targetOption?.option?._id || targetOption?.option || targetProduct.options[0].option // Simplified: grabbing first option
                },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '1h' }
            );

            const downloadLink = `${process.env.APP_URL || 'http://localhost:5000'}/api/ai/download/${token}`;

            return res.json({
                success: true,
                message: "Purchase verified! Here is your secure, one-time 1-hour download link:",
                link: downloadLink
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: "System error during verification." });
        }
    };

    // 3. Handle Token Download
    downloadWithToken = async (req: Request, res: Response) => {
        try {
            const { token } = req.params;
            if (!token) return res.status(400).send("Missing token");

            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            const { productId, optionId } = decoded;

            // Re-use logic from DownloadController (simplified info extraction)
            const product = await Product.findById(productId).populate('options.option').lean();
            if (!product) return res.status(404).send("Product not found");

            // Find option (assuming first if simple, but we encoded optionId)
            // Fix: Product model structure for options
            const productOption = product.options?.find((o: any) =>
                o.option._id.toString() === optionId || o.option.toString() === optionId
            );

            if (!productOption || !productOption.uploadedFilePath) {
                return res.status(404).send("File not found");
            }

            const filePath = path.join(process.cwd(), productOption.uploadedFilePath);
            // Check existence
            const fs = await import('fs');
            if (!fs.existsSync(filePath)) return res.status(404).send("File missing on server");

            res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
            const fileStream = createReadStream(filePath);
            fileStream.pipe(res);

        } catch (error) {
            return res.status(403).send("Invalid or expired link");
        }
    }
}

export default new AiController();
