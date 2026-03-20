import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnnouncementBanner } from './AnnouncementBanner';
import type { AnnouncementOptions } from './AnnouncementBanner';

describe('AnnouncementBanner', () => {
  let banner: AnnouncementBanner;

  beforeEach(() => {
    vi.useFakeTimers();
    banner = new AnnouncementBanner();
  });

  afterEach(() => {
    banner.destroy();
    document.querySelectorAll('.announcement-banner').forEach(el => el.remove());
    vi.useRealTimers();
  });

  describe('create()', () => {
    it('should create correct DOM structure', () => {
      banner.create();

      const container = document.querySelector('.announcement-banner');
      expect(container).not.toBeNull();
      expect(container?.id).toBe('announcement-banner');
      expect((container as HTMLElement).style.display).toBe('none');
    });

    it('should append to announcement-container when it exists', () => {
      const target = document.createElement('div');
      target.id = 'announcement-container';
      document.body.appendChild(target);

      banner.create();

      expect(target.querySelector('.announcement-banner')).not.toBeNull();
      target.remove();
    });

    it('should append to document body when no announcement-container exists', () => {
      banner.create();

      const container = document.body.querySelector('.announcement-banner');
      expect(container).not.toBeNull();
    });
  });

  describe('turn announcement auto-dismiss', () => {
    it('should auto-dismiss after the specified duration', () => {
      banner.create();

      banner.show({ message: 'Your Turn', type: 'turn', duration: 2000 });

      const container = document.querySelector('.announcement-banner') as HTMLElement;
      expect(container.style.display).toBe('');

      vi.advanceTimersByTime(2000);

      expect(container.style.display).toBe('none');
      expect(container.innerHTML).toBe('');
    });

    it('should auto-dismiss after default 2000ms when no duration specified', () => {
      banner.create();

      banner.show({ message: 'Your Turn', type: 'turn' });

      const container = document.querySelector('.announcement-banner') as HTMLElement;
      expect(container.style.display).toBe('');

      vi.advanceTimersByTime(1999);
      expect(container.style.display).toBe('');

      vi.advanceTimersByTime(1);
      expect(container.style.display).toBe('none');
    });
  });

  describe('phase transition announcement', () => {
    it('should display correct message and subtitle for phase transition', () => {
      banner.create();

      banner.show({
        message: 'Movement Phase',
        subtitle: 'Move pieces to adjacent positions',
        type: 'phase',
      });

      const container = document.querySelector('.announcement-banner') as HTMLElement;
      const messageEl = container.querySelector('.announcement-message');
      const subtitleEl = container.querySelector('.announcement-subtitle');

      expect(messageEl?.textContent).toBe('Movement Phase');
      expect(subtitleEl?.textContent).toBe('Move pieces to adjacent positions');
      expect(container.classList.contains('announcement-phase')).toBe(true);
    });

    it('should display Flying Phase message and subtitle', () => {
      banner.create();

      banner.show({
        message: 'Flying Phase',
        subtitle: 'You can move to any empty position',
        type: 'phase',
      });

      const container = document.querySelector('.announcement-banner') as HTMLElement;
      const messageEl = container.querySelector('.announcement-message');
      const subtitleEl = container.querySelector('.announcement-subtitle');

      expect(messageEl?.textContent).toBe('Flying Phase');
      expect(subtitleEl?.textContent).toBe('You can move to any empty position');
    });
  });

  describe('game-end announcement persistence', () => {
    it('should persist and not auto-dismiss when duration is 0', () => {
      banner.create();

      banner.show({
        message: 'You Won!',
        subtitle: 'Opponent has fewer than 3 pieces',
        type: 'game-end',
        duration: 0,
      });

      const container = document.querySelector('.announcement-banner') as HTMLElement;
      expect(container.style.display).toBe('');

      // Advance time well beyond normal dismiss duration
      vi.advanceTimersByTime(10000);

      expect(container.style.display).toBe('');
      expect(container.querySelector('.announcement-message')?.textContent).toBe('You Won!');
    });

    it('should persist with default duration for game-end type', () => {
      banner.create();

      banner.show({
        message: 'White Wins!',
        subtitle: 'Black has no legal moves',
        type: 'game-end',
      });

      const container = document.querySelector('.announcement-banner') as HTMLElement;

      vi.advanceTimersByTime(10000);

      expect(container.style.display).toBe('');
    });
  });

  describe('pointer-events behavior', () => {
    it('should use pointer-events: auto for game-end announcements', () => {
      banner.create();

      banner.show({ message: 'You Won!', type: 'game-end', duration: 0 });

      const container = document.querySelector('.announcement-banner') as HTMLElement;
      expect(container.style.pointerEvents).toBe('auto');
    });

    it('should use pointer-events: none for turn announcements', () => {
      banner.create();

      banner.show({ message: 'Your Turn', type: 'turn' });

      const container = document.querySelector('.announcement-banner') as HTMLElement;
      expect(container.style.pointerEvents).toBe('none');
    });

    it('should use pointer-events: none for phase announcements', () => {
      banner.create();

      banner.show({ message: 'Movement Phase', type: 'phase' });

      const container = document.querySelector('.announcement-banner') as HTMLElement;
      expect(container.style.pointerEvents).toBe('none');
    });
  });

  describe('show() replaces existing announcement', () => {
    it('should replace existing announcement when show() is called again', () => {
      banner.create();

      banner.show({ message: 'First Message', type: 'turn' });

      const container = document.querySelector('.announcement-banner') as HTMLElement;
      expect(container.querySelector('.announcement-message')?.textContent).toBe('First Message');

      banner.show({ message: 'Second Message', type: 'phase' });

      expect(container.querySelector('.announcement-message')?.textContent).toBe('Second Message');
      expect(container.classList.contains('announcement-phase')).toBe(true);
      expect(container.classList.contains('announcement-turn')).toBe(false);
    });

    it('should clear previous auto-dismiss timer when replacing', () => {
      banner.create();

      banner.show({ message: 'First', type: 'turn', duration: 2000 });
      banner.show({ message: 'Second', type: 'turn', duration: 2000 });

      const container = document.querySelector('.announcement-banner') as HTMLElement;

      // Advance past the first timer's original expiry
      vi.advanceTimersByTime(2000);

      // The second announcement should now be dismissed (its own 2000ms elapsed)
      expect(container.style.display).toBe('none');
    });
  });

  describe('show() before create()', () => {
    it('should not throw when show() is called before create()', () => {
      expect(() => {
        banner.show({ message: 'Test', type: 'turn' });
      }).not.toThrow();
    });
  });

  describe('dismiss() when no announcement is visible', () => {
    it('should be a no-op when dismiss() is called with no visible announcement', () => {
      banner.create();

      expect(() => banner.dismiss()).not.toThrow();

      const container = document.querySelector('.announcement-banner') as HTMLElement;
      expect(container.style.display).toBe('none');
    });

    it('should be a no-op when dismiss() is called before create()', () => {
      expect(() => banner.dismiss()).not.toThrow();
    });
  });

  describe('subtitle handling', () => {
    it('should not create subtitle element when subtitle is not provided', () => {
      banner.create();

      banner.show({ message: 'No Subtitle', type: 'turn' });

      const container = document.querySelector('.announcement-banner') as HTMLElement;
      expect(container.querySelector('.announcement-subtitle')).toBeNull();
    });
  });
});
