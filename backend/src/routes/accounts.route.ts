import { Router } from 'express';
import { accountsController } from '../controllers/accounts.controller';
import asyncHandler from 'express-async-handler';

const router = Router();
router.get('/', asyncHandler(accountsController.getAccounts));

export default router;
