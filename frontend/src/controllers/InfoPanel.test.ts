import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InfoPanel } from './InfoPanel';
import { PlayerColor } from '../models/PlayerColor';
import { GamePhase } from '../models/GamePhase';
import { GameMode } from '../models/GameMode';
import type { GameState } from '../models/GameState';

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    gameId: 'test-game',
    phase: GamePhase.PLACEMENT,
    currentPlayer: PlayerColor.WHITE,
    board: new Array(24).fill(null),
    whitePiecesRemaining: 9,
    blackPiecesRemaining: 9,
    whitePiecesOnBoard: 0,
    blackPiecesOnBoard: 0,
    gameOver: false,
    winner: null,
    millFormed: false,
    ...overrides,
  };
}

describe('InfoPanel', () => {
  let panel: InfoPanel;

  beforeEach(() => {
    panel = new InfoPanel();
  });

  afterEach(() => {
    panel.destroy();
    // Clean up any leftover DOM elements
    document.querySelectorAll('.info-panel').forEach(el => el.remove());
  });

  describe('create()', () => {
    it('should create correct DOM structure with all expected child elements', () => {
      panel.create();

      const container = document.querySelector('.info-panel');
      expect(container).not.toBeNull();
      expect(container?.id).toBe('info-panel');

      const turnIndicator = container?.querySelector('.info-panel-turn');
      expect(turnIndicator).not.toBeNull();

      const phaseDisplay = container?.querySelector('.info-panel-phase');
      expect(phaseDisplay).not.toBeNull();

      const piecesDisplay = container?.querySelector('.info-panel-pieces');
      expect(piecesDisplay).not.toBeNull();

      const playerColorDisplay = container?.querySelector('.info-panel-player-color');
      expect(playerColorDisplay).not.toBeNull();

      const actionInstruction = container?.querySelector('.info-panel-action');
      expect(actionInstruction).not.toBeNull();

      // Verify all 5 child elements exist
      expect(container?.children.length).toBe(5);
    });

    it('should append to document body when no info-panel-container exists', () => {
      panel.create();

      const container = document.body.querySelector('.info-panel');
      expect(container).not.toBeNull();
    });

    it('should append to info-panel-container when it exists', () => {
      const target = document.createElement('div');
      target.id = 'info-panel-container';
      document.body.appendChild(target);

      panel.create();

      expect(target.querySelector('.info-panel')).not.toBeNull();
      expect(target.children.length).toBe(1);

      target.remove();
    });
  });

  describe('show() and hide()', () => {
    it('should toggle visibility via display style', () => {
      panel.create();
      const container = document.querySelector('.info-panel') as HTMLElement;

      panel.hide();
      expect(container.style.display).toBe('none');

      panel.show();
      expect(container.style.display).toBe('');
    });

    it('should not throw when called before create()', () => {
      expect(() => panel.show()).not.toThrow();
      expect(() => panel.hide()).not.toThrow();
    });
  });

  describe('update() — player color display', () => {
    it('should display "You are: White" only in online multiplayer mode', () => {
      panel.create();
      const state = createMockGameState();

      panel.update(state, GameMode.ONLINE_MULTIPLAYER, PlayerColor.WHITE, null, false);

      const playerColorEl = document.querySelector('.info-panel-player-color') as HTMLElement;
      expect(playerColorEl.textContent).toBe('You are: White');
      expect(playerColorEl.style.display).toBe('');
    });

    it('should display "You are: Black" in online multiplayer when player is black', () => {
      panel.create();
      const state = createMockGameState();

      panel.update(state, GameMode.ONLINE_MULTIPLAYER, PlayerColor.BLACK, null, false);

      const playerColorEl = document.querySelector('.info-panel-player-color') as HTMLElement;
      expect(playerColorEl.textContent).toBe('You are: Black');
    });

    it('should hide player color display in local two-player mode', () => {
      panel.create();
      const state = createMockGameState();

      panel.update(state, GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE, null, false);

      const playerColorEl = document.querySelector('.info-panel-player-color') as HTMLElement;
      expect(playerColorEl.getAttribute('data-hidden')).toBe('true');
    });

    it('should hide player color display in single-player mode', () => {
      panel.create();
      const state = createMockGameState();

      panel.update(state, GameMode.SINGLE_PLAYER, PlayerColor.WHITE, null, false);

      const playerColorEl = document.querySelector('.info-panel-player-color') as HTMLElement;
      expect(playerColorEl.getAttribute('data-hidden')).toBe('true');
    });
  });

  describe('update() — pieces remaining display', () => {
    it('should show pieces remaining during PLACEMENT phase', () => {
      panel.create();
      const state = createMockGameState({
        phase: GamePhase.PLACEMENT,
        whitePiecesRemaining: 7,
        blackPiecesRemaining: 6,
      });

      panel.update(state, GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE, null, false);

      const piecesEl = document.querySelector('.info-panel-pieces') as HTMLElement;
      expect(piecesEl.style.display).toBe('');
      expect(piecesEl.textContent).toContain('7');
      expect(piecesEl.textContent).toContain('6');
    });

    it('should hide pieces remaining when not in PLACEMENT phase', () => {
      panel.create();
      const state = createMockGameState({ phase: GamePhase.MOVEMENT });

      panel.update(state, GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE, null, false);

      const piecesEl = document.querySelector('.info-panel-pieces') as HTMLElement;
      expect(piecesEl.getAttribute('data-hidden')).toBe('true');
    });

    it('should hide pieces remaining in FLYING phase', () => {
      panel.create();
      const state = createMockGameState({ phase: GamePhase.FLYING });

      panel.update(state, GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE, null, false);

      const piecesEl = document.querySelector('.info-panel-pieces') as HTMLElement;
      expect(piecesEl.getAttribute('data-hidden')).toBe('true');
    });
  });

  describe('update() — turn indicator and phase display', () => {
    it('should display current turn as White', () => {
      panel.create();
      const state = createMockGameState({ currentPlayer: PlayerColor.WHITE });

      panel.update(state, GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE, null, false);

      const turnEl = document.querySelector('.info-panel-turn') as HTMLElement;
      expect(turnEl.textContent).toContain('White');
    });

    it('should display current turn as Black', () => {
      panel.create();
      const state = createMockGameState({ currentPlayer: PlayerColor.BLACK });

      panel.update(state, GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE, null, false);

      const turnEl = document.querySelector('.info-panel-turn') as HTMLElement;
      expect(turnEl.textContent).toContain('Black');
    });

    it('should display current phase name', () => {
      panel.create();

      panel.update(
        createMockGameState({ phase: GamePhase.PLACEMENT }),
        GameMode.LOCAL_TWO_PLAYER,
        PlayerColor.WHITE,
        null,
        false
      );
      const phaseEl = document.querySelector('.info-panel-phase') as HTMLElement;
      expect(phaseEl.textContent).toContain('Placement');

      panel.update(
        createMockGameState({ phase: GamePhase.MOVEMENT }),
        GameMode.LOCAL_TWO_PLAYER,
        PlayerColor.WHITE,
        null,
        false
      );
      expect(phaseEl.textContent).toContain('Movement');

      panel.update(
        createMockGameState({ phase: GamePhase.FLYING }),
        GameMode.LOCAL_TWO_PLAYER,
        PlayerColor.WHITE,
        null,
        false
      );
      expect(phaseEl.textContent).toContain('Flying');
    });
  });

  describe('destroy()', () => {
    it('should remove DOM elements from the document', () => {
      panel.create();
      expect(document.querySelector('.info-panel')).not.toBeNull();

      panel.destroy();
      expect(document.querySelector('.info-panel')).toBeNull();
    });

    it('should be safe to call destroy() multiple times', () => {
      panel.create();
      expect(() => {
        panel.destroy();
        panel.destroy();
      }).not.toThrow();
    });

    it('should be safe to call destroy() without create()', () => {
      expect(() => panel.destroy()).not.toThrow();
    });
  });

  describe('update() before create()', () => {
    it('should not throw when update() is called before create()', () => {
      const state = createMockGameState();
      expect(() => {
        panel.update(state, GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE, null, false);
      }).not.toThrow();
    });
  });
});
