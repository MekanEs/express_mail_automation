import { EventEmitter } from 'events';

// Создаем экземпляр EventEmitter
const loggerEvents = new EventEmitter();

interface LogPayload {
    level: 'info' | 'warn' | 'error' | 'debug';
    message: unknown[];
    timestamp: string;
}

class Logger {
    constructor() {
        // возможно, сюда позже добавишь настройки уровня логирования
    }

    private emitLog(level: LogPayload['level'], ...message: unknown[]): void {
        const payload: LogPayload = {
            level,
            message,
            timestamp: new Date().toISOString(),
        };
        loggerEvents.emit('log', payload); // Генерируем событие 'log'
        console.log(...message); // Оставляем вывод в консоль
    }

    public info(...message: unknown[]): void {
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
}

export const logger = new Logger();
export { loggerEvents, LogPayload };
