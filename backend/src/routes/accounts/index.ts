import { Router } from 'express';
import { accountsController } from '../../controllers/accounts.controller';

const router = Router();
router.get('/', accountsController.getAccounts);

export default router;
