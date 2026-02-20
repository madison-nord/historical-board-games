import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { LocalStorage } from './LocalStorage.js';
import { GamePhase, PlayerColor, GameMode } from '../models/index.js';

/**
 * Property-Based Tests for LocalStorage
 *
 * These tests validate correctness properties across many randomly generated inputs.
 */

describe('LocalStorage Property Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    window.localStorage.clear();
  });

  /**
   * Property 18: Save-Load Round Trip
   * **Validates: Requirements 11.1**
   *
   * For any local game state (single-player or local two-player),
   * saving the state to browser storage and then loading it
   * should produce an equivalent game state.
   */
  describe('Property 18: Save-Load Round Trip', () => {
    it('should preserve game state through save-load cycle', () => {
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
            isGameOver: fc.boolean(),
            winner: fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK, null),
            millFormed: fc.boolean(),
          }),
          // Generate game mode (only local games)
          fc.constantFrom(GameMode.SINGLE_PLAYER, GameMode.LOCAL_TWO_PLAYER),
          // Generate player color
          fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK),
          (gameState, gameMode, playerColor) => {
            // Skip if game is over (shouldn't be saved)
            if (gameState.isGameOver) {
              return true;
            }

            // Save the game state
            const saved = LocalStorage.saveGameState(gameState, gameMode, playerColor);
            expect(saved).toBe(true);

            // Load the game state
            const loaded = LocalStorage.loadGameState();
            expect(loaded).not.toBeNull();

            if (loaded) {
              // Verify all fields match
              expect(loaded.gameId).toBe(gameState.gameId);
              expect(loaded.phase).toBe(gameState.phase);
              expect(loaded.currentPlayer).toBe(gameState.currentPlayer);
              expect(loaded.whitePiecesRemaining).toBe(gameState.whitePiecesRemaining);
              expect(loaded.blackPiecesRemaining).toBe(gameState.blackPiecesRemaining);
              expect(loaded.whitePiecesOnBoard).toBe(gameState.whitePiecesOnBoard);
              expect(loaded.blackPiecesOnBoard).toBe(gameState.blackPiecesOnBoard);
              expect(loaded.isGameOver).toBe(gameState.isGameOver);
              expect(loaded.winner).toBe(gameState.winner);
              expect(loaded.millFormed).toBe(gameState.millFormed);
              expect(loaded.gameMode).toBe(gameMode);
              expect(loaded.playerColor).toBe(playerColor);

              // Verify board array matches
              expect(loaded.board).toHaveLength(24);
              for (let i = 0; i < 24; i++) {
                expect(loaded.board[i]).toBe(gameState.board[i]);
              }

              // Verify savedAt timestamp exists and is valid
              expect(loaded.savedAt).toBeDefined();
              expect(new Date(loaded.savedAt).getTime()).toBeGreaterThan(0);
            }

            return true;
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });

    it('should not save online multiplayer games', () => {
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
            isGameOver: fc.boolean(),
            winner: fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK, null),
            millFormed: fc.boolean(),
          }),
          fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK),
          (gameState, playerColor) => {
            // Try to save online multiplayer game
            const saved = LocalStorage.saveGameState(
              gameState,
              GameMode.ONLINE_MULTIPLAYER,
              playerColor
            );

            // Should return false (not saved)
            expect(saved).toBe(false);

            // Verify nothing was saved
            const loaded = LocalStorage.loadGameState();
            expect(loaded).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not save completed games', () => {
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
            isGameOver: fc.constant(true), // Always game over
            winner: fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK),
            millFormed: fc.boolean(),
          }),
          fc.constantFrom(GameMode.SINGLE_PLAYER, GameMode.LOCAL_TWO_PLAYER),
          fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK),
          (gameState, gameMode, playerColor) => {
            // Try to save completed game
            const saved = LocalStorage.saveGameState(gameState, gameMode, playerColor);

            // Should return false (not saved)
            expect(saved).toBe(false);

            // Verify nothing was saved
            const loaded = LocalStorage.loadGameState();
            expect(loaded).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
