import { Router } from 'express';
import fromEmails from './fromEmails';

const mainRouter = Router();

mainRouter.use('/api/fromEmails', fromEmails);

mainRouter.use('/api', (request, response) => {
  response.json({ message: 'IMAP Processor API is running' });
  //response.send('Hello world!');
});
export default mainRouter;
