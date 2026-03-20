import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalStorage } from './LocalStorage.js';

describe('Theme preference persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should default to dark when no preference is saved', () => {
    expect(LocalStorage.loadThemePreference()).toBe('dark');
  });

  it('should save and load dark theme', () => {
    LocalStorage.saveThemePreference('dark');
    expect(LocalStorage.loadThemePreference()).toBe('dark');
  });

  it('should save and load light theme', () => {
    LocalStorage.saveThemePreference('light');
    expect(LocalStorage.loadThemePreference()).toBe('light');
  });

  it('should overwrite previous preference', () => {
    LocalStorage.saveThemePreference('light');
    LocalStorage.saveThemePreference('dark');
    expect(LocalStorage.loadThemePreference()).toBe('dark');
  });

  it('should default to dark for invalid stored value', () => {
    window.localStorage.setItem('ninemensmorris_theme', 'neon');
    expect(LocalStorage.loadThemePreference()).toBe('dark');
  });
});
