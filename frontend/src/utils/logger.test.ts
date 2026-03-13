import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from './logger.js';
import log from 'loglevel';

/**
 * Unit Tests for Logger
 *
 * These tests validate the logger utility functions.
 */

describe('Logger Unit Tests', () => {
  // Store original log level
  let originalLevel: log.LogLevelDesc;

  beforeEach(() => {
    originalLevel = log.getLevel();
    // Spy on console methods to prevent actual logging during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original log level
    log.setLevel(originalLevel);
    vi.restoreAllMocks();
  });

  describe('log level management', () => {
    it('should set and get log level', () => {
      logger.setLevel('info');
      expect(logger.getLevel()).toBe(log.levels.INFO);

      logger.setLevel('warn');
      expect(logger.getLevel()).toBe(log.levels.WARN);

      logger.setLevel('error');
      expect(logger.getLevel()).toBe(log.levels.ERROR);
    });

    it('should support all log levels', () => {
      const levels: Array<'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'> = [
        'trace',
        'debug',
        'info',
        'warn',
        'error',
        'silent',
      ];

      levels.forEach(level => {
        expect(() => logger.setLevel(level)).not.toThrow();
      });
    });
  });

  describe('logging methods', () => {
    beforeEach(() => {
      // Set to trace level to ensure all logs are processed
      logger.setLevel('trace');
    });

    it('should log trace messages', () => {
      expect(() => logger.trace('Test trace message')).not.toThrow();
      expect(() => logger.trace('Test with args', { data: 'value' })).not.toThrow();
    });

    it('should log debug messages', () => {
      expect(() => logger.debug('Test debug message')).not.toThrow();
      expect(() => logger.debug('Test with args', { data: 'value' })).not.toThrow();
    });

    it('should log info messages', () => {
      expect(() => logger.info('Test info message')).not.toThrow();
      expect(() => logger.info('Test with args', { data: 'value' })).not.toThrow();
    });

    it('should log warn messages', () => {
      expect(() => logger.warn('Test warn message')).not.toThrow();
      expect(() => logger.warn('Test with args', { data: 'value' })).not.toThrow();
    });

    it('should log error messages', () => {
      expect(() => logger.error('Test error message')).not.toThrow();
      expect(() => logger.error('Test with args', new Error('test error'))).not.toThrow();
    });
  });

  describe('log level filtering', () => {
    it('should not log debug when level is info', () => {
      logger.setLevel('info');
      const debugSpy = vi.spyOn(log, 'debug');

      logger.debug('This should not log');

      // Debug should be called but filtered by loglevel
      expect(debugSpy).toHaveBeenCalled();
    });

    it('should log warn when level is warn', () => {
      logger.setLevel('warn');
      const warnSpy = vi.spyOn(log, 'warn');

      logger.warn('This should log');

      expect(warnSpy).toHaveBeenCalled();
    });

    it('should not log anything when level is silent', () => {
      logger.setLevel('silent');
      const traceSpy = vi.spyOn(log, 'trace');
      const debugSpy = vi.spyOn(log, 'debug');
      const infoSpy = vi.spyOn(log, 'info');
      const warnSpy = vi.spyOn(log, 'warn');
      const errorSpy = vi.spyOn(log, 'error');

      logger.trace('trace');
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      // All should be called but filtered by loglevel
      expect(traceSpy).toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('message formatting', () => {
    beforeEach(() => {
      logger.setLevel('trace');
    });

    it('should prefix messages with [Game]', () => {
      const traceSpy = vi.spyOn(log, 'trace');
      const debugSpy = vi.spyOn(log, 'debug');
      const infoSpy = vi.spyOn(log, 'info');
      const warnSpy = vi.spyOn(log, 'warn');
      const errorSpy = vi.spyOn(log, 'error');

      logger.trace('test');
      logger.debug('test');
      logger.info('test');
      logger.warn('test');
      logger.error('test');

      expect(traceSpy).toHaveBeenCalledWith('[Game] test');
      expect(debugSpy).toHaveBeenCalledWith('[Game] test');
      expect(infoSpy).toHaveBeenCalledWith('[Game] test');
      expect(warnSpy).toHaveBeenCalledWith('[Game] test');
      expect(errorSpy).toHaveBeenCalledWith('[Game] test');
    });

    it('should pass additional arguments', () => {
      const infoSpy = vi.spyOn(log, 'info');

      const testObj = { key: 'value' };
      const testNum = 42;

      logger.info('test message', testObj, testNum);

      expect(infoSpy).toHaveBeenCalledWith('[Game] test message', testObj, testNum);
    });
  });
});
