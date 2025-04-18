import { Router } from 'express';
import { checkAccountsController } from '../../controllers/checkAccountsController';

const router = Router();
router.post('/', checkAccountsController.checkAccounts);

export default router;
