import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import asyncHandler from 'express-async-handler';

const router = Router();

router.get('/', asyncHandler(dashboardController.getDashboardMetrics));

export default router; 