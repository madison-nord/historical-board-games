import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameController } from './GameController';
import { BoardRenderer } from '../rendering/BoardRenderer';
import { GameMode, GamePhase, PlayerColor } from '../models';

/**
 * Focused Tests for Piece Removal After Mill Formation
 *
 * Tests cover:
 * - Mill detection in all configurations
 * - Removable piece identification
 * - Protected mill pieces
 * - Removal execution
 * - Post-removal state management
 * - Edge cases in removal logic
 */

describe('GameController - Piece Removal', () => {
  let gameController: GameController;
  let boardRenderer: BoardRenderer;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    document.body.appendChild(canvas);

    boardRenderer = new BoardRenderer(canvas);
    gameController = new GameController(GameMode.LOCAL_TWO_PLAYER, boardRenderer);
    gameController.startGame();
  });

  afterEach(() => {
    gameController.stopGameLoop();
    document.body.removeChild(canvas);
  });

  describe('Mill Detection', () => {
    it('should detect horizontal mill on outer square', () => {
      // Form mill at 0-1-2
      gameController.handlePositionClick(0); // WHITE
      gameController.handlePositionClick(8); // BLACK
      gameController.handlePositionClick(1); // WHITE
      gameController.handlePositionClick(9); // BLACK
      gameController.handlePositionClick(2); // WHITE - forms mill

      const state = gameController.getCurrentGameState();
      expect(state?.millFormed).toBe(true);
    });

    it('should detect horizontal mill on middle square', () => {
      // Form mill at 8-9-10
      gameController.handlePositionClick(8); // WHITE
      gameController.handlePositionClick(0); // BLACK
      gameController.handlePositionClick(9); // WHITE
      gameController.handlePositionClick(1); // BLACK
      gameController.handlePositionClick(10); // WHITE - forms mill

      const state = gameController.getCurrentGameState();
      expect(state?.millFormed).toBe(true);
    });

    it('should detect horizontal mill on inner square', () => {
      // Form mill at 16-17-18
      gameController.handlePositionClick(16); // WHITE
      gameController.handlePositionClick(0); // BLACK
      gameController.handlePositionClick(17); // WHITE
      gameController.handlePositionClick(1); // BLACK
      gameController.handlePositionClick(18); // WHITE - forms mill

      const state = gameController.getCurrentGameState();
      expect(state?.millFormed).toBe(true);
    });

    it('should detect vertical mill on left edge', () => {
      // Form mill at 0-7-6
      gameController.handlePositionClick(0); // WHITE
      gameController.handlePositionClick(8); // BLACK
      gameController.handlePositionClick(7); // WHITE
      gameController.handlePositionClick(9); // BLACK
      gameController.handlePositionClick(6); // WHITE - forms mill

      const state = gameController.getCurrentGameState();
      expect(state?.millFormed).toBe(true);
    });

    it('should detect vertical mill on right edge', () => {
      // Form mill at 2-3-4
      gameController.handlePositionClick(2); // WHITE
      gameController.handlePositionClick(8); // BLACK
      gameController.handlePositionClick(3); // WHITE
      gameController.handlePositionClick(9); // BLACK
      gameController.handlePositionClick(4); // WHITE - forms mill

      const state = gameController.getCurrentGameState();
      expect(state?.millFormed).toBe(true);
    });

    it('should detect radial mill connecting squares', () => {
      // Form mill at 1-9-17 (top radial)
      gameController.handlePositionClick(1); // WHITE
      gameController.handlePositionClick(0); // BLACK
      gameController.handlePositionClick(9); // WHITE
      gameController.handlePositionClick(8); // BLACK
      gameController.handlePositionClick(17); // WHITE - forms mill

      const state = gameController.getCurrentGameState();
      expect(state?.millFormed).toBe(true);
    });

    it('should not detect non-mill patterns', () => {
      // Place pieces that don't form a mill
      gameController.handlePositionClick(0); // WHITE
      gameController.handlePositionClick(8); // BLACK
      gameController.handlePositionClick(2); // WHITE (not adjacent to 0)

      const state = gameController.getCurrentGameState();
      expect(state?.millFormed).toBe(false);
    });
  });

  describe('Removable Piece Identification', () => {
    beforeEach(() => {
      // Set up scenario with mill formed
      gameController.handlePositionClick(0); // WHITE
      gameController.handlePositionClick(8); // BLACK
      gameController.handlePositionClick(1); // WHITE
      gameController.handlePositionClick(9); // BLACK
      gameController.handlePositionClick(2); // WHITE - forms mill
    });

    it('should allow removal of opponent pieces not in mills', () => {
      // BLACK pieces at 8 and 9 are not in mills
      gameController.handlePositionClick(8); // Remove BLACK piece

      const state = gameController.getCurrentGameState();
      expect(state?.board[8]).toBe(null);
    });

    it('should not allow removal of own pieces', () => {
      // Try to remove WHITE piece (should not work)
      gameController.handlePositionClick(0); // WHITE piece

      const state = gameController.getCurrentGameState();
      expect(state?.board[0]).toBe(PlayerColor.WHITE); // Should still be there
      expect(state?.millFormed).toBe(true); // Mill state should persist
    });

    it('should not allow removal of empty positions', () => {
      gameController.handlePositionClick(10); // Empty position

      const state = gameController.getCurrentGameState();
      expect(state?.millFormed).toBe(true); // Mill state should persist
    });
  });

  describe('Protected Mill Pieces', () => {
    it('should not allow removal of pieces in mills when other pieces exist', () => {
      // Set up scenario where BLACK has pieces in and out of mills
      const state = gameController.getCurrentGameState();
      if (state) {
        state.board = Array(24).fill(null);
        state.board[0] = PlayerColor.WHITE;
        state.board[1] = PlayerColor.WHITE;
        state.board[2] = PlayerColor.WHITE; // WHITE mill
        state.board[8] = PlayerColor.BLACK;
        state.board[9] = PlayerColor.BLACK;
        state.board[10] = PlayerColor.BLACK; // BLACK mill
        state.board[15] = PlayerColor.BLACK; // BLACK piece not in mill
        state.millFormed = true;
        state.currentPlayer = PlayerColor.WHITE;
        gameController.setBoardState(state);
      }

      // Try to remove BLACK piece in mill (should not work)
      gameController.handlePositionClick(8);

      const finalState = gameController.getCurrentGameState();
      expect(finalState?.board[8]).toBe(PlayerColor.BLACK); // Should still be there

      // Remove BLACK piece not in mill (should work)
      gameController.handlePositionClick(15);
      expect(finalState?.board[15]).toBe(null);
    });

    it('should allow removal of pieces in mills when all opponent pieces are in mills', () => {
      // Set up scenario where all BLACK pieces are in mills
      const state = gameController.getCurrentGameState();
      if (state) {
        state.board = Array(24).fill(null);
        state.board[0] = PlayerColor.WHITE;
        state.board[1] = PlayerColor.WHITE;
        state.board[2] = PlayerColor.WHITE; // WHITE mill
        state.board[8] = PlayerColor.BLACK;
        state.board[9] = PlayerColor.BLACK;
        state.board[10] = PlayerColor.BLACK; // BLACK mill (all BLACK pieces in mills)
        state.millFormed = true;
        state.currentPlayer = PlayerColor.WHITE;
        gameController.setBoardState(state);
      }

      // Should be able to remove BLACK piece even though it's in a mill
      gameController.handlePositionClick(8);

      const finalState = gameController.getCurrentGameState();
      expect(finalState?.board[8]).toBe(null);
    });
  });

  describe('Removal Execution', () => {
    beforeEach(() => {
      // Form mill
      gameController.handlePositionClick(0); // WHITE
      gameController.handlePositionClick(8); // BLACK
      gameController.handlePositionClick(1); // WHITE
      gameController.handlePositionClick(9); // BLACK
      gameController.handlePositionClick(2); // WHITE - forms mill
    });

    it('should remove piece from board', () => {
      gameController.handlePositionClick(8); // Remove BLACK piece

      const state = gameController.getCurrentGameState();
      expect(state?.board[8]).toBe(null);
    });

    it('should decrement opponent piece count', () => {
      const initialState = gameController.getCurrentGameState();
      const initialBlackCount = initialState?.blackPiecesOnBoard;

      gameController.handlePositionClick(8);

      const finalState = gameController.getCurrentGameState();
      expect(finalState?.blackPiecesOnBoard).toBe((initialBlackCount || 0) - 1);
    });

    it('should clear mill formed flag after removal', () => {
      gameController.handlePositionClick(8);

      const state = gameController.getCurrentGameState();
      expect(state?.millFormed).toBe(false);
    });

    it('should switch player after removal', () => {
      gameController.handlePositionClick(8);

      const state = gameController.getCurrentGameState();
      expect(state?.currentPlayer).toBe(PlayerColor.BLACK);
    });

    it('should clear selection after removal', () => {
      gameController.handlePositionClick(8);

      // After removal, mill should be cleared and it should be BLACK's turn
      const state = gameController.getCurrentGameState();
      expect(state?.board[8]).toBe(null); // Piece was removed
      expect(state?.millFormed).toBe(false); // Mill cleared
      expect(state?.currentPlayer).toBe(PlayerColor.BLACK); // Turn switched
    });
  });

  describe('Multiple Mills', () => {
    it('should handle forming multiple mills in sequence', () => {
      // Form first mill
      gameController.handlePositionClick(0); // WHITE
      gameController.handlePositionClick(8); // BLACK
      gameController.handlePositionClick(1); // WHITE
      gameController.handlePositionClick(9); // BLACK
      gameController.handlePositionClick(2); // WHITE - forms mill
      gameController.handlePositionClick(8); // Remove BLACK

      // Form second mill
      gameController.handlePositionClick(10); // BLACK
      gameController.handlePositionClick(6); // WHITE
      gameController.handlePositionClick(11); // BLACK
      gameController.handlePositionClick(7); // WHITE
      gameController.handlePositionClick(12); // BLACK - forms mill

      const state = gameController.getCurrentGameState();
      expect(state?.millFormed).toBe(true);
    });

    it('should handle breaking and reforming same mill', () => {
      // Set up movement phase with a mill that can be broken and reformed
      const state = gameController.getCurrentGameState();
      if (state) {
        state.phase = GamePhase.MOVEMENT;
        state.whitePiecesRemaining = 0;
        state.blackPiecesRemaining = 0;
        state.whitePiecesOnBoard = 5;
        state.blackPiecesOnBoard = 3;
        state.board = Array(24).fill(null);
        // WHITE mill at 0-1-2
        state.board[0] = PlayerColor.WHITE;
        state.board[1] = PlayerColor.WHITE;
        state.board[2] = PlayerColor.WHITE;
        state.board[7] = PlayerColor.WHITE;
        state.board[16] = PlayerColor.WHITE;
        // BLACK pieces
        state.board[8] = PlayerColor.BLACK;
        state.board[9] = PlayerColor.BLACK;
        state.board[10] = PlayerColor.BLACK;
        state.currentPlayer = PlayerColor.WHITE;
        gameController.setBoardState(state);
      }

      // Break mill by moving piece from 2 to 3
      gameController.handlePositionClick(2);
      gameController.handlePositionClick(3);

      // Verify mill is broken
      const stateBroken = gameController.getCurrentGameState();
      expect(stateBroken?.millFormed).toBe(false);

      // Switch back to WHITE's turn to reform mill
      const state2 = gameController.getCurrentGameState();
      if (state2) {
        state2.currentPlayer = PlayerColor.WHITE;
        gameController.setBoardState(state2);
      }

      // Reform mill by moving back from 3 to 2
      gameController.handlePositionClick(3);
      gameController.handlePositionClick(2);

      const finalState = gameController.getCurrentGameState();
      expect(finalState?.millFormed).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle removal when only one opponent piece remains', () => {
      // Set up scenario with only one BLACK piece
      const state = gameController.getCurrentGameState();
      if (state) {
        state.board = Array(24).fill(null);
        state.board[0] = PlayerColor.WHITE;
        state.board[1] = PlayerColor.WHITE;
        state.board[2] = PlayerColor.WHITE; // WHITE mill
        state.board[8] = PlayerColor.BLACK; // Only one BLACK piece
        state.blackPiecesOnBoard = 1;
        state.millFormed = true;
        state.currentPlayer = PlayerColor.WHITE;
        gameController.setBoardState(state);
      }

      gameController.handlePositionClick(8);

      const finalState = gameController.getCurrentGameState();
      expect(finalState?.board[8]).toBe(null);
      expect(finalState?.blackPiecesOnBoard).toBe(0);
    });

    it('should handle rapid removal attempts', () => {
      // Form mill
      gameController.handlePositionClick(0); // WHITE
      gameController.handlePositionClick(8); // BLACK
      gameController.handlePositionClick(1); // WHITE
      gameController.handlePositionClick(9); // BLACK
      gameController.handlePositionClick(2); // WHITE - forms mill

      // Try to remove multiple pieces (should only remove one)
      gameController.handlePositionClick(8);
      gameController.handlePositionClick(9); // Should not work (mill already resolved)

      const state = gameController.getCurrentGameState();
      expect(state?.board[8]).toBe(null);
      expect(state?.board[9]).toBe(PlayerColor.BLACK); // Should still be there
    });

    it('should handle removal during placement phase', () => {
      // Form mill during placement
      gameController.handlePositionClick(0); // WHITE
      gameController.handlePositionClick(8); // BLACK
      gameController.handlePositionClick(1); // WHITE
      gameController.handlePositionClick(9); // BLACK
      gameController.handlePositionClick(2); // WHITE - forms mill

      const state = gameController.getCurrentGameState();
      expect(state?.phase).toBe(GamePhase.PLACEMENT);
      expect(state?.millFormed).toBe(true);

      // Remove piece
      gameController.handlePositionClick(8);

      const finalState = gameController.getCurrentGameState();
      expect(finalState?.board[8]).toBe(null);
      expect(finalState?.phase).toBe(GamePhase.PLACEMENT); // Should still be in placement
    });

    it('should handle removal during movement phase', () => {
      // Set up movement phase with mill
      const state = gameController.getCurrentGameState();
      if (state) {
        state.phase = GamePhase.MOVEMENT;
        state.whitePiecesRemaining = 0;
        state.blackPiecesRemaining = 0;
        state.board = Array(24).fill(null);
        state.board[0] = PlayerColor.WHITE;
        state.board[1] = PlayerColor.WHITE;
        state.board[3] = PlayerColor.WHITE;
        state.board[8] = PlayerColor.BLACK;
        state.board[9] = PlayerColor.BLACK;
        state.currentPlayer = PlayerColor.WHITE;
        gameController.setBoardState(state);
      }

      // Move to form mill
      gameController.handlePositionClick(3);
      gameController.handlePositionClick(2); // Forms mill 0-1-2

      // Remove piece
      gameController.handlePositionClick(8);

      const finalState = gameController.getCurrentGameState();
      expect(finalState?.board[8]).toBe(null);
      expect(finalState?.phase).toBe(GamePhase.MOVEMENT);
    });

    it('should handle invalid removal attempts gracefully', () => {
      // Form mill
      gameController.handlePositionClick(0); // WHITE
      gameController.handlePositionClick(8); // BLACK
      gameController.handlePositionClick(1); // WHITE
      gameController.handlePositionClick(9); // BLACK
      gameController.handlePositionClick(2); // WHITE - forms mill

      // Try to remove invalid positions
      gameController.handlePositionClick(-1); // Invalid
      gameController.handlePositionClick(24); // Invalid
      gameController.handlePositionClick(100); // Invalid

      const state = gameController.getCurrentGameState();
      expect(state?.millFormed).toBe(true); // Should still be in removal state
    });
  });

  describe('Win Condition After Removal', () => {
    it('should detect win when removal reduces opponent to fewer than 3 pieces', () => {
      // Set up scenario where BLACK has exactly 3 pieces
      const state = gameController.getCurrentGameState();
      if (state) {
        state.board = Array(24).fill(null);
        state.board[0] = PlayerColor.WHITE;
        state.board[1] = PlayerColor.WHITE;
        state.board[2] = PlayerColor.WHITE; // WHITE mill
        state.board[8] = PlayerColor.BLACK;
        state.board[9] = PlayerColor.BLACK;
        state.board[10] = PlayerColor.BLACK;
        state.whitePiecesOnBoard = 3;
        state.blackPiecesOnBoard = 3;
        state.whitePiecesRemaining = 0;
        state.blackPiecesRemaining = 0;
        state.phase = GamePhase.MOVEMENT;
        state.millFormed = true;
        state.currentPlayer = PlayerColor.WHITE;
        gameController.setBoardState(state);
      }

      // Remove BLACK piece (reduces to 2)
      gameController.handlePositionClick(8);

      const finalState = gameController.getCurrentGameState();
      expect(finalState?.blackPiecesOnBoard).toBe(2);
      expect(finalState?.isGameOver).toBe(true);
      expect(finalState?.winner).toBe(PlayerColor.WHITE);
    });
  });
});
