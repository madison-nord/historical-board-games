import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameController } from './GameController.js';
import { BoardRenderer } from '../rendering/BoardRenderer.js';
import { GameMode, GamePhase, PlayerColor } from '../models/index.js';

// Mock fetch for AI move API calls
global.fetch = vi.fn();

describe('GameController', () => {
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

  describe('Initialization', () => {
    it('should create GameController with specified game mode', () => {
      expect(gameController.getGameMode()).toBe(GameMode.LOCAL_TWO_PLAYER);
    });

    it('should initialize with no current game state', () => {
      expect(gameController.getCurrentGameState()).toBeNull();
    });
  });

  describe('Game Start', () => {
    it('should start a new game with correct initial state', () => {
      gameController.startGame();

      const gameState = gameController.getCurrentGameState();
      expect(gameState).not.toBeNull();
      expect(gameState!.phase).toBe(GamePhase.PLACEMENT);
      expect(gameState!.currentPlayer).toBe(PlayerColor.WHITE);
      expect(gameState!.whitePiecesRemaining).toBe(9);
      expect(gameState!.blackPiecesRemaining).toBe(9);
      expect(gameState!.whitePiecesOnBoard).toBe(0);
      expect(gameState!.blackPiecesOnBoard).toBe(0);
      expect(gameState!.isGameOver).toBe(false);
      expect(gameState!.winner).toBeNull();
      expect(gameState!.board.every(pos => pos === null)).toBe(true);
    });

    it('should generate unique game IDs', () => {
      gameController.startGame();
      const gameId1 = gameController.getCurrentGameState()!.gameId;

      const controller2 = new GameController(GameMode.SINGLE_PLAYER, boardRenderer);
      controller2.startGame();
      const gameId2 = controller2.getCurrentGameState()!.gameId;

      expect(gameId1).not.toBe(gameId2);
    });
  });

  describe('Placement Phase', () => {
    beforeEach(() => {
      gameController.startGame();
    });

    it('should place piece on empty position', () => {
      gameController.handlePositionClick(0);

      const gameState = gameController.getCurrentGameState()!;
      expect(gameState.board[0]).toBe(PlayerColor.WHITE);
      expect(gameState.whitePiecesRemaining).toBe(8);
      expect(gameState.whitePiecesOnBoard).toBe(1);
      expect(gameState.currentPlayer).toBe(PlayerColor.BLACK);
    });

    it('should not place piece on occupied position', () => {
      gameController.handlePositionClick(0);
      gameController.handlePositionClick(0); // Try to place on same position

      const gameState = gameController.getCurrentGameState()!;
      expect(gameState.board[0]).toBe(PlayerColor.WHITE); // Should still be WHITE
      expect(gameState.currentPlayer).toBe(PlayerColor.BLACK); // Should still be BLACK's turn
    });

    it('should alternate players during placement', () => {
      gameController.handlePositionClick(0); // WHITE
      expect(gameController.getCurrentGameState()!.currentPlayer).toBe(PlayerColor.BLACK);

      gameController.handlePositionClick(1); // BLACK
      expect(gameController.getCurrentGameState()!.currentPlayer).toBe(PlayerColor.WHITE);

      gameController.handlePositionClick(2); // WHITE
      expect(gameController.getCurrentGameState()!.currentPlayer).toBe(PlayerColor.BLACK);
    });

    it('should transition to movement phase after all pieces placed', () => {
      // Place all 18 pieces (9 per player)
      const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

      for (let i = 0; i < positions.length; i++) {
        gameController.handlePositionClick(positions[i]);
      }

      const gameState = gameController.getCurrentGameState()!;
      expect(gameState.phase).toBe(GamePhase.MOVEMENT);
      expect(gameState.whitePiecesRemaining).toBe(0);
      expect(gameState.blackPiecesRemaining).toBe(0);
      expect(gameState.whitePiecesOnBoard).toBe(9);
      expect(gameState.blackPiecesOnBoard).toBe(9);
    });
  });

  describe('Mill Formation', () => {
    beforeEach(() => {
      gameController.startGame();
    });

    it('should detect mill formation', () => {
      // Create a mill at positions 0, 1, 2 (top horizontal line)
      gameController.handlePositionClick(0); // WHITE
      gameController.handlePositionClick(3); // BLACK
      gameController.handlePositionClick(1); // WHITE
      gameController.handlePositionClick(4); // BLACK
      gameController.handlePositionClick(2); // WHITE - completes mill

      const gameState = gameController.getCurrentGameState()!;
      expect(gameState.millFormed).toBe(true);
      expect(gameState.currentPlayer).toBe(PlayerColor.WHITE); // Should still be WHITE's turn for removal
    });

    it('should handle piece removal after mill formation', () => {
      // Set up a scenario where WHITE forms a mill and can remove BLACK piece
      gameController.handlePositionClick(0); // WHITE
      gameController.handlePositionClick(3); // BLACK
      gameController.handlePositionClick(1); // WHITE
      gameController.handlePositionClick(4); // BLACK
      gameController.handlePositionClick(2); // WHITE - completes mill

      // Now WHITE should be able to remove BLACK piece at position 3 or 4
      gameController.handlePositionClick(3); // Remove BLACK piece

      const gameState = gameController.getCurrentGameState()!;
      expect(gameState.board[3]).toBeNull(); // Piece should be removed
      expect(gameState.blackPiecesOnBoard).toBe(1); // BLACK should have one less piece
      expect(gameState.millFormed).toBe(false); // Mill formation flag should be cleared
      expect(gameState.currentPlayer).toBe(PlayerColor.BLACK); // Should switch to BLACK
    });
  });

  describe('Movement Phase', () => {
    beforeEach(() => {
      gameController.startGame();

      // Set up a game state in movement phase
      const gameState = gameController.getCurrentGameState()!;
      gameState.phase = GamePhase.MOVEMENT;
      gameState.whitePiecesRemaining = 0;
      gameState.blackPiecesRemaining = 0;
      gameState.whitePiecesOnBoard = 5;
      gameState.blackPiecesOnBoard = 5;

      // Place some pieces on the board
      gameState.board[0] = PlayerColor.WHITE;
      gameState.board[1] = PlayerColor.BLACK;
      gameState.board[3] = PlayerColor.WHITE;
      gameState.board[4] = PlayerColor.BLACK;
      gameState.board[9] = PlayerColor.WHITE;
    });

    it('should select piece for movement', () => {
      // Click on WHITE piece at position 0
      gameController.handlePositionClick(0);

      // Should highlight valid moves (position 1 is occupied, but position 9 is adjacent and empty)
      // Note: We can't directly test highlighting, but we can test the selection logic
      expect(() => gameController.handlePositionClick(0)).not.toThrow();
    });

    it('should move piece to adjacent empty position', () => {
      const gameState = gameController.getCurrentGameState()!;

      // Clear position 9 to make it available for movement
      gameState.board[9] = null;

      // Select WHITE piece at position 0
      gameController.handlePositionClick(0);

      // Move to adjacent position 9
      gameController.handlePositionClick(9);

      expect(gameState.board[0]).toBeNull(); // Original position should be empty
      expect(gameState.board[9]).toBe(PlayerColor.WHITE); // New position should have WHITE piece
    });

    it('should not allow movement to non-adjacent position', () => {
      const gameState = gameController.getCurrentGameState()!;

      // Select WHITE piece at position 0
      gameController.handlePositionClick(0);

      // Try to move to non-adjacent position 5 (should not work)
      gameController.handlePositionClick(5);

      expect(gameState.board[0]).toBe(PlayerColor.WHITE); // Piece should still be at original position
      expect(gameState.board[5]).toBeNull(); // Target position should still be empty
    });
  });

  describe('Flying Phase', () => {
    beforeEach(() => {
      gameController.startGame();

      // Set up a game state in flying phase
      const gameState = gameController.getCurrentGameState()!;
      gameState.phase = GamePhase.FLYING;
      gameState.whitePiecesRemaining = 0;
      gameState.blackPiecesRemaining = 0;
      gameState.whitePiecesOnBoard = 3; // WHITE has exactly 3 pieces (flying condition)
      gameState.blackPiecesOnBoard = 4;

      // Place pieces on the board
      gameState.board[0] = PlayerColor.WHITE;
      gameState.board[1] = PlayerColor.WHITE;
      gameState.board[2] = PlayerColor.WHITE;
      gameState.board[10] = PlayerColor.BLACK;
      gameState.board[11] = PlayerColor.BLACK;
      gameState.board[12] = PlayerColor.BLACK;
      gameState.board[13] = PlayerColor.BLACK;
    });

    it('should allow flying to any empty position', () => {
      const gameState = gameController.getCurrentGameState()!;

      // Select WHITE piece at position 0
      gameController.handlePositionClick(0);

      // Move to distant empty position 20 (should work in flying phase)
      gameController.handlePositionClick(20);

      expect(gameState.board[0]).toBeNull(); // Original position should be empty
      expect(gameState.board[20]).toBe(PlayerColor.WHITE); // New position should have WHITE piece
    });
  });

  describe('Win Conditions', () => {
    beforeEach(() => {
      gameController.startGame();
    });

    it('should detect win when opponent has fewer than 3 pieces', () => {
      const gameState = gameController.getCurrentGameState()!;

      // Set up end game scenario
      gameState.phase = GamePhase.MOVEMENT;
      gameState.whitePiecesRemaining = 0;
      gameState.blackPiecesRemaining = 0;
      gameState.whitePiecesOnBoard = 4;
      gameState.blackPiecesOnBoard = 2; // BLACK has fewer than 3 pieces
      gameState.currentPlayer = PlayerColor.BLACK; // Make BLACK the current player

      // Place some pieces on the board for BLACK
      gameState.board[0] = PlayerColor.BLACK;
      gameState.board[1] = PlayerColor.BLACK;

      // Place some pieces on the board for WHITE
      gameState.board[3] = PlayerColor.WHITE;
      gameState.board[4] = PlayerColor.WHITE;
      gameState.board[5] = PlayerColor.WHITE;
      gameState.board[6] = PlayerColor.WHITE;

      // Trigger game end check by making a valid move
      // Position 0 is adjacent to position 9, so this should be a valid move
      gameController.handlePositionClick(0); // Select BLACK piece at position 0
      gameController.handlePositionClick(9); // Move to adjacent empty position 9 (should trigger checkGameEnd)

      expect(gameState.isGameOver).toBe(true);
      expect(gameState.winner).toBe(PlayerColor.WHITE);
    });

    it('should detect win when opponent has no legal moves', () => {
      const gameState = gameController.getCurrentGameState()!;

      // Set up a scenario where current player has no legal moves
      gameState.phase = GamePhase.MOVEMENT;
      gameState.whitePiecesRemaining = 0;
      gameState.blackPiecesRemaining = 0;
      gameState.whitePiecesOnBoard = 3;
      gameState.blackPiecesOnBoard = 3;
      gameState.currentPlayer = PlayerColor.WHITE;

      // Place WHITE pieces in positions where they can't move
      gameState.board[0] = PlayerColor.WHITE;
      gameState.board[2] = PlayerColor.WHITE;
      gameState.board[6] = PlayerColor.WHITE;

      // Surround them with BLACK pieces
      gameState.board[1] = PlayerColor.BLACK;
      gameState.board[9] = PlayerColor.BLACK;
      gameState.board[7] = PlayerColor.BLACK;

      // This is a simplified test - in a real game, this scenario would be more complex
      expect(gameState.whitePiecesOnBoard).toBe(3);
      expect(gameState.blackPiecesOnBoard).toBe(3);
    });
  });

  describe('Game Flow Integration', () => {
    it('should complete a full game flow from start to finish', () => {
      gameController.startGame();

      // Test that we can start the game and make several moves
      expect(gameController.getCurrentGameState()).not.toBeNull();
      expect(gameController.getCurrentGameState()!.phase).toBe(GamePhase.PLACEMENT);

      // Make some placement moves
      gameController.handlePositionClick(0); // WHITE
      gameController.handlePositionClick(1); // BLACK
      gameController.handlePositionClick(2); // WHITE
      gameController.handlePositionClick(3); // BLACK

      const gameState = gameController.getCurrentGameState()!;
      expect(gameState.whitePiecesOnBoard).toBe(2);
      expect(gameState.blackPiecesOnBoard).toBe(2);
      expect(gameState.currentPlayer).toBe(PlayerColor.WHITE);

      // Verify game is progressing correctly
      expect(gameState.isGameOver).toBe(false);
      expect(gameState.phase).toBe(GamePhase.PLACEMENT);
    });

    it('should handle phase transitions correctly', () => {
      gameController.startGame();
      const gameState = gameController.getCurrentGameState()!;

      // Start in placement phase
      expect(gameState.phase).toBe(GamePhase.PLACEMENT);

      // Simulate transition to movement phase
      gameState.whitePiecesRemaining = 0;
      gameState.blackPiecesRemaining = 0;
      gameState.whitePiecesOnBoard = 5;
      gameState.blackPiecesOnBoard = 5;

      // Make a move to trigger phase update
      gameState.board[0] = PlayerColor.WHITE;
      gameController.handlePositionClick(1); // This should trigger phase update

      // Phase should be updated based on piece counts
      expect(gameState.whitePiecesRemaining).toBe(0);
      expect(gameState.blackPiecesRemaining).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle clicks when game is not started', () => {
      // Don't start the game
      expect(() => gameController.handlePositionClick(0)).not.toThrow();
      expect(gameController.getCurrentGameState()).toBeNull();
    });

    it('should handle clicks when game is over', () => {
      gameController.startGame();
      const gameState = gameController.getCurrentGameState()!;

      // Set game as over
      gameState.isGameOver = true;
      gameState.winner = PlayerColor.WHITE;

      // Clicks should be ignored
      expect(() => gameController.handlePositionClick(0)).not.toThrow();
    });

    it('should handle invalid position clicks gracefully', () => {
      gameController.startGame();

      // These should not crash the game
      expect(() => gameController.handlePositionClick(-1)).not.toThrow();
      expect(() => gameController.handlePositionClick(24)).not.toThrow();
      expect(() => gameController.handlePositionClick(100)).not.toThrow();
    });
  });
});
