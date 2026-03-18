/**
 * Persistent Win Banner Fix — Preservation Property Tests
 *
 * These tests capture EXISTING correct behavior of AnnouncementBanner that
 * must be preserved after the bug fix. They should PASS on unfixed code.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { AnnouncementBanner } from './AnnouncementBanner';

// --- Generators ---

const arbMessage = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
const arbSubtitle = fc.option(
  fc.string({ minLength: 1, maxLength: 80 }).filter(s => s.trim().length > 0),
  { nil: undefined }
);
const arbTransientType = fc.constantFrom('turn' as const, 'phase' as const);
const arbDuration = fc.integer({ min: 100, max: 5000 });

// =========================================================================
// Property 2a: Game-end banners display persistently
// Validates: Requirement 3.1
// =========================================================================
describe('Preservation: Game-end banner displays persistently', () => {
  let banner: AnnouncementBanner;

  beforeEach(() => {
    vi.useFakeTimers();
    banner = new AnnouncementBanner();
    banner.create();
  });

  afterEach(() => {
    banner.destroy();
    document.querySelectorAll('.announcement-banner').forEach(el => el.remove());
    vi.useRealTimers();
  });

  it('should display persistently with correct content for any message/subtitle', () => {
    fc.assert(
      fc.property(arbMessage, arbSubtitle, (message, subtitle) => {
        // Reset banner for each iteration
        banner.dismiss();

        banner.show({ message, subtitle, type: 'game-end', duration: 0 });

        const container = document.querySelector('.announcement-banner') as HTMLElement;

        // Banner is visible
        expect(container.style.display).toBe('');

        // Content matches
        const messageEl = container.querySelector('.announcement-message');
        expect(messageEl?.textContent).toBe(message);

        if (subtitle) {
          const subtitleEl = container.querySelector('.announcement-subtitle');
          expect(subtitleEl?.textContent).toBe(subtitle);
        }

        // Has game-end class
        expect(container.classList.contains('announcement-game-end')).toBe(true);

        // Pointer events are auto (clickable)
        expect(container.style.pointerEvents).toBe('auto');

        // Advancing time should NOT dismiss it
        vi.advanceTimersByTime(10000);
        expect(container.style.display).toBe('');
        expect(container.querySelector('.announcement-message')?.textContent).toBe(message);
      }),
      { numRuns: 100 }
    );
  });
});

// =========================================================================
// Property 2b: Turn/phase announcements auto-dismiss after duration
// Validates: Requirement 3.2
// =========================================================================
describe('Preservation: Turn/phase announcements auto-dismiss', () => {
  let banner: AnnouncementBanner;

  beforeEach(() => {
    vi.useFakeTimers();
    banner = new AnnouncementBanner();
    banner.create();
  });

  afterEach(() => {
    banner.destroy();
    document.querySelectorAll('.announcement-banner').forEach(el => el.remove());
    vi.useRealTimers();
  });

  it('should auto-dismiss after the specified duration for turn/phase types', () => {
    fc.assert(
      fc.property(arbMessage, arbTransientType, arbDuration, (message, type, duration) => {
        // Reset banner for each iteration
        banner.dismiss();

        banner.show({ message, type, duration });

        const container = document.querySelector('.announcement-banner') as HTMLElement;

        // Banner is visible initially
        expect(container.style.display).toBe('');
        expect(container.querySelector('.announcement-message')?.textContent).toBe(message);

        // Pointer events are none (non-blocking)
        expect(container.style.pointerEvents).toBe('none');

        // Just before duration: still visible
        vi.advanceTimersByTime(duration - 1);
        expect(container.style.display).toBe('');

        // At duration: dismissed
        vi.advanceTimersByTime(1);
        expect(container.style.display).toBe('none');
        expect(container.innerHTML).toBe('');
      }),
      { numRuns: 100 }
    );
  });
});

// =========================================================================
// Property 2c: show() dismisses previous announcement before showing new one
// Validates: Requirement 3.3
// =========================================================================
describe('Preservation: show() replaces previous announcement', () => {
  let banner: AnnouncementBanner;

  beforeEach(() => {
    vi.useFakeTimers();
    banner = new AnnouncementBanner();
    banner.create();
  });

  afterEach(() => {
    banner.destroy();
    document.querySelectorAll('.announcement-banner').forEach(el => el.remove());
    vi.useRealTimers();
  });

  it('should show only the new announcement content after calling show() twice', () => {
    fc.assert(
      fc.property(
        arbMessage,
        arbMessage,
        arbTransientType,
        arbTransientType,
        (messageA, messageB, typeA, typeB) => {
          // Reset
          banner.dismiss();

          // Show first announcement
          banner.show({ message: messageA, type: typeA, duration: 2000 });

          const container = document.querySelector('.announcement-banner') as HTMLElement;
          expect(container.querySelector('.announcement-message')?.textContent).toBe(messageA);

          // Show second announcement (should replace first)
          banner.show({ message: messageB, type: typeB, duration: 2000 });

          // Only second announcement's content is visible
          expect(container.style.display).toBe('');
          expect(container.querySelector('.announcement-message')?.textContent).toBe(messageB);
          expect(container.classList.contains(`announcement-${typeB}`)).toBe(true);

          // First announcement's type class should be gone (unless same type)
          if (typeA !== typeB) {
            expect(container.classList.contains(`announcement-${typeA}`)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =========================================================================
// Property 2d: dismiss() is safe to call when no banner is visible (no-op)
// Validates: Requirement 3.4
// =========================================================================
describe('Preservation: dismiss() is a safe no-op when no banner is visible', () => {
  let banner: AnnouncementBanner;

  beforeEach(() => {
    banner = new AnnouncementBanner();
    banner.create();
  });

  afterEach(() => {
    banner.destroy();
    document.querySelectorAll('.announcement-banner').forEach(el => el.remove());
  });

  it('should not throw and container should remain hidden when dismiss() is called with no visible banner', () => {
    const container = document.querySelector('.announcement-banner') as HTMLElement;

    // Container starts hidden
    expect(container.style.display).toBe('none');

    // Calling dismiss() multiple times should be safe
    expect(() => banner.dismiss()).not.toThrow();
    expect(() => banner.dismiss()).not.toThrow();
    expect(() => banner.dismiss()).not.toThrow();

    // Container is still hidden
    expect(container.style.display).toBe('none');
  });

  it('should not throw when dismiss() is called before create()', () => {
    const freshBanner = new AnnouncementBanner();
    expect(() => freshBanner.dismiss()).not.toThrow();
    expect(() => freshBanner.dismiss()).not.toThrow();
  });
});
