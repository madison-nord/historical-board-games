import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SoundManager, SoundEffect } from './SoundManager';

// Minimal AudioContext mock
function createMockAudioContext() {
  const gainNode = {
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
  const oscNode = {
    type: 'sine' as OscillatorType,
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  return {
    state: 'running' as AudioContextState,
    currentTime: 0,
    destination: {},
    createOscillator: vi.fn(() => oscNode),
    createGain: vi.fn(() => gainNode),
    resume: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    _oscNode: oscNode,
    _gainNode: gainNode,
  };
}

describe('SoundManager', () => {
  let mockCtx: ReturnType<typeof createMockAudioContext>;

  beforeEach(() => {
    // Clear localStorage
    window.localStorage.clear();

    // Mock AudioContext
    mockCtx = createMockAudioContext();
    vi.stubGlobal(
      'AudioContext',
      vi.fn(() => mockCtx)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts unmuted by default', () => {
    const sm = new SoundManager();
    expect(sm.muted).toBe(false);
  });

  it('loads muted state from localStorage', () => {
    window.localStorage.setItem('ninemensmorris_sound_muted', 'true');
    const sm = new SoundManager();
    expect(sm.muted).toBe(true);
  });

  it('toggleMute toggles and persists', () => {
    const sm = new SoundManager();
    expect(sm.muted).toBe(false);

    const result = sm.toggleMute();
    expect(result).toBe(true);
    expect(sm.muted).toBe(true);
    expect(window.localStorage.getItem('ninemensmorris_sound_muted')).toBe('true');

    const result2 = sm.toggleMute();
    expect(result2).toBe(false);
    expect(sm.muted).toBe(false);
    expect(window.localStorage.getItem('ninemensmorris_sound_muted')).toBe('false');
  });

  it('setMuted sets and persists', () => {
    const sm = new SoundManager();
    sm.setMuted(true);
    expect(sm.muted).toBe(true);
    expect(window.localStorage.getItem('ninemensmorris_sound_muted')).toBe('true');
  });

  it('play does nothing when muted', () => {
    const sm = new SoundManager();
    sm.setMuted(true);
    sm.play(SoundEffect.PLACE);
    // AudioContext should never be created
    expect(mockCtx.createOscillator).not.toHaveBeenCalled();
  });

  it('play creates oscillator for PLACE sound', () => {
    const sm = new SoundManager();
    sm.play(SoundEffect.PLACE);
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();
    expect(mockCtx._oscNode.start).toHaveBeenCalled();
    expect(mockCtx._oscNode.stop).toHaveBeenCalled();
  });

  it('play creates oscillator for MOVE sound', () => {
    const sm = new SoundManager();
    sm.play(SoundEffect.MOVE);
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx._oscNode.start).toHaveBeenCalled();
  });

  it('play creates oscillators for MILL sound (three notes)', () => {
    const sm = new SoundManager();
    sm.play(SoundEffect.MILL);
    // Mill plays three ascending notes (C5, E5, G5)
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(3);
  });

  it('play creates oscillator for REMOVE sound', () => {
    const sm = new SoundManager();
    sm.play(SoundEffect.REMOVE);
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
  });

  it('play creates oscillators for GAME_END sound (four notes)', () => {
    const sm = new SoundManager();
    sm.play(SoundEffect.GAME_END);
    // Game end plays four notes
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4);
  });

  it('resumes suspended AudioContext', () => {
    mockCtx.state = 'suspended' as AudioContextState;
    const sm = new SoundManager();
    sm.play(SoundEffect.PLACE);
    expect(mockCtx.resume).toHaveBeenCalled();
  });

  it('handles AudioContext creation failure gracefully', () => {
    vi.stubGlobal(
      'AudioContext',
      vi.fn(() => {
        throw new Error('Not supported');
      })
    );
    const sm = new SoundManager();
    // Should not throw
    expect(() => sm.play(SoundEffect.PLACE)).not.toThrow();
  });

  it('dispose closes AudioContext', () => {
    const sm = new SoundManager();
    sm.play(SoundEffect.PLACE); // Force context creation
    sm.dispose();
    expect(mockCtx.close).toHaveBeenCalled();
  });

  it('dispose is safe to call without context', () => {
    const sm = new SoundManager();
    expect(() => sm.dispose()).not.toThrow();
  });

  it('handles localStorage unavailable gracefully', () => {
    // Mock localStorage to throw
    const originalGetItem = window.localStorage.getItem;
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    const sm = new SoundManager();
    expect(sm.muted).toBe(false); // Falls back to false

    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    // Should not throw
    expect(() => sm.toggleMute()).not.toThrow();

    window.localStorage.getItem = originalGetItem;
  });
});
