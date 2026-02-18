import log from 'loglevel';

/**
 * Centralized logging utility for the Nine Men's Morris game.
 *
 * This logger provides different log levels that can be controlled:
 * - TRACE: Very detailed debugging information
 * - DEBUG: Debugging information (game state, moves, etc.)
 * - INFO: General informational messages
 * - WARN: Warning messages
 * - ERROR: Error messages
 * - SILENT: No logging
 *
 * Usage:
 * ```typescript
 * import { logger } from './utils/logger';
 *
 * logger.debug('Position clicked:', position);
 * logger.info('Game started');
 * logger.warn('Invalid move attempted');
 * logger.error('Failed to fetch AI move:', error);
 * ```
 *
 * Configuration:
 * - Development: Set to DEBUG level (shows debug, info, warn, error)
 * - Production: Set to WARN level (shows only warn and error)
 * - Can be changed at runtime: logger.setLevel('info')
 */

// Configure log level based on environment
const isDevelopment = import.meta.env.MODE === 'development';

// Set default log level
if (isDevelopment) {
  log.setLevel('debug'); // Show debug and above in development
} else {
  log.setLevel('warn'); // Show only warnings and errors in production
}

// Create a custom logger with prefix for better identification
const logger = {
  trace: (message: string, ...args: unknown[]): void => {
    log.trace(`[Game] ${message}`, ...args);
  },

  debug: (message: string, ...args: unknown[]): void => {
    log.debug(`[Game] ${message}`, ...args);
  },

  info: (message: string, ...args: unknown[]): void => {
    log.info(`[Game] ${message}`, ...args);
  },

  warn: (message: string, ...args: unknown[]): void => {
    log.warn(`[Game] ${message}`, ...args);
  },

  error: (message: string, ...args: unknown[]): void => {
    log.error(`[Game] ${message}`, ...args);
  },

  setLevel: (level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'): void => {
    log.setLevel(level);
  },

  getLevel: (): number => {
    return log.getLevel();
  },
};

export { logger };
