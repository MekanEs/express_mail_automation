import { Router } from 'express';
import { fromEmailsController } from '../controllers/from-emails.controller';
import asyncHandler from 'express-async-handler';

const router = Router();
router.get('/', asyncHandler(fromEmailsController.getEmails));
router.post('/', asyncHandler(fromEmailsController.postEmails));
router.delete('/', asyncHandler(fromEmailsController.deleteEmails));
export default router;
