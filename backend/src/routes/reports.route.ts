import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller';
import asyncHandler from 'express-async-handler';

const router = Router();
// Use the method from the instance
router.get('/', asyncHandler(reportsController.getReports));
router.delete('/delete', asyncHandler(reportsController.deleteReports));
router.delete('/delete-empty', asyncHandler(reportsController.deleteEmptyReports));
// Маршрут для экспорта отчетов

export default router;
