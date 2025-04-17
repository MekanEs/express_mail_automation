import { Router } from 'express';
import { fromEmailsController } from '../../controllers/fromEmailsController';

const router = Router();
router.get('/', fromEmailsController.getEmails);
router.post('/', fromEmailsController.postEmails);
router.delete('/', fromEmailsController.deleteEmails);
export default router;
