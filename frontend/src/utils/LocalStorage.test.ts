import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorage } from './LocalStorage.js';
import { GamePhase, PlayerColor, GameMode } from '../models/index.js';
import type { GameState } from '../controllers/GameController.js';

/**
 * Unit Tests for LocalStorage
 *
 * These tests validate specific examples and edge cases for localStorage handling.
 */

describe('LocalStorage Unit Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    window.localStorage.clear();
  });

  describe('saveGameState', () => {
    it('should save a valid game state', () => {
      const gameState: GameState = {
        gameId: 'test-game-123',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.WHITE,
        whitePiecesRemaining: 7,
        blackPiecesRemaining: 8,
        whitePiecesOnBoard: 2,
        blackPiecesOnBoard: 1,
        board: new Array(24).fill(null),
        isGameOver: false,
        winner: null,
        millFormed: false,
      };

      const result = LocalStorage.saveGameState(gameState, GameMode.SINGLE_PLAYER, PlayerColor.WHITE);

      expect(result).toBe(true);
      expect(LocalStorage.hasSavedGame()).toBe(true);
    });

    it('should not save online multiplayer games', () => {
      const gameState: GameState = {
        gameId: 'online-game-123',
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
      };

      const result = LocalStorage.saveGameState(
        gameState,
        GameMode.ONLINE_MULTIPLAYER,
        PlayerColor.WHITE
      );

      expect(result).toBe(false);
      expect(LocalStorage.hasSavedGame()).toBe(false);
    });

    it('should not save completed games', () => {
      const gameState: GameState = {
        gameId: 'completed-game-123',
        phase: GamePhase.MOVEMENT,
        currentPlayer: PlayerColor.WHITE,
        whitePiecesRemaining: 0,
        blackPiecesRemaining: 0,
        whitePiecesOnBoard: 5,
        blackPiecesOnBoard: 2,
        board: new Array(24).fill(null),
        isGameOver: true,
        winner: PlayerColor.WHITE,
        millFormed: false,
      };

      const result = LocalStorage.saveGameState(gameState, GameMode.SINGLE_PLAYER, PlayerColor.WHITE);

      expect(result).toBe(false);
      expect(LocalStorage.hasSavedGame()).toBe(false);
    });

    it('should overwrite existing saved game', () => {
      const gameState1: GameState = {
        gameId: 'game-1',
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
      };

      const gameState2: GameState = {
        gameId: 'game-2',
        phase: GamePhase.MOVEMENT,
        currentPlayer: PlayerColor.BLACK,
        whitePiecesRemaining: 0,
        blackPiecesRemaining: 0,
        whitePiecesOnBoard: 9,
        blackPiecesOnBoard: 9,
        board: new Array(24).fill(null),
        isGameOver: false,
        winner: null,
        millFormed: false,
      };

      LocalStorage.saveGameState(gameState1, GameMode.SINGLE_PLAYER, PlayerColor.WHITE);
      LocalStorage.saveGameState(gameState2, GameMode.LOCAL_TWO_PLAYER, PlayerColor.BLACK);

      const loaded = LocalStorage.loadGameState();
      expect(loaded).not.toBeNull();
      expect(loaded?.gameId).toBe('game-2');
      expect(loaded?.phase).toBe(GamePhase.MOVEMENT);
      expect(loaded?.gameMode).toBe(GameMode.LOCAL_TWO_PLAYER);
    });
  });

  describe('loadGameState', () => {
    it('should load a saved game state', () => {
      const gameState: GameState = {
        gameId: 'test-game-456',
        phase: GamePhase.MOVEMENT,
        currentPlayer: PlayerColor.BLACK,
        whitePiecesRemaining: 0,
        blackPiecesRemaining: 0,
        whitePiecesOnBoard: 7,
        blackPiecesOnBoard: 8,
        board: new Array(24).fill(null),
        isGameOver: false,
        winner: null,
        millFormed: true,
      };

      LocalStorage.saveGameState(gameState, GameMode.SINGLE_PLAYER, PlayerColor.WHITE);
      const loaded = LocalStorage.loadGameState();

      expect(loaded).not.toBeNull();
      expect(loaded?.gameId).toBe('test-game-456');
      expect(loaded?.phase).toBe(GamePhase.MOVEMENT);
      expect(loaded?.currentPlayer).toBe(PlayerColor.BLACK);
      expect(loaded?.millFormed).toBe(true);
      expect(loaded?.gameMode).toBe(GameMode.SINGLE_PLAYER);
      expect(loaded?.playerColor).toBe(PlayerColor.WHITE);
    });

    it('should return null when no saved game exists', () => {
      const loaded = LocalStorage.loadGameState();
      expect(loaded).toBeNull();
    });

    it('should return null and clear corrupted data', () => {
      // Manually set corrupted data
      window.localStorage.setItem('ninemensmorris_saved_game', 'invalid json {');

      const loaded = LocalStorage.loadGameState();
      expect(loaded).toBeNull();
      expect(LocalStorage.hasSavedGame()).toBe(false);
    });

    it('should return null and clear invalid game data', () => {
      // Save data missing required fields
      const invalidData = {
        gameId: 'test',
        // Missing phase, currentPlayer, board, etc.
      };
      window.localStorage.setItem('ninemensmorris_saved_game', JSON.stringify(invalidData));

      const loaded = LocalStorage.loadGameState();
      expect(loaded).toBeNull();
      expect(LocalStorage.hasSavedGame()).toBe(false);
    });

    it('should return null if board array is invalid', () => {
      const invalidData = {
        gameId: 'test',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.WHITE,
        board: [1, 2, 3], // Wrong length
      };
      window.localStorage.setItem('ninemensmorris_saved_game', JSON.stringify(invalidData));

      const loaded = LocalStorage.loadGameState();
      expect(loaded).toBeNull();
    });
  });

  describe('clearGameState', () => {
    it('should clear saved game state', () => {
      const gameState: GameState = {
        gameId: 'test-game-789',
        phase: GamePhase.FLYING,
        currentPlayer: PlayerColor.WHITE,
        whitePiecesRemaining: 0,
        blackPiecesRemaining: 0,
        whitePiecesOnBoard: 3,
        blackPiecesOnBoard: 5,
        board: new Array(24).fill(null),
        isGameOver: false,
        winner: null,
        millFormed: false,
      };

      LocalStorage.saveGameState(gameState, GameMode.SINGLE_PLAYER, PlayerColor.BLACK);
      expect(LocalStorage.hasSavedGame()).toBe(true);

      LocalStorage.clearGameState();
      expect(LocalStorage.hasSavedGame()).toBe(false);
      expect(LocalStorage.loadGameState()).toBeNull();
    });

    it('should not throw when clearing non-existent saved game', () => {
      expect(() => LocalStorage.clearGameState()).not.toThrow();
      expect(LocalStorage.hasSavedGame()).toBe(false);
    });
  });

  describe('hasSavedGame', () => {
    it('should return true when saved game exists', () => {
      const gameState: GameState = {
        gameId: 'test-game-abc',
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
      };

      LocalStorage.saveGameState(gameState, GameMode.SINGLE_PLAYER, PlayerColor.WHITE);
      expect(LocalStorage.hasSavedGame()).toBe(true);
    });

    it('should return false when no saved game exists', () => {
      expect(LocalStorage.hasSavedGame()).toBe(false);
    });

    it('should return false after clearing saved game', () => {
      const gameState: GameState = {
        gameId: 'test-game-def',
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
      };

      LocalStorage.saveGameState(gameState, GameMode.SINGLE_PLAYER, PlayerColor.WHITE);
      LocalStorage.clearGameState();
      expect(LocalStorage.hasSavedGame()).toBe(false);
    });
  });

  describe('localStorage error handling', () => {
    it('should handle corrupted data gracefully', () => {
      // Manually set corrupted data
      window.localStorage.setItem('ninemensmorris_saved_game', 'invalid json {');

      // Should not throw, should return null and clear corrupted data
      const loaded = LocalStorage.loadGameState();
      expect(loaded).toBeNull();
      expect(LocalStorage.hasSavedGame()).toBe(false);
    });

    it('should handle missing required fields', () => {
      // Save data missing required fields
      const invalidData = {
        gameId: 'test',
        // Missing phase, currentPlayer, board, etc.
      };
      window.localStorage.setItem('ninemensmorris_saved_game', JSON.stringify(invalidData));

      // Should return null and clear invalid data
      const loaded = LocalStorage.loadGameState();
      expect(loaded).toBeNull();
      expect(LocalStorage.hasSavedGame()).toBe(false);
    });

    it('should handle invalid board array', () => {
      const invalidData = {
        gameId: 'test',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.WHITE,
        board: [1, 2, 3], // Wrong length
      };
      window.localStorage.setItem('ninemensmorris_saved_game', JSON.stringify(invalidData));

      // Should return null and clear invalid data
      const loaded = LocalStorage.loadGameState();
      expect(loaded).toBeNull();
      expect(LocalStorage.hasSavedGame()).toBe(false);
    });
  });
});
