import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Review from '../models/review.model';
import Product from '../models/product.model';
import { BaseController } from '../utils/baseController';
import { getPaginationOptions } from '../utils/controllerUtils';

class ReviewController extends BaseController {
    constructor() {
        super('Review');
    }

    addReview = async (req: Request, res: Response) => {
        await this.withAuth(req, res, 'addReview', 'customer', async () => {
            const { productId, rating, comment } = req.body;
            const userId = req.customer?.id;

            if (!productId || !rating) {
                return res.status(400).json({ message: 'Product ID and rating are required' });
            }

            if (rating < 1 || rating > 5) {
                return res.status(400).json({ message: 'Rating must be between 1 and 5' });
            }

            // Check if product exists
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            // Check if user already reviewed this product
            const existingReview = await Review.findOne({ product: productId, user: userId });
            if (existingReview) {
                return res.status(409).json({ message: 'You have already reviewed this product' });
            }

            const review = new Review({
                product: productId,
                user: userId,
                rating,
                comment,
            });

            await review.save();

            return res.status(201).json(review);
        });
    };

    getReviewsByProduct = async (req: Request, res: Response) => {
        await this.withAuth(req, res, 'getReviewsByProduct', 'public', async () => {
            const productId = req.params.productId;
            const { page, limit, skip } = getPaginationOptions(req);

            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({ message: 'Invalid product ID' });
            }

            const filters = { product: productId, status: true };

            const reviews = await Review.find(filters)
                .populate('user', 'firstName lastName') // Assuming Customer model has firstName/lastName
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await Review.countDocuments(filters);

            // Calculate average rating
            const stats = await Review.aggregate([
                { $match: filters },
                {
                    $group: {
                        _id: '$product',
                        averageRating: { $avg: '$rating' },
                        count: { $sum: 1 },
                    },
                },
            ]);

            const averageRating = stats.length > 0 ? stats[0].averageRating : 0;

            const pagination = {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            };

            return res.status(200).json({
                data: reviews,
                meta: {
                    averageRating: parseFloat(averageRating.toFixed(1)),
                    totalReviews: total,
                },
                pagination,
            });
        });
    };
}

export default new ReviewController();
