import { EventEmitter } from 'events';

// Создаем экземпляр EventEmitter
const loggerEvents = new EventEmitter();

interface LogPayload {
    level: 'info' | 'warn' | 'error' | 'debug';
    message: unknown[];
    timestamp: string;
    sendToFrontend?: boolean;
}

export class CustomLogger {
    constructor() {
        // возможно, сюда позже добавишь настройки уровня логирования
    }

    private emitLog(level: LogPayload['level'], sendToFrontend: boolean, ...message: unknown[]): void {
        const payload: LogPayload = {
            level,
            message,
            timestamp: new Date().toISOString(),
            sendToFrontend,
        };

        // Отправляем или эмитируем только если уровень не 'debug'
        // и если указано, что нужно отправлять на фронтенд
        if (payload.level !== 'debug' && payload.sendToFrontend) {
            if (process.env.IS_WORKER === 'true') {
                this.sendLogToApi(payload);
            } else {
                // Иначе (в API-процессе) эмитируем локально для SSE
                loggerEvents.emit('log', payload);
            }
        }

        // Оставляем вывод в консоль для всех уровней, включая debug,
        // если это необходимо для локальной отладки на бэкенде.
        // Если debug логи не нужны даже в консоли бэкенда,
        // можно перенести console.log внутрь условия if (payload.level !== 'debug')
        // или изменить методы debug(), info() и т.д.
        if (level === 'debug' && process.env.NODE_ENV !== 'development') {
            // В продакшене не выводим debug логи даже в консоль бэкенда,
            // чтобы не засорять ее. В development оставляем.
        } else {
            console.log(`[${level.toUpperCase()}]`, ...message); // Добавил уровень в консольный вывод для ясности
        }
    }

    public info(...message: unknown[]): void {
        // console.log('INFO', ...message); // Этот console.log дублируется в emitLog
        const lastArg = message[message.length - 1];
        let sendToFrontend = false;
        let msgArgs = message;

        if (typeof lastArg === 'boolean') {
            sendToFrontend = lastArg;
            msgArgs = message.slice(0, -1);
        }
        this.emitLog('info', sendToFrontend, ...msgArgs);
    }

    public warn(...message: unknown[]): void {
        const lastArg = message[message.length - 1];
        let sendToFrontend = false;
        let msgArgs = message;

        if (typeof lastArg === 'boolean') {
            sendToFrontend = lastArg;
            msgArgs = message.slice(0, -1);
        }
        this.emitLog('warn', sendToFrontend, ...msgArgs);
    }

    public error(...message: unknown[]): void {
        const lastArg = message[message.length - 1];
        let sendToFrontend = false;
        let msgArgs = message;

        if (typeof lastArg === 'boolean') {
            sendToFrontend = lastArg;
            msgArgs = message.slice(0, -1);
        }
        this.emitLog('error', sendToFrontend, ...msgArgs);
    }

    public debug(...message: unknown[]): void {
        const lastArg = message[message.length - 1];
        let sendToFrontend = false;
        let msgArgs = message;

        if (typeof lastArg === 'boolean') {
            sendToFrontend = lastArg;
            msgArgs = message.slice(0, -1);
        }
        this.emitLog('debug', sendToFrontend, ...msgArgs);
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
