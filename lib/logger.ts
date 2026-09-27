// Simple structured logger for production
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const logger = {
  log: (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };
    
    // In production, we write structured JSON to stdout so log aggregators can parse it
    if (process.env.NODE_ENV === 'production') {
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](JSON.stringify(entry));
    } else {
      // In development, pretty print
      const prefix = `[${level.toUpperCase()}]`;
      const metaString = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        `${prefix} ${message}`,
        metaString
      );
    }
  },
  
  info: (message: string, meta?: Record<string, unknown>) => logger.log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => logger.log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => logger.log('error', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => logger.log('debug', message, meta),
};
