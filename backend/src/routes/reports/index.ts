import { Router } from 'express';
import { reportsController } from '../../controllers/reportsController';

const router = Router();
// Use the method from the instance
router.get('/', reportsController.getReports);

export default router;
