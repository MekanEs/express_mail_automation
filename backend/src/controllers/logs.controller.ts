import { Request, Response } from 'express';
import { loggerEvents, LogPayload } from '../utils/logger'; // Импортируем наш EventEmitter
import { logger } from '../utils/logger'; // Для логирования самого контроллера

// Массив для хранения активных клиентов (их response объектов)
const clients: Response[] = [];

class LogsController {
  public streamLogs(req: Request, res: Response): void {
    // Устанавливаем необходимые заголовки для SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Отправляем заголовки немедленно

    logger.info('[LogsController] New client connected for log streaming.');
    clients.push(res); // Добавляем нового клиента

    // Отправляем приветственное сообщение или последние N логов (опционально)
    res.write(`data: ${JSON.stringify({ level: 'info', message: ['Connected to log stream.'], timestamp: new Date().toISOString() })}\n\n`);


    // Обработчик для новых логов
    const logListener = (payload: LogPayload) => {
      // SSE требует формат "data: <json_string>\n\n"
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    loggerEvents.on('log', logListener);

    // При закрытии соединения клиентом
    req.on('close', () => {
      logger.info('[LogsController] Client disconnected from log stream.');
      loggerEvents.off('log', logListener); // Удаляем слушателя для этого клиента
      const index = clients.indexOf(res);
      if (index !== -1) {
        clients.splice(index, 1); // Удаляем клиента из списка
      }
      res.end();
    });

    // Периодически отправляем "комментарий" для поддержания соединения
    // Некоторые прокси могут закрывать неактивные соединения
    const keepAliveInterval = setInterval(() => {
      if (res.writable) { // Проверяем, можно ли еще писать в поток
        res.write(':keep-alive\n\n');
      } else {
        clearInterval(keepAliveInterval); // Если писать нельзя, соединение закрыто
      }
    }, 20000); // Каждые 20 секунд

    // Очищаем интервал при закрытии соединения
    res.on('close', () => {
      clearInterval(keepAliveInterval);
    });
  }
}

export const logsController = new LogsController();
