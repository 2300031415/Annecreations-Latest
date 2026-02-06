import express from 'express';
import designRequestController from '../controllers/designRequest.controller';
import { imageUploader } from '../utils/multerConfig';

const router = express.Router();

router.post(
    '/',
    imageUploader.array('images', 5),
    designRequestController.createRequest
);

router.get(
    '/',
    designRequestController.getUserRequests
);

router.get(
    '/:id',
    designRequestController.getRequestById
);

router.get(
    '/:id/download',
    designRequestController.downloadDesign
);

router.post(
    '/:id/create-payment',
    designRequestController.createPayment
);

router.post(
    '/:id/verify-payment',
    designRequestController.verifyPayment
);

export default router;
