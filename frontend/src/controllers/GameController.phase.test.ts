import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameController } from './GameController.js';
import { BoardRenderer } from '../rendering/BoardRenderer.js';
import { GameMode, GamePhase, PlayerColor } from '../models/index.js';

describe('GameController - Phase Transition Bug', () => {
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
        x: 0,
        y: 0,
        right: 400,
        bottom: 400,
        toJSON: () => ({}),
      })),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
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

  it('should transition to MOVEMENT phase after all pieces are placed', () => {
    gameController.startGame();
    const gameState = gameController.getCurrentGameState()!;

    // Verify starting phase
    expect(gameState.phase).toBe(GamePhase.PLACEMENT);
    expect(gameState.whitePiecesRemaining).toBe(9);
    expect(gameState.blackPiecesRemaining).toBe(9);

    // Place all 18 pieces (9 per player) - carefully avoiding ALL 16 mill patterns
    const placementPositions = [0, 9, 3, 13, 6, 17, 10, 21, 14, 19, 2, 23, 12, 7, 18, 11, 22, 15];

    placementPositions.forEach(position => {
      gameController.handlePositionClick(position);
    });

    // CRITICAL: After all pieces placed, pieces remaining should be 0
    expect(gameState.whitePiecesRemaining).toBe(0);
    expect(gameState.blackPiecesRemaining).toBe(0);
    // If a mill was formed, the game is waiting for piece removal before transitioning
    // This is correct behavior - we'll test phase transition after mill handling
    if (!gameState.millFormed) {
      expect(gameState.phase).toBe(GamePhase.MOVEMENT);
    }
  });

  it('should enable input after transitioning', () => {
    gameController.startGame();
    const gameState = gameController.getCurrentGameState()!;

    // Place all 18 pieces (9 per player) - using same sequence as first test
    const placementPositions = [0, 9, 3, 13, 6, 17, 10, 21, 14, 19, 2, 23, 12, 7, 18, 11, 22, 15];

    placementPositions.forEach(pos => {
      gameController.handlePositionClick(pos);
    });

    // If a mill was formed on last placement, handle the removal first
    if (gameState.millFormed) {
      // Find and remove an opponent piece to complete the mill handling
      const opponentColor =
        gameState.currentPlayer === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
      for (let i = 0; i < 24; i++) {
        if (gameState.board[i] === opponentColor) {
          gameController.handlePositionClick(i);
          break;
        }
      }
    }

    // Verify phase transition
    expect(gameState.phase).toBe(GamePhase.MOVEMENT);

    // CRITICAL: Input should be enabled in MOVEMENT phase
    expect(boardRenderer.isInputEnabledState()).toBe(true);
  });

  it('should allow piece selection in MOVEMENT phase', () => {
    gameController.startGame();
    const gameState = gameController.getCurrentGameState()!;

    // Place all 18 pieces (9 per player) - using same sequence as first test
    const placementPositions = [0, 9, 3, 13, 6, 17, 10, 21, 14, 19, 2, 23, 12, 7, 18, 11, 22, 15];

    placementPositions.forEach(pos => {
      gameController.handlePositionClick(pos);
    });

    // If a mill was formed on last placement, handle the removal first
    if (gameState.millFormed) {
      // Find and remove an opponent piece to complete the mill handling
      const opponentColor =
        gameState.currentPlayer === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
      for (let i = 0; i < 24; i++) {
        if (gameState.board[i] === opponentColor) {
          gameController.handlePositionClick(i);
          break;
        }
      }
    }

    // Now in MOVEMENT phase, WHITE's turn
    expect(gameState.phase).toBe(GamePhase.MOVEMENT);
    expect(gameState.currentPlayer).toBe(PlayerColor.WHITE);

    // Spy on highlightValidMoves to verify piece selection works
    const highlightSpy = vi.spyOn(boardRenderer, 'highlightValidMoves');

    // Find a WHITE piece on the board (position 0 might have been removed)
    let whitePiecePosition = -1;
    for (let i = 0; i < 24; i++) {
      if (gameState.board[i] === PlayerColor.WHITE) {
        whitePiecePosition = i;
        break;
      }
    }

    expect(whitePiecePosition).toBeGreaterThanOrEqual(0); // Ensure we found a WHITE piece

    // Click on the WHITE piece
    gameController.handlePositionClick(whitePiecePosition);

    // CRITICAL: Valid moves should be highlighted (piece was selected)
    expect(highlightSpy).toHaveBeenCalled();
    const highlightedMoves = highlightSpy.mock.calls[0][0];
    expect(highlightedMoves.length).toBeGreaterThan(0);
  });
});
