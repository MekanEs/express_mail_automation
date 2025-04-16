import express from 'express';
import path from 'path';
import mainRouter from './routes';

const app = express();

const staticPath = path.resolve(__dirname, '../public');
app.use(express.static(staticPath));

app.use(mainRouter);

app.get('*', (_, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

export default app;
