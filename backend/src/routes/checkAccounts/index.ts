import { Router } from 'express';
import { checkAccountsController } from '../../controllers/check-accounts.controller';

const router = Router();
router.post('/', checkAccountsController.checkAccounts);

export default router;
