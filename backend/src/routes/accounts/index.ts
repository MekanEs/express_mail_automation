import { Router } from 'express';
import { accountsController } from '../../controllers/accountsController';

const router = Router();
router.get('/', accountsController.getAccounts);

export default router;
