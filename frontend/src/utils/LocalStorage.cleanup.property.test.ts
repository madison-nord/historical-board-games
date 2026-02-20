import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { LocalStorage } from './LocalStorage.js';
import { GamePhase, PlayerColor, GameMode } from '../models/index.js';

/**
 * Property-Based Tests for LocalStorage Cleanup
 *
 * These tests validate that saved state is properly cleaned up.
 */

describe('LocalStorage Cleanup Property Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    window.localStorage.clear();
  });

  /**
   * Property 19: Persistence Cleanup
   * **Validates: Requirements 11.3**
   *
   * For any local game that reaches completion or is explicitly abandoned,
   * the saved state in browser storage should be cleared.
   */
  describe('Property 19: Persistence Cleanup', () => {
    it('should clear saved state when clearGameState is called', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary game states
          fc.record({
            gameId: fc.string({ minLength: 1, maxLength: 50 }),
            phase: fc.constantFrom(GamePhase.PLACEMENT, GamePhase.MOVEMENT, GamePhase.FLYING),
            currentPlayer: fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK),
            whitePiecesRemaining: fc.integer({ min: 0, max: 9 }),
            blackPiecesRemaining: fc.integer({ min: 0, max: 9 }),
            whitePiecesOnBoard: fc.integer({ min: 0, max: 9 }),
            blackPiecesOnBoard: fc.integer({ min: 0, max: 9 }),
            board: fc.array(fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK, null), {
              minLength: 24,
              maxLength: 24,
            }),
            isGameOver: fc.constant(false), // Not game over so it can be saved
            winner: fc.constant(null),
            millFormed: fc.boolean(),
          }),
          fc.constantFrom(GameMode.SINGLE_PLAYER, GameMode.LOCAL_TWO_PLAYER),
          fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK),
          (gameState, gameMode, playerColor) => {
            // Save a game state
            const saved = LocalStorage.saveGameState(gameState, gameMode, playerColor);
            expect(saved).toBe(true);

            // Verify it was saved
            expect(LocalStorage.hasSavedGame()).toBe(true);
            const loaded = LocalStorage.loadGameState();
            expect(loaded).not.toBeNull();

            // Clear the saved state
            LocalStorage.clearGameState();

            // Verify it was cleared
            expect(LocalStorage.hasSavedGame()).toBe(false);
            const loadedAfterClear = LocalStorage.loadGameState();
            expect(loadedAfterClear).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple save-clear cycles', () => {
      fc.assert(
        fc.property(
          // Generate array of game states
          fc.array(
            fc.record({
              gameId: fc.string({ minLength: 1, maxLength: 50 }),
              phase: fc.constantFrom(GamePhase.PLACEMENT, GamePhase.MOVEMENT, GamePhase.FLYING),
              currentPlayer: fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK),
              whitePiecesRemaining: fc.integer({ min: 0, max: 9 }),
              blackPiecesRemaining: fc.integer({ min: 0, max: 9 }),
              whitePiecesOnBoard: fc.integer({ min: 0, max: 9 }),
              blackPiecesOnBoard: fc.integer({ min: 0, max: 9 }),
              board: fc.array(fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK, null), {
                minLength: 24,
                maxLength: 24,
              }),
              isGameOver: fc.constant(false),
              winner: fc.constant(null),
              millFormed: fc.boolean(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.constantFrom(GameMode.SINGLE_PLAYER, GameMode.LOCAL_TWO_PLAYER),
          fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK),
          (gameStates, gameMode, playerColor) => {
            // Perform multiple save-clear cycles
            for (const gameState of gameStates) {
              // Save
              const saved = LocalStorage.saveGameState(gameState, gameMode, playerColor);
              expect(saved).toBe(true);
              expect(LocalStorage.hasSavedGame()).toBe(true);

              // Clear
              LocalStorage.clearGameState();
              expect(LocalStorage.hasSavedGame()).toBe(false);
            }

            // Final verification - nothing should be saved
            expect(LocalStorage.hasSavedGame()).toBe(false);
            expect(LocalStorage.loadGameState()).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle clearing when no saved game exists', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), numClears => {
          // Verify no saved game exists
          expect(LocalStorage.hasSavedGame()).toBe(false);

          // Call clear multiple times
          for (let i = 0; i < numClears; i++) {
            LocalStorage.clearGameState();
            expect(LocalStorage.hasSavedGame()).toBe(false);
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should clear state after saving completed game attempts', () => {
      fc.assert(
        fc.property(
          fc.record({
            gameId: fc.string({ minLength: 1, maxLength: 50 }),
            phase: fc.constantFrom(GamePhase.PLACEMENT, GamePhase.MOVEMENT, GamePhase.FLYING),
            currentPlayer: fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK),
            whitePiecesRemaining: fc.integer({ min: 0, max: 9 }),
            blackPiecesRemaining: fc.integer({ min: 0, max: 9 }),
            whitePiecesOnBoard: fc.integer({ min: 0, max: 9 }),
            blackPiecesOnBoard: fc.integer({ min: 0, max: 9 }),
            board: fc.array(fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK, null), {
              minLength: 24,
              maxLength: 24,
            }),
            isGameOver: fc.constant(false),
            winner: fc.constant(null),
            millFormed: fc.boolean(),
          }),
          fc.constantFrom(GameMode.SINGLE_PLAYER, GameMode.LOCAL_TWO_PLAYER),
          fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK),
          (gameState, gameMode, playerColor) => {
            // Save an in-progress game
            const saved = LocalStorage.saveGameState(gameState, gameMode, playerColor);
            expect(saved).toBe(true);
            expect(LocalStorage.hasSavedGame()).toBe(true);

            // Now mark game as completed and try to save
            const completedState = { ...gameState, isGameOver: true, winner: PlayerColor.WHITE };
            const savedCompleted = LocalStorage.saveGameState(
              completedState,
              gameMode,
              playerColor
            );
            expect(savedCompleted).toBe(false); // Should not save completed games

            // The previous save should still be there
            expect(LocalStorage.hasSavedGame()).toBe(true);

            // Explicitly clear (simulating game completion cleanup)
            LocalStorage.clearGameState();
            expect(LocalStorage.hasSavedGame()).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
