import { Router } from 'express';
import { reportsController } from '../../controllers/reports.controller';

const router = Router();
// Use the method from the instance
router.get('/', reportsController.getReports);

export default router;
