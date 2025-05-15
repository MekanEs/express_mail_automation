import { EventEmitter } from 'events';

// Создаем экземпляр EventEmitter
const loggerEvents = new EventEmitter();

interface LogPayload {
    level: 'info' | 'warn' | 'error' | 'debug';
    message: unknown[];
    timestamp: string;
}

export class CustomLogger {
    constructor() {
        // возможно, сюда позже добавишь настройки уровня логирования
    }

    private emitLog(level: LogPayload['level'], ...message: unknown[]): void {
        const payload: LogPayload = {
            level,
            message,
            timestamp: new Date().toISOString(),
        };
        if (process.env.IS_WORKER === 'true') {
            this.sendLogToApi(payload);
        } else {
            // Иначе (в API-процессе) эмитируем локально для SSE
            loggerEvents.emit('log', payload);
        }
        console.log(...message); // Оставляем вывод в консоль в обоих случаях
    }

    public info(...message: unknown[]): void {
        console.log('INFO', ...message);
        this.emitLog('info', ...message);
    }

    public warn(...message: unknown[]): void {
        this.emitLog('warn', ...message);
    }

    public error(...message: unknown[]): void {
        this.emitLog('error', ...message);
    }

    public debug(...message: unknown[]): void {
        this.emitLog('debug', ...message);
    }
    private async sendLogToApi(payload: LogPayload): Promise<void> {
        // Эта функция будет вызываться только в контексте Worker'а
        try {
            // ВАЖНО: Не ждите ответа слишком долго, чтобы не блокировать Worker
            // Можно сделать это "fire-and-forget" или с коротким таймаутом
            fetch(`http://localhost:${process.env.PORT}/api/logs/stream`, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' },
                // timeout: 1000, // Пример таймаута (зависит от клиента)
            }).catch(err => {
                // Логируем ошибку отправки, но не останавливаем Worker
                // Можно использовать console.error здесь, чтобы не вызвать рекурсию логгера
                console.error('[Worker Logger] Ошибка отправки лога на API:', err.message);
            });
        } catch (error) {
            console.error('[Worker Logger] Исключение при отправке лога на API:', error);
        }
    }
}

export const logger = new CustomLogger();
export { loggerEvents, LogPayload };
