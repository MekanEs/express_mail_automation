import { Router } from 'express';
import { checkAccountsController } from '../controllers/check-accounts.controller';
import asyncHandler from 'express-async-handler';

const router = Router();
router.post('/', asyncHandler(checkAccountsController.checkAccounts));

export default router;
