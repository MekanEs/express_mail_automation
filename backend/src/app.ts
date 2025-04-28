import express, { Request, Response, } from 'express';
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

// Все основные API маршруты
app.use(mainRouter);

// Обработка запросов к статике (если не найдено API)
app.get('*', (_, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.use((req: Request, res: Response,) => {
  res.status(404).send()
});




export default app;
