import { Router } from 'express';
import { processController } from '../../controllers/processController';

const router = Router();
router.post('/', processController.processEmails);
export default router;
