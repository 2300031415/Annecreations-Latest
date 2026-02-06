import express from 'express';
import ReviewController from '../controllers/review.controller';

const router = express.Router();

router.post('/', ReviewController.addReview);
router.get('/:productId', ReviewController.getReviewsByProduct);

export default router;
