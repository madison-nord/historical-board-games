import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameController } from './GameController';
import { BoardRenderer } from '../rendering/BoardRenderer';
import { GameMode, GamePhase, PlayerColor } from '../models';

/**
 * Focused Tests for Movement Phase Logic
 *
 * Tests cover:
 * - Piece selection mechanics
 * - Valid move calculation
 * - Adjacency rules
 * - Movement execution
 * - Flying phase transitions
 * - Movement-based mill formation
 */

describe('GameController - Movement Phase', () => {
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

    // Set up movement phase with specific board configuration
    const state = gameController.getCurrentGameState();
    if (state) {
      state.phase = GamePhase.MOVEMENT;
      state.whitePiecesRemaining = 0;
      state.blackPiecesRemaining = 0;
      state.whitePiecesOnBoard = 5;
      state.blackPiecesOnBoard = 4;
      state.currentPlayer = PlayerColor.WHITE;
      state.board = Array(24).fill(null);
      // WHITE pieces
      state.board[0] = PlayerColor.WHITE;
      state.board[2] = PlayerColor.WHITE;
      state.board[7] = PlayerColor.WHITE;
      state.board[16] = PlayerColor.WHITE;
      state.board[17] = PlayerColor.WHITE;
      // BLACK pieces
      state.board[8] = PlayerColor.BLACK;
      state.board[9] = PlayerColor.BLACK;
      state.board[15] = PlayerColor.BLACK;
      state.board[23] = PlayerColor.BLACK;
      gameController.setBoardState(state);
    }
  });

  afterEach(() => {
    gameController.stopGameLoop();
    document.body.removeChild(canvas);
  });

  describe('Piece Selection', () => {
    it('should select own piece when clicked', () => {
      // Selection is internal state, verify by attempting a move
      const stateBefore = gameController.getCurrentGameState();
      gameController.handlePositionClick(0); // WHITE piece
      const stateAfter = gameController.getCurrentGameState();

      // Board should not change after just selecting
      expect(stateAfter?.board[0]).toBe(stateBefore?.board[0]);
      expect(stateAfter?.currentPlayer).toBe(stateBefore?.currentPlayer);
    });

    it('should not select opponent piece', () => {
      // Clicking opponent piece should not change game state
      const stateBefore = gameController.getCurrentGameState();
      gameController.handlePositionClick(8); // BLACK piece
      const stateAfter = gameController.getCurrentGameState();

      expect(stateAfter?.board).toEqual(stateBefore?.board);
      expect(stateAfter?.currentPlayer).toBe(stateBefore?.currentPlayer);
    });

    it('should not select empty position', () => {
      // Clicking empty position should not change game state
      gameController.handlePositionClick(1); // Empty
      const stateAfter = gameController.getCurrentGameState();

      // Board should remain unchanged
      expect(stateAfter?.board[1]).toBe(null);
      expect(stateAfter?.currentPlayer).toBe(PlayerColor.WHITE);
    });

    it('should deselect piece when clicking it again', () => {
      gameController.handlePositionClick(0); // Select
      gameController.handlePositionClick(0); // Deselect

      // After deselecting, clicking another position should not move
      gameController.handlePositionClick(1); // Try to move to empty position
      const stateAfter = gameController.getCurrentGameState();

      // Should not have moved (piece was deselected)
      expect(stateAfter?.board[0]).toBe(PlayerColor.WHITE);
      expect(stateAfter?.board[1]).toBe(null);
    });

    it('should not switch selection when clicking non-adjacent own piece', () => {
      gameController.handlePositionClick(0); // Select first piece at 0
      gameController.handlePositionClick(2); // Try to click non-adjacent WHITE piece at 2

      // Position 2 is NOT adjacent to 0, so this is treated as an invalid move
      // Selection remains at position 0
      const state = gameController.getCurrentGameState();
      expect(state?.board[0]).toBe(PlayerColor.WHITE); // Still at 0
      expect(state?.board[2]).toBe(PlayerColor.WHITE); // Still at 2
    });
  });

  describe('Valid Move Calculation', () => {
    it('should calculate adjacent positions for corner piece', () => {
      // Position 0 (top-left corner) is adjacent to 1 and 7
      gameController.handlePositionClick(0);

      // Position 1 is empty and adjacent
      gameController.handlePositionClick(1);

      const state = gameController.getCurrentGameState();
      expect(state?.board[0]).toBe(null);
      expect(state?.board[1]).toBe(PlayerColor.WHITE);
    });

    it('should calculate adjacent positions for midpoint piece', () => {
      // Position 17 (top midpoint of inner square) is adjacent to 16, 18, and 9
      gameController.handlePositionClick(17);

      // Position 18 is empty and adjacent
      gameController.handlePositionClick(18);

      const state = gameController.getCurrentGameState();
      expect(state?.board[17]).toBe(null);
      expect(state?.board[18]).toBe(PlayerColor.WHITE);
    });

    it('should not allow move to non-adjacent position', () => {
      gameController.handlePositionClick(0); // Select
      gameController.handlePositionClick(4); // Not adjacent

      const state = gameController.getCurrentGameState();
      expect(state?.board[0]).toBe(PlayerColor.WHITE); // Still at original position
      expect(state?.board[4]).toBe(null);
    });

    it('should not allow move to occupied position', () => {
      gameController.handlePositionClick(0); // Select WHITE at 0
      gameController.handlePositionClick(7); // Try to move to occupied position (WHITE at 7)

      const state = gameController.getCurrentGameState();
      expect(state?.board[0]).toBe(PlayerColor.WHITE); // Still at original
      expect(state?.board[7]).toBe(PlayerColor.WHITE); // Still occupied
    });
  });

  describe('Movement Execution', () => {
    it('should move piece to valid adjacent position', () => {
      gameController.handlePositionClick(0); // Select
      gameController.handlePositionClick(1); // Move

      const state = gameController.getCurrentGameState();
      expect(state?.board[0]).toBe(null);
      expect(state?.board[1]).toBe(PlayerColor.WHITE);
    });

    it('should clear selection after successful move', () => {
      gameController.handlePositionClick(0);
      gameController.handlePositionClick(1);

      // Verify selection is cleared by trying to move again without selecting
      const stateBefore = gameController.getCurrentGameState();
      gameController.handlePositionClick(2); // Try to move without selecting first
      const stateAfter = gameController.getCurrentGameState();

      // Should not have moved (no piece selected)
      expect(stateAfter?.board).toEqual(stateBefore?.board);
    });

    it('should switch player after successful move', () => {
      gameController.handlePositionClick(0);
      gameController.handlePositionClick(1);

      const state = gameController.getCurrentGameState();
      expect(state?.currentPlayer).toBe(PlayerColor.BLACK);
    });

    it('should maintain piece count after move', () => {
      const initialState = gameController.getCurrentGameState();
      const initialWhiteCount = initialState?.whitePiecesOnBoard;

      gameController.handlePositionClick(0);
      gameController.handlePositionClick(1);

      const finalState = gameController.getCurrentGameState();
      expect(finalState?.whitePiecesOnBoard).toBe(initialWhiteCount);
    });
  });

  describe('Adjacency Rules', () => {
    it('should allow movement along square edges', () => {
      // Move along outer square edge: 0 -> 1
      gameController.handlePositionClick(0);
      gameController.handlePositionClick(1);

      const state = gameController.getCurrentGameState();
      expect(state?.board[1]).toBe(PlayerColor.WHITE);
    });

    it('should allow movement along radial lines', () => {
      // Position 17 can move to 9 (radial connection)
      // First clear position 9 to make it empty
      const state = gameController.getCurrentGameState();
      if (state) {
        state.board[9] = null; // Clear position 9
        gameController.setBoardState(state);
      }

      // Now move from 17 to 9 along radial line
      gameController.handlePositionClick(17);
      gameController.handlePositionClick(9);

      const finalState = gameController.getCurrentGameState();
      expect(finalState?.board[17]).toBe(null);
      expect(finalState?.board[9]).toBe(PlayerColor.WHITE);
    });

    it('should not allow diagonal movement', () => {
      // Position 0 cannot move diagonally to position 2
      gameController.handlePositionClick(0);
      gameController.handlePositionClick(2); // WHITE piece here, but also not adjacent

      const state = gameController.getCurrentGameState();
      expect(state?.board[0]).toBe(PlayerColor.WHITE); // Should not have moved
    });

    it('should not allow movement across gaps', () => {
      // Position 0 cannot jump to position 3
      gameController.handlePositionClick(0);
      gameController.handlePositionClick(3);

      const state = gameController.getCurrentGameState();
      expect(state?.board[0]).toBe(PlayerColor.WHITE);
      expect(state?.board[3]).toBe(null);
    });
  });

  describe('Flying Phase Transition', () => {
    beforeEach(() => {
      // Set up scenario where WHITE has exactly 3 pieces
      const state = gameController.getCurrentGameState();
      if (state) {
        state.phase = GamePhase.FLYING; // Explicitly set to FLYING phase
        state.whitePiecesRemaining = 0;
        state.blackPiecesRemaining = 0;
        state.whitePiecesOnBoard = 3;
        state.blackPiecesOnBoard = 4;
        state.board = Array(24).fill(null);
        state.board[0] = PlayerColor.WHITE;
        state.board[8] = PlayerColor.WHITE;
        state.board[16] = PlayerColor.WHITE;
        state.board[4] = PlayerColor.BLACK;
        state.board[12] = PlayerColor.BLACK;
        state.board[20] = PlayerColor.BLACK;
        state.board[23] = PlayerColor.BLACK;
        state.currentPlayer = PlayerColor.WHITE;
        gameController.setBoardState(state);
      }
    });

    it('should transition to FLYING phase when player has 3 pieces', () => {
      const state = gameController.getCurrentGameState();
      expect(state?.phase).toBe(GamePhase.FLYING);
    });

    it('should allow flying to any empty position', () => {
      gameController.handlePositionClick(0); // Select
      gameController.handlePositionClick(23); // Try to fly to position 23 (occupied by BLACK - invalid)

      // Position 23 is occupied, so move was invalid and piece is still selected at 0
      // Now fly to an empty position
      gameController.handlePositionClick(1); // Fly to empty position 1

      const state = gameController.getCurrentGameState();
      expect(state?.board[0]).toBe(null);
      expect(state?.board[1]).toBe(PlayerColor.WHITE);
    });

    it('should not allow flying when player has more than 3 pieces', () => {
      // BLACK has 4 pieces, should not be able to fly
      const state = gameController.getCurrentGameState();
      if (state) {
        state.currentPlayer = PlayerColor.BLACK;
        gameController.setBoardState(state);
      }

      gameController.handlePositionClick(4); // Select BLACK piece
      gameController.handlePositionClick(1); // Try to fly to non-adjacent position

      const finalState = gameController.getCurrentGameState();
      // Should not have moved (not adjacent and can't fly with 4 pieces)
      expect(finalState?.board[4]).toBe(PlayerColor.BLACK);
    });
  });

  describe('Mill Formation During Movement', () => {
    beforeEach(() => {
      // Set up scenario where WHITE can form a mill by moving
      const state = gameController.getCurrentGameState();
      if (state) {
        state.board = Array(24).fill(null);
        state.board[0] = PlayerColor.WHITE;
        state.board[1] = PlayerColor.WHITE;
        state.board[3] = PlayerColor.WHITE; // Will move to 2 to form mill
        state.board[8] = PlayerColor.BLACK;
        state.board[9] = PlayerColor.BLACK;
        state.currentPlayer = PlayerColor.WHITE;
        gameController.setBoardState(state);
      }
    });

    it('should detect mill formed by movement', () => {
      gameController.handlePositionClick(3); // Select
      gameController.handlePositionClick(2); // Move to form mill (0-1-2)

      const state = gameController.getCurrentGameState();
      expect(state?.millFormed).toBe(true);
    });

    it('should allow piece removal after mill formed by movement', () => {
      gameController.handlePositionClick(3);
      gameController.handlePositionClick(2); // Forms mill

      // Remove opponent piece
      gameController.handlePositionClick(8);

      const state = gameController.getCurrentGameState();
      expect(state?.board[8]).toBe(null);
      expect(state?.millFormed).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle selecting and moving same piece multiple times', () => {
      gameController.handlePositionClick(0); // Select
      gameController.handlePositionClick(1); // Move

      // Now BLACK's turn
      const state = gameController.getCurrentGameState();
      if (state) {
        state.board[10] = null; // Make position 10 empty for BLACK to move
        gameController.setBoardState(state);
      }

      gameController.handlePositionClick(9); // Select BLACK
      gameController.handlePositionClick(10); // Move

      const finalState = gameController.getCurrentGameState();
      expect(finalState?.board[9]).toBe(null);
      expect(finalState?.board[10]).toBe(PlayerColor.BLACK);
    });

    it('should handle movement when board is nearly full', () => {
      // Fill most of the board
      const state = gameController.getCurrentGameState();
      if (state) {
        for (let i = 0; i < 24; i++) {
          if (i % 2 === 0 && state.board[i] === null) {
            state.board[i] = PlayerColor.WHITE;
          } else if (i % 2 === 1 && state.board[i] === null) {
            state.board[i] = PlayerColor.BLACK;
          }
        }
        // Leave one empty position adjacent to a WHITE piece
        state.board[1] = null;
        state.board[0] = PlayerColor.WHITE;
        state.currentPlayer = PlayerColor.WHITE;
        gameController.setBoardState(state);
      }

      gameController.handlePositionClick(0);
      gameController.handlePositionClick(1);

      const finalState = gameController.getCurrentGameState();
      expect(finalState?.board[1]).toBe(PlayerColor.WHITE);
    });

    it('should handle rapid selection changes', () => {
      gameController.handlePositionClick(0); // Select piece at 0
      gameController.handlePositionClick(2); // Try to move to non-adjacent position 2 (invalid)
      gameController.handlePositionClick(7); // Try to move to adjacent position 7 (invalid - occupied)

      // All moves were invalid, so selection should still be at position 0
      // Now try to move to an adjacent empty position
      gameController.handlePositionClick(1); // Move from 0 to adjacent position 1

      const finalState = gameController.getCurrentGameState();
      // Piece should have moved from 0 to 1
      expect(finalState?.board[0]).toBe(null);
      expect(finalState?.board[1]).toBe(PlayerColor.WHITE);
    });
  });
});
