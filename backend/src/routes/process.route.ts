import { Router } from 'express';
import { processController } from '../controllers/process.controller';
import asyncHandler from 'express-async-handler';

const router = Router();

router.post('/', asyncHandler(processController.processEmails));

export default router;
