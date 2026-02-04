import { Router } from 'express';
import aiController from '../controllers/ai.controller';

const router = Router();

// Chat interaction
router.post('/chat', aiController.chat);

// Verification and Link Generation
router.post('/verify', aiController.verifyAndLink);

// Download Endpoint
router.get('/download/:token', aiController.downloadWithToken);

export default router;
