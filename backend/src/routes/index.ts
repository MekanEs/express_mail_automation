import { Router } from 'express';
import fromEmails from './fromEmails';
import process from './process';
import accounts from './accounts';
import checkAccounts from './checkAccounts';

const mainRouter = Router();

mainRouter.use('/api/fromEmails', fromEmails);
mainRouter.use('/api/process', process);
mainRouter.use('/api/accounts', accounts);
mainRouter.use('/api/checkAccounts', checkAccounts);

mainRouter.use('/api', (request, response) => {
  response.json({ message: 'IMAP Processor API is running' });
  //response.send('Hello world!');
});
export default mainRouter;
