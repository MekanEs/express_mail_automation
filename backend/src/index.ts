import app from './app';
import appConfig from './configs/appConfig';
appConfig();
const port = process.env.PORT || 3002;

app.listen(port, () => console.log(`Running on port ${port}`));
