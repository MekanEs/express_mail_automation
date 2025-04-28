class Logger {
    constructor() {
        // возможно, сюда позже добавишь настройки уровня логирования
    }

    public info(...message: unknown[]): void {
        console.log(...message);
    }

    public warn(...message: unknown[]): void {
        console.warn(...message);
    }

    public error(...message: unknown[]): void {
        console.error(...message);
    }

    public debug(...message: unknown[]): void {
        console.debug(...message);
    }
}

export const logger = new Logger();
