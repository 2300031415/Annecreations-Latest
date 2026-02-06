import express from 'express';
import { getWallet, initiateAddFunds, verifyAddFunds } from '../controllers/wallet.controller';

const router = express.Router();

router.get('/', getWallet);
router.post('/initiate-add', initiateAddFunds);
router.post('/verify-add', verifyAddFunds);

export default router;
