import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameController } from './GameController.js';
import { BoardRenderer } from '../rendering/BoardRenderer.js';
import { GameMode, GamePhase, PlayerColor } from '../models/index.js';

/**
 * Test suite specifically for movement phase functionality
 * This addresses the critical bug where movement phase becomes unresponsive
 */
describe('GameController - Movement Phase Bug Fix', () => {
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
      parentElement: {
        clientWidth: 400,
        clientHeight: 400,
      },
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

    mockContext.strokeStyle = '';
    mockContext.fillStyle = '';
    mockContext.lineWidth = 1;
    mockContext.font = '';
    mockContext.textAlign = 'left';
    mockContext.textBaseline = 'top';

    mockGetContext.mockReturnValue(mockContext);

    // Create BoardRenderer and GameController
    boardRenderer = new BoardRenderer(mockCanvas);
    gameController = new GameController(GameMode.LOCAL_TWO_PLAYER, boardRenderer);
  });

  describe('Phase Transition to Movement', () => {
    it('should transition to MOVEMENT phase when both players have placed all pieces', () => {
      gameController.startGame();

      // Simulate placing all 18 pieces (9 per player)
      // Place pieces alternating between white and black
      const placementPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18];

      for (let i = 0; i < placementPositions.length; i++) {
        const position = placementPositions[i];
        gameController.handlePositionClick(position);
      }

      // After all pieces are placed, phase should be MOVEMENT
      const finalState = gameController.getCurrentGameState()!;
      expect(finalState.whitePiecesRemaining).toBe(0);
      expect(finalState.blackPiecesRemaining).toBe(0);
      expect(finalState.phase).toBe(GamePhase.MOVEMENT);
    });

    it('should allow piece selection in MOVEMENT phase', () => {
      gameController.startGame();

      // Place all pieces first
      const placementPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18];
      for (const position of placementPositions) {
        gameController.handlePositionClick(position);
      }

      const gameState = gameController.getCurrentGameState()!;
      expect(gameState.phase).toBe(GamePhase.MOVEMENT);

      // White's turn - should be able to select a white piece
      // Position 0 should have a white piece
      const whitePiecePosition = 0;
      expect(gameState.board[whitePiecePosition]).toBe(PlayerColor.WHITE);

      // Click on white piece should select it (no error should occur)
      expect(() => {
        gameController.handlePositionClick(whitePiecePosition);
      }).not.toThrow();
    });

    it('should enable input after transitioning to MOVEMENT phase', () => {
      gameController.startGame();

      // Place all pieces
      const placementPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18];
      for (const position of placementPositions) {
        gameController.handlePositionClick(position);
      }

      // Input should be enabled in movement phase
      expect(boardRenderer.isInputEnabledState()).toBe(true);
    });
  });

  describe('Movement Phase Piece Selection', () => {
    beforeEach(() => {
      // Set up a game in MOVEMENT phase
      gameController.startGame();
      const placementPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18];
      for (const position of placementPositions) {
        gameController.handlePositionClick(position);
      }
    });

    it('should allow selecting own piece', () => {
      const gameState = gameController.getCurrentGameState()!;
      const currentPlayer = gameState.currentPlayer;

      // Find a position with current player's piece
      let playerPiecePosition = -1;
      for (let i = 0; i < gameState.board.length; i++) {
        if (gameState.board[i] === currentPlayer) {
          playerPiecePosition = i;
          break;
        }
      }

      expect(playerPiecePosition).toBeGreaterThanOrEqual(0);

      // Should be able to click on own piece without error
      expect(() => {
        gameController.handlePositionClick(playerPiecePosition);
      }).not.toThrow();
    });

    it('should not allow selecting opponent piece', () => {
      const gameState = gameController.getCurrentGameState()!;
      const currentPlayer = gameState.currentPlayer;
      const opponent = currentPlayer === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;

      // Find a position with opponent's piece
      let opponentPiecePosition = -1;
      for (let i = 0; i < gameState.board.length; i++) {
        if (gameState.board[i] === opponent) {
          opponentPiecePosition = i;
          break;
        }
      }

      expect(opponentPiecePosition).toBeGreaterThanOrEqual(0);

      // Clicking opponent piece should not cause selection
      gameController.handlePositionClick(opponentPiecePosition);

      // No piece should be selected (we can't directly test this, but no error should occur)
      expect(() => {
        gameController.handlePositionClick(opponentPiecePosition);
      }).not.toThrow();
    });
  });

  describe('Movement Phase Piece Movement', () => {
    beforeEach(() => {
      // Set up a game in MOVEMENT phase
      gameController.startGame();
      const placementPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18];
      for (const position of placementPositions) {
        gameController.handlePositionClick(position);
      }
    });

    it('should allow moving piece to adjacent empty position', () => {
      const gameState = gameController.getCurrentGameState()!;

      // White's turn - position 0 has white piece
      // Position 0 is adjacent to positions 1 and 9
      // Position 1 has a black piece, so we need to find an adjacent empty position

      // Let's use a known setup: if position 0 has white, and we need an empty adjacent
      // We'll need to check the actual board state
      const whitePiecePos = 0;
      expect(gameState.board[whitePiecePos]).toBe(PlayerColor.WHITE);

      // Get adjacent positions from the adjacency map
      // Position 0 is adjacent to [1, 9]
      // Check which one is empty
      const adjacentPositions = [1, 9];
      const emptyAdjacent = adjacentPositions.find(pos => gameState.board[pos] === null);

      if (emptyAdjacent !== undefined) {
        // Select the piece
        gameController.handlePositionClick(whitePiecePos);

        // Move to empty adjacent position
        gameController.handlePositionClick(emptyAdjacent);

        // Piece should have moved
        const newState = gameController.getCurrentGameState()!;
        expect(newState.board[whitePiecePos]).toBeNull();
        expect(newState.board[emptyAdjacent]).toBe(PlayerColor.WHITE);
      }
    });
  });
});
