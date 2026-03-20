import { logger } from './logger.js';

/** localStorage key for mute preference */
const MUTE_STORAGE_KEY = 'ninemensmorris_sound_muted';

/**
 * Sound effect types available in the game
 */
export enum SoundEffect {
  PLACE = 'place',
  MOVE = 'move',
  MILL = 'mill',
  GAME_END = 'game_end',
  REMOVE = 'remove',
}

/**
 * SoundManager generates game sound effects using the Web Audio API.
 *
 * All sounds are synthesized programmatically — no external audio files needed.
 * Mute preference is persisted in localStorage.
 */
export class SoundManager {
  private audioContext: AudioContext | null = null;
  private _muted: boolean;

  constructor() {
    this._muted = SoundManager.loadMutePreference();
  }

  /**
   * Whether sound is currently muted
   */
  public get muted(): boolean {
    return this._muted;
  }

  /**
   * Toggle mute state and persist to localStorage
   */
  public toggleMute(): boolean {
    this._muted = !this._muted;
    SoundManager.saveMutePreference(this._muted);
    return this._muted;
  }

  /**
   * Set mute state explicitly
   */
  public setMuted(muted: boolean): void {
    this._muted = muted;
    SoundManager.saveMutePreference(this._muted);
  }

  /**
   * Play a sound effect. Lazily initializes AudioContext on first call.
   */
  public play(effect: SoundEffect): void {
    if (this._muted) {
      return;
    }

    try {
      const ctx = this.getAudioContext();
      if (!ctx) {
        return;
      }

      switch (effect) {
        case SoundEffect.PLACE:
          this.playPlaceSound(ctx);
          break;
        case SoundEffect.MOVE:
          this.playMoveSound(ctx);
          break;
        case SoundEffect.MILL:
          this.playMillSound(ctx);
          break;
        case SoundEffect.REMOVE:
          this.playRemoveSound(ctx);
          break;
        case SoundEffect.GAME_END:
          this.playGameEndSound(ctx);
          break;
      }
    } catch (e) {
      logger.warn('Failed to play sound effect', e);
    }
  }

  /**
   * Lazily create or resume the AudioContext.
   * Browsers require a user gesture before audio can play,
   * so we create the context on first interaction.
   */
  private getAudioContext(): AudioContext | null {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {
          /* ignore — will retry next interaction */
        });
      }
      return this.audioContext;
    } catch {
      logger.warn('Web Audio API not available');
      return null;
    }
  }

  /** Short click/tap sound for placing a piece */
  private playPlaceSound(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  /** Slide/whoosh sound for moving a piece */
  private playMoveSound(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  /** Cheerful ascending major triad chime for forming a mill */
  private playMillSound(ctx: AudioContext): void {
    const play = (freq: number, delay: number): void => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + delay + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.35);
    };

    play(262, 0); // C4
    play(330, 0.12); // E4
    play(392, 0.24); // G4
  }

  /** Low thud for removing an opponent piece */
  private playRemoveSound(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  }

  /** Fanfare for game end */
  private playGameEndSound(ctx: AudioContext): void {
    const play = (freq: number, delay: number): void => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + delay + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.35);
    };

    play(523, 0); // C5
    play(659, 0.15); // E5
    play(784, 0.3); // G5
    play(1047, 0.45); // C6
  }

  /** Load mute preference from localStorage */
  private static loadMutePreference(): boolean {
    try {
      return window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  /** Save mute preference to localStorage */
  private static saveMutePreference(muted: boolean): void {
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
    } catch {
      logger.warn('Failed to save mute preference');
    }
  }

  /**
   * Clean up the AudioContext when no longer needed
   */
  public dispose(): void {
    if (this.audioContext) {
      this.audioContext.close().catch(() => {
        /* ignore */
      });
      this.audioContext = null;
    }
  }
}
