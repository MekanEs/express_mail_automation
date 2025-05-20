// backend/src/utils/graphileWorkerLoggerAdapter.ts
import { LogScope } from 'graphile-worker/dist/logger';
import { CustomLogger as YourCustomLogger } from './logger'; // Ваш логгер


interface GraphileCompatibleLogger {
  log: (level: string, message: string, meta?: Record<string, unknown>) => void;
  scope: (additionalScope: LogScope) => GraphileCompatibleLogger;
  error: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  debug: (message: string, meta?: Record<string, unknown>) => void;
  // _scope теперь не нужно объявлять в интерфейсе, если он private в классе
  // и graphile-worker ожидает его как private
  _logFactory: (scope: LogScope) => GraphileCompatibleLogger;
}

export class GraphileWorkerLoggerAdapter implements GraphileCompatibleLogger { // Можно убрать implements, если GraphileCompatibleLogger мешает
  private customLogger: YourCustomLogger;
  // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
  private _scope: LogScope; // Объявляем _scope как private

  constructor(customLoggerInstance: YourCustomLogger, initialScope: LogScope = {}) {
    this.customLogger = customLoggerInstance;
    this.validateScope(initialScope);
    this._scope = initialScope;
  }

  private validateScope(scope: LogScope): void {
    if (scope === null || typeof scope !== 'object' || Array.isArray(scope)) {
      // console.warn('Graphile Worker scope should ideally be a non-null object. Received:', scope);
    }
  }

  public log(level: string, message: string, meta?: Record<string, unknown>): void {
    const fullMessage = meta ? `${message} | meta: ${JSON.stringify(meta)}` : message;
    const scopeParts: string[] = [];
    // Для доступа к private _scope внутри класса все в порядке
    for (const key in this._scope) {
      if (Object.prototype.hasOwnProperty.call(this._scope, key)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        scopeParts.push(`${key}=${JSON.stringify(this._scope[key])}`);
      }
    }
    const scopeString = scopeParts.length > 0 ? `[${scopeParts.join(' ')}] ` : '';
    const finalMessage = `${scopeString}${fullMessage}`;
    const sendToFrontend = true; // Все логи из Graphile Worker по умолчанию отправляем на фронтенд

    switch (level.toLowerCase()) {
      case 'info':
        this.customLogger.info(finalMessage, sendToFrontend);
        break;
      case 'warn':
      case 'warning':
        this.customLogger.warn(finalMessage, sendToFrontend);
        break;
      case 'error':
        this.customLogger.error(finalMessage, sendToFrontend);
        break;
      case 'debug':
        this.customLogger.debug(finalMessage, sendToFrontend);
        break;
      default:
        this.customLogger.info(`[${level.toUpperCase()}] ${finalMessage}`, sendToFrontend);
        break;
    }
  }

  public error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  public scope(additionalScope: LogScope): GraphileWorkerLoggerAdapter {
    const newScope = { ...this._scope, ...additionalScope };
    return new GraphileWorkerLoggerAdapter(this.customLogger, newScope);
  }

  public _logFactory = (newScope: LogScope): GraphileWorkerLoggerAdapter => {
    return this.scope(newScope);
  };
}
