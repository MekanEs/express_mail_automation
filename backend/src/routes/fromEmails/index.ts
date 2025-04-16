import { Router } from 'express';

const router = Router();
router.get('/', (request, response) => {
  response.json({ email: ['first', 'second'] });
});
export default router;
