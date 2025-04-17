import express from 'express';
import path from 'path';
import mainRouter from './routes';
import cors from 'cors';
const app = express();

const staticPath = path.resolve(__dirname, '../public');
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true // если используешь куки
  })
);
app.use(express.static(staticPath));
app.use(express.json());
app.use(mainRouter);

app.get('*', (_, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

export default app;
