/**
 * Enterprise-grade logging utility
 * Only logs in development mode, silent in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  context?: string;
}

const isDevelopment = import.meta.env.DEV;
const isDebugMode = import.meta.env.VITE_DEBUG === 'true';

const LOG_COLORS = {
  debug: '#9CA3AF',
  info: '#3B82F6',
  warn: '#F59E0B',
  error: '#EF4444',
} as const;

class Logger {
  private context: string;
  private static instance: Logger;

  constructor(context: string = 'App') {
    this.context = context;
  }

  static getInstance(context?: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(context);
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log errors
    if (!isDevelopment && !isDebugMode) {
      return level === 'error';
    }
    return true;
  }

  private formatMessage(level: LogLevel, message: string): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
    };
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const entry = this.formatMessage(level, message);
    const color = LOG_COLORS[level];
    const prefix = `%c[${entry.timestamp}] [${this.context}] [${level.toUpperCase()}]`;

    if (data !== undefined) {
      console[level === 'debug' ? 'log' : level](
        prefix,
        `color: ${color}; font-weight: bold`,
        message,
        data
      );
    } else {
      console[level === 'debug' ? 'log' : level](
        prefix,
        `color: ${color}; font-weight: bold`,
        message
      );
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  // Create a child logger with a specific context
  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`);
  }
}

// Factory function for creating loggers
export const createLogger = (context: string): Logger => {
  return new Logger(context);
};

// Default logger instance
export const logger = Logger.getInstance('App');

// Convenience exports
export const logDebug = (message: string, data?: unknown) => logger.debug(message, data);
export const logInfo = (message: string, data?: unknown) => logger.info(message, data);
export const logWarn = (message: string, data?: unknown) => logger.warn(message, data);
export const logError = (message: string, data?: unknown) => logger.error(message, data);

export default logger;
