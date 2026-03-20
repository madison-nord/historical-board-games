import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalStorage } from './LocalStorage.js';
import { GamePhase, PlayerColor, GameMode } from '../models/index.js';
import type { GameState } from '../controllers/GameController.js';

/**
 * TDD tests for mode-specific saved games.
 * Single-player and local two-player games should be stored independently
 * so that saving one does not overwrite the other.
 */

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    gameId: 'test-game',
    phase: GamePhase.PLACEMENT,
    currentPlayer: PlayerColor.WHITE,
    whitePiecesRemaining: 7,
    blackPiecesRemaining: 8,
    whitePiecesOnBoard: 2,
    blackPiecesOnBoard: 1,
    board: new Array(24).fill(null),
    isGameOver: false,
    gameOver: false,
    winner: null,
    millFormed: false,
    ...overrides,
  };
}

describe('Mode-specific saved games', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should save single-player and two-player games independently', () => {
    const spState = makeGameState({ gameId: 'sp-game' });
    const tpState = makeGameState({ gameId: 'tp-game' });

    LocalStorage.saveGameState(spState, GameMode.SINGLE_PLAYER, PlayerColor.WHITE);
    LocalStorage.saveGameState(tpState, GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE);

    const loadedSP = LocalStorage.loadGameStateForMode(GameMode.SINGLE_PLAYER);
    const loadedTP = LocalStorage.loadGameStateForMode(GameMode.LOCAL_TWO_PLAYER);

    expect(loadedSP).not.toBeNull();
    expect(loadedSP?.gameId).toBe('sp-game');
    expect(loadedTP).not.toBeNull();
    expect(loadedTP?.gameId).toBe('tp-game');
  });

  it('should not overwrite single-player save when saving two-player game', () => {
    const spState = makeGameState({ gameId: 'sp-game', phase: GamePhase.MOVEMENT });
    const tpState = makeGameState({ gameId: 'tp-game', phase: GamePhase.PLACEMENT });

    LocalStorage.saveGameState(spState, GameMode.SINGLE_PLAYER, PlayerColor.BLACK);
    LocalStorage.saveGameState(tpState, GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE);

    const loadedSP = LocalStorage.loadGameStateForMode(GameMode.SINGLE_PLAYER);
    expect(loadedSP?.gameId).toBe('sp-game');
    expect(loadedSP?.phase).toBe(GamePhase.MOVEMENT);
    expect(loadedSP?.playerColor).toBe(PlayerColor.BLACK);
  });

  it('should not overwrite two-player save when saving single-player game', () => {
    const tpState = makeGameState({ gameId: 'tp-game', phase: GamePhase.FLYING });
    const spState = makeGameState({ gameId: 'sp-game', phase: GamePhase.PLACEMENT });

    LocalStorage.saveGameState(tpState, GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE);
    LocalStorage.saveGameState(spState, GameMode.SINGLE_PLAYER, PlayerColor.WHITE);

    const loadedTP = LocalStorage.loadGameStateForMode(GameMode.LOCAL_TWO_PLAYER);
    expect(loadedTP?.gameId).toBe('tp-game');
    expect(loadedTP?.phase).toBe(GamePhase.FLYING);
  });

  it('hasSavedGameForMode should check only the specified mode', () => {
    const spState = makeGameState({ gameId: 'sp-only' });
    LocalStorage.saveGameState(spState, GameMode.SINGLE_PLAYER, PlayerColor.WHITE);

    expect(LocalStorage.hasSavedGameForMode(GameMode.SINGLE_PLAYER)).toBe(true);
    expect(LocalStorage.hasSavedGameForMode(GameMode.LOCAL_TWO_PLAYER)).toBe(false);
  });

  it('clearGameStateForMode should only clear the specified mode', () => {
    const spState = makeGameState({ gameId: 'sp-game' });
    const tpState = makeGameState({ gameId: 'tp-game' });

    LocalStorage.saveGameState(spState, GameMode.SINGLE_PLAYER, PlayerColor.WHITE);
    LocalStorage.saveGameState(tpState, GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE);

    LocalStorage.clearGameStateForMode(GameMode.SINGLE_PLAYER);

    expect(LocalStorage.hasSavedGameForMode(GameMode.SINGLE_PLAYER)).toBe(false);
    expect(LocalStorage.hasSavedGameForMode(GameMode.LOCAL_TWO_PLAYER)).toBe(true);
    expect(LocalStorage.loadGameStateForMode(GameMode.LOCAL_TWO_PLAYER)?.gameId).toBe('tp-game');
  });

  it('clearGameStateForMode should not affect other modes', () => {
    const spState = makeGameState({ gameId: 'sp-game' });
    const tpState = makeGameState({ gameId: 'tp-game' });

    LocalStorage.saveGameState(spState, GameMode.SINGLE_PLAYER, PlayerColor.WHITE);
    LocalStorage.saveGameState(tpState, GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE);

    LocalStorage.clearGameStateForMode(GameMode.LOCAL_TWO_PLAYER);

    expect(LocalStorage.hasSavedGameForMode(GameMode.LOCAL_TWO_PLAYER)).toBe(false);
    expect(LocalStorage.hasSavedGameForMode(GameMode.SINGLE_PLAYER)).toBe(true);
    expect(LocalStorage.loadGameStateForMode(GameMode.SINGLE_PLAYER)?.gameId).toBe('sp-game');
  });

  it('loadGameStateForMode should return null for modes with no saved game', () => {
    expect(LocalStorage.loadGameStateForMode(GameMode.SINGLE_PLAYER)).toBeNull();
    expect(LocalStorage.loadGameStateForMode(GameMode.LOCAL_TWO_PLAYER)).toBeNull();
  });

  it('should migrate legacy saved game to mode-specific key on load', () => {
    // Simulate old-format save using the legacy key
    const legacyState = {
      gameId: 'legacy-game',
      phase: GamePhase.MOVEMENT,
      currentPlayer: PlayerColor.BLACK,
      whitePiecesRemaining: 0,
      blackPiecesRemaining: 0,
      whitePiecesOnBoard: 5,
      blackPiecesOnBoard: 4,
      board: new Array(24).fill(null),
      isGameOver: false,
      winner: null,
      millFormed: false,
      gameMode: GameMode.SINGLE_PLAYER,
      playerColor: PlayerColor.WHITE,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem('ninemensmorris_saved_game', JSON.stringify(legacyState));

    // loadGameStateForMode should find the legacy key and migrate it
    const loaded = LocalStorage.loadGameStateForMode(GameMode.SINGLE_PLAYER);
    expect(loaded).not.toBeNull();
    expect(loaded?.gameId).toBe('legacy-game');

    // Legacy key should be removed after migration
    expect(window.localStorage.getItem('ninemensmorris_saved_game')).toBeNull();
  });

  it('should not migrate legacy save to wrong mode', () => {
    const legacyState = {
      gameId: 'legacy-sp',
      phase: GamePhase.PLACEMENT,
      currentPlayer: PlayerColor.WHITE,
      whitePiecesRemaining: 9,
      blackPiecesRemaining: 9,
      whitePiecesOnBoard: 0,
      blackPiecesOnBoard: 0,
      board: new Array(24).fill(null),
      isGameOver: false,
      winner: null,
      millFormed: false,
      gameMode: GameMode.SINGLE_PLAYER,
      playerColor: PlayerColor.WHITE,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem('ninemensmorris_saved_game', JSON.stringify(legacyState));

    // Asking for two-player should NOT return the single-player legacy save
    const loaded = LocalStorage.loadGameStateForMode(GameMode.LOCAL_TWO_PLAYER);
    expect(loaded).toBeNull();
  });
});
