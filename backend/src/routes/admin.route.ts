import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { adminController } from '../controllers/admin.controller';

const router = Router();

router.post(
  '/archive-sender-aggregates',
  asyncHandler(adminController.archiveSenderAggregates)
);

export default router;
