import app from './app';
import appConfig from './configs/appConfig';
import { logger } from './utils/logger';
appConfig();
const port = process.env.PORT || 3002;

app.listen(port, () => logger.info(`Running on port ${port}`));
