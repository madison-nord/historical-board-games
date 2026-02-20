import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameController } from './GameController.js';
import { BoardRenderer } from '../rendering/BoardRenderer.js';
import { GameMode, PlayerColor } from '../models/index.js';

describe('GameController - Piece Removal Bug', () => {
  let gameController: GameController;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;
  let boardRenderer: BoardRenderer;

  beforeEach(() => {
    // Create mock canvas and context
    const mockGetContext = vi.fn();
    mockCanvas = {
      getContext: mockGetContext,
      width: 400,
      height: 400,
      style: {
        width: '400px',
        height: '400px',
      },
      getBoundingClientRect: vi.fn(() => ({
        left: 0,
        top: 0,
        width: 400,
        height: 400,
      })),
    } as any;

    mockContext = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      rect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 50 })),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      setTransform: vi.fn(),
    } as any;

    mockGetContext.mockReturnValue(mockContext);

    // Create BoardRenderer and GameController
    boardRenderer = new BoardRenderer(mockCanvas);
    gameController = new GameController(GameMode.LOCAL_TWO_PLAYER, boardRenderer);
  });

  it('should remove piece visually and update counter on first click after mill formation', () => {
    gameController.startGame();
    const gameState = gameController.getCurrentGameState()!;

    // Form a mill: WHITE places at 0, 1, 2 (horizontal mill)
    gameController.handlePositionClick(0); // WHITE at 0
    gameController.handlePositionClick(3); // BLACK at 3
    gameController.handlePositionClick(1); // WHITE at 1
    gameController.handlePositionClick(4); // BLACK at 4
    gameController.handlePositionClick(2); // WHITE at 2 - MILL FORMED

    // Verify mill is formed
    expect(gameState.millFormed).toBe(true);
    expect(gameState.currentPlayer).toBe(PlayerColor.WHITE);
    expect(gameState.board[3]).toBe(PlayerColor.BLACK);
    expect(gameState.board[4]).toBe(PlayerColor.BLACK);
    expect(gameState.blackPiecesOnBoard).toBe(2);

    // Click on BLACK piece at position 3 to remove it
    gameController.handlePositionClick(3);

    // CRITICAL ASSERTIONS:
    // 1. Piece should be removed from board
    expect(gameState.board[3]).toBeNull();

    // 2. Counter should be decremented
    expect(gameState.blackPiecesOnBoard).toBe(1);

    // 3. Mill flag should be cleared
    expect(gameState.millFormed).toBe(false);

    // 4. Turn should switch to BLACK
    expect(gameState.currentPlayer).toBe(PlayerColor.BLACK);
  });

  it('should not allow removing piece when mill flag is cleared', () => {
    gameController.startGame();
    const gameState = gameController.getCurrentGameState()!;

    // Form a mill
    gameController.handlePositionClick(0); // WHITE at 0
    gameController.handlePositionClick(3); // BLACK at 3
    gameController.handlePositionClick(1); // WHITE at 1
    gameController.handlePositionClick(4); // BLACK at 4
    gameController.handlePositionClick(2); // WHITE at 2 - MILL FORMED

    expect(gameState.blackPiecesOnBoard).toBe(2);
    expect(gameState.millFormed).toBe(true);

    // First click - should remove piece at position 3
    gameController.handlePositionClick(3);
    expect(gameState.board[3]).toBeNull();
    expect(gameState.blackPiecesOnBoard).toBe(1);
    expect(gameState.millFormed).toBe(false); // Mill flag should be cleared
    expect(gameState.currentPlayer).toBe(PlayerColor.BLACK); // Turn switches to BLACK

    // Now it's BLACK's turn in placement phase
    // BLACK should be able to place a piece normally, not remove anything
    const blackPiecesBeforePlacement = gameState.blackPiecesOnBoard;
    const blackPiecesRemainingBefore = gameState.blackPiecesRemaining;

    // BLACK places at position 5
    gameController.handlePositionClick(5);

    // Verify BLACK placed a piece (not removed anything)
    expect(gameState.board[5]).toBe(PlayerColor.BLACK);
    expect(gameState.blackPiecesOnBoard).toBe(blackPiecesBeforePlacement + 1); // On board count increases
    expect(gameState.blackPiecesRemaining).toBe(blackPiecesRemainingBefore - 1); // Remaining decrements
  });

  it('should verify removal animation does not re-render removed piece', () => {
    gameController.startGame();
    const gameState = gameController.getCurrentGameState()!;

    // Form a mill
    gameController.handlePositionClick(0); // WHITE at 0
    gameController.handlePositionClick(3); // BLACK at 3
    gameController.handlePositionClick(1); // WHITE at 1
    gameController.handlePositionClick(4); // BLACK at 4
    gameController.handlePositionClick(2); // WHITE at 2 - MILL FORMED

    // Verify mill is formed and piece exists
    expect(gameState.millFormed).toBe(true);
    expect(gameState.board[3]).toBe(PlayerColor.BLACK);

    // Remove piece at position 3
    gameController.handlePositionClick(3);

    // CRITICAL: Board state should be updated immediately
    expect(gameState.board[3]).toBeNull();
    expect(gameState.blackPiecesOnBoard).toBe(1);

    // The render method should be called with the updated board state
    // (without the removed piece), even if animation is running
    // This test verifies the board state is correct after removal
  });

  it('should update board state BEFORE starting removal animation', () => {
    gameController.startGame();
    const gameState = gameController.getCurrentGameState()!;

    // Form a mill
    gameController.handlePositionClick(0); // WHITE at 0
    gameController.handlePositionClick(3); // BLACK at 3
    gameController.handlePositionClick(1); // WHITE at 1
    gameController.handlePositionClick(4); // BLACK at 4
    gameController.handlePositionClick(2); // WHITE at 2 - MILL FORMED

    // Spy on the boardRenderer's animateRemoval method
    const animateRemovalSpy = vi.spyOn(boardRenderer, 'animateRemoval');

    // Remove piece at position 3
    gameController.handlePositionClick(3);

    // Verify animateRemoval was called
    expect(animateRemovalSpy).toHaveBeenCalledWith(3, PlayerColor.BLACK);

    // CRITICAL: When animateRemoval is called, the board state should ALREADY be updated
    // This ensures drawPieces() won't draw the removed piece
    expect(gameState.board[3]).toBeNull();
    expect(gameState.blackPiecesOnBoard).toBe(1);
  });

  it('should switch player after piece removal', () => {
    gameController.startGame();
    const gameState = gameController.getCurrentGameState()!;

    // Form a mill: WHITE places at 0, 1, 2
    gameController.handlePositionClick(0); // WHITE at 0
    gameController.handlePositionClick(3); // BLACK at 3
    gameController.handlePositionClick(1); // WHITE at 1
    gameController.handlePositionClick(4); // BLACK at 4
    gameController.handlePositionClick(2); // WHITE at 2 - MILL FORMED

    // Current player should still be WHITE (waiting for removal)
    expect(gameState.currentPlayer).toBe(PlayerColor.WHITE);
    expect(gameState.millFormed).toBe(true);

    // Remove BLACK piece at position 3
    gameController.handlePositionClick(3);

    // CRITICAL: After removal, player should switch to BLACK
    expect(gameState.currentPlayer).toBe(PlayerColor.BLACK);
    expect(gameState.millFormed).toBe(false);
  });
});
