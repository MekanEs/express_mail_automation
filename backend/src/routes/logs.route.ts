import { Router } from 'express';
import { logsController } from '../controllers/logs.controller';

const router = Router();

router.get('/stream', logsController.streamLogs);

export default router;
