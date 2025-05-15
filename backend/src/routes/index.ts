import { Router } from 'express';
import fromEmails from './from-emails.route';
import process from './process.route';
import accounts from './accounts.route';
import checkAccounts from './check-accounts.route';
import reports from './reports.route';
import dashboardRoutes from './dashboard.route';
import senderAggregate from './senderAggregate';
import senderAggregateArchive from './senderAggregateArchive';
import logsRoute from './logs.route';
import adminRoutes from './admin.route';

const mainRouter = Router();

mainRouter.use('/api/fromEmails', fromEmails);
mainRouter.use('/api/process', process);
mainRouter.use('/api/accounts', accounts);
mainRouter.use('/api/checkAccounts', checkAccounts);
mainRouter.use('/api/reports', reports);
mainRouter.use('/api/reports/sender-aggregates', senderAggregate);
mainRouter.use('/api/reports/sender-aggregates-archive', senderAggregateArchive);
mainRouter.use('/api/dashboard', dashboardRoutes);
mainRouter.use('/api/logs', logsRoute);
mainRouter.use('/api/admin', adminRoutes);
mainRouter.use('/api', (request, response) => {
  response.json({ message: 'IMAP Processor API is running' });
  //response.send('Hello world!');
});
export default mainRouter;
