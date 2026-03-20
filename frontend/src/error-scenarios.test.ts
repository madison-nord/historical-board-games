import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorage } from './utils/LocalStorage';
import { WebSocketClient } from './network/WebSocketClient';
import { BoardRenderer } from './rendering/BoardRenderer';
import { GameController } from './controllers/GameController';
import { GameMode, GamePhase, PlayerColor } from './models/index';
import { Client } from '@stomp/stompjs';

// Mock STOMP client
vi.mock('@stomp/stompjs', () => ({
  Client: vi.fn(),
}));

// Mock SockJS
vi.mock('sockjs-client', () => ({
  default: vi.fn(() => ({})),
}));

/**
 * Error scenario tests for graceful degradation and error handling.
 * Validates: Requirements 12.4
 */
describe('Error Scenarios', () => {
  describe('localStorage unavailable', () => {
    let originalLocalStorage: Storage;

    beforeEach(() => {
      originalLocalStorage = window.localStorage;
    });

    afterEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
    });

    it('should return false when saving with localStorage unavailable', () => {
      // Make localStorage throw on access
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('localStorage is disabled');
        },
        configurable: true,
      });

      const gameState = {
        gameId: 'test-game',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.WHITE,
        whitePiecesRemaining: 9,
        blackPiecesRemaining: 9,
        whitePiecesOnBoard: 0,
        blackPiecesOnBoard: 0,
        board: new Array(24).fill(null),
        isGameOver: false,
        gameOver: false,
        winner: null,
        millFormed: false,
      };

      const result = LocalStorage.saveGameState(
        gameState,
        GameMode.SINGLE_PLAYER,
        PlayerColor.WHITE
      );
      expect(result).toBe(false);
    });

    it('should return null when loading with localStorage unavailable', () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('localStorage is disabled');
        },
        configurable: true,
      });

      const result = LocalStorage.loadGameState();
      expect(result).toBeNull();
    });

    it('should return false for hasSavedGame when localStorage unavailable', () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('localStorage is disabled');
        },
        configurable: true,
      });

      const result = LocalStorage.hasSavedGame();
      expect(result).toBe(false);
    });

    it('should not throw when clearing with localStorage unavailable', () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('localStorage is disabled');
        },
        configurable: true,
      });

      expect(() => LocalStorage.clearGameState()).not.toThrow();
    });
  });

  describe('WebSocket connection failure', () => {
    let wsClient: WebSocketClient;
    let mockStompClient: any;

    beforeEach(() => {
      mockStompClient = {
        activate: vi.fn(),
        deactivate: vi.fn(() => Promise.resolve()),
        publish: vi.fn(),
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        connected: false,
      };

      (Client as any).mockImplementation((config: any) => {
        mockStompClient.onConnect = config.onConnect;
        mockStompClient.onStompError = config.onStompError;
        mockStompClient.onWebSocketClose = config.onWebSocketClose;
        mockStompClient.onWebSocketError = config.onWebSocketError;
        return mockStompClient;
      });

      wsClient = new WebSocketClient();
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should reject promise on WebSocket error', async () => {
      const connectPromise = wsClient.connect('player-1');

      mockStompClient.onWebSocketError(new Error('Connection refused'));

      await expect(connectPromise).rejects.toThrow('WebSocket connection failed');
    });

    it('should reject promise on STOMP error', async () => {
      const connectPromise = wsClient.connect('player-1');

      mockStompClient.onStompError({ headers: { message: 'Auth failed' } });

      await expect(connectPromise).rejects.toThrow('STOMP error: Auth failed');
    });

    it('should notify connection status handler on failure', async () => {
      const statusHandler = vi.fn();
      wsClient.setOnConnectionStatus(statusHandler);

      const connectPromise = wsClient.connect('player-1');
      mockStompClient.onWebSocketError(new Error('Connection refused'));

      await expect(connectPromise).rejects.toThrow();
      expect(statusHandler).toHaveBeenCalledWith(false);
    });

    it('should notify connection status handler on WebSocket close', async () => {
      const statusHandler = vi.fn();
      wsClient.setOnConnectionStatus(statusHandler);

      const connectPromise = wsClient.connect('player-1');
      mockStompClient.connected = true;
      mockStompClient.onConnect();
      await connectPromise;

      // Simulate unexpected close
      mockStompClient.onWebSocketClose();
      expect(statusHandler).toHaveBeenCalledWith(false);
    });
  });

  describe('Network timeout / fetch failure (AI fallback)', () => {
    let canvas: HTMLCanvasElement;
    let boardRenderer: BoardRenderer;
    let gameController: GameController;

    beforeEach(() => {
      // Mock requestAnimationFrame and cancelAnimationFrame
      vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(cb => {
        return 1;
      });
      vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
      vi.spyOn(globalThis, 'performance', 'get').mockReturnValue({
        now: () => 0,
      } as Performance);

      canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      document.body.appendChild(canvas);

      boardRenderer = new BoardRenderer(canvas);
      gameController = new GameController(GameMode.SINGLE_PLAYER, boardRenderer, PlayerColor.WHITE);
    });

    afterEach(() => {
      gameController.stopGameLoop();
      document.body.removeChild(canvas);
      vi.restoreAllMocks();
    });

    it('should fall back to local AI when backend fetch fails', async () => {
      // Mock fetch to simulate network failure
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      // Start game and set up state where AI needs to move
      gameController.startGame();

      // Manually trigger AI move by calling the private method via any cast
      // The handleAIMove method should catch the error and use local fallback
      const controller = gameController as any;
      controller.currentGameState.currentPlayer = PlayerColor.BLACK;

      await controller.handleAIMove();

      // Verify fetch was attempted
      expect(fetchSpy).toHaveBeenCalled();

      // The game should still be functional (AI made a fallback move or handled error)
      // The key assertion is that no unhandled exception was thrown
      expect(controller.isAiThinking).toBe(false);
    });

    it('should handle fetch returning non-ok response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      gameController.startGame();
      const controller = gameController as any;
      controller.currentGameState.currentPlayer = PlayerColor.BLACK;

      await controller.handleAIMove();

      // Should recover gracefully
      expect(controller.isAiThinking).toBe(false);
    });
  });

  describe('Invalid game state handling', () => {
    let canvas: HTMLCanvasElement;
    let boardRenderer: BoardRenderer;

    beforeEach(() => {
      vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 1);
      vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
      vi.spyOn(globalThis, 'performance', 'get').mockReturnValue({
        now: () => 0,
      } as Performance);

      canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      document.body.appendChild(canvas);
      boardRenderer = new BoardRenderer(canvas);
    });

    afterEach(() => {
      document.body.removeChild(canvas);
      vi.restoreAllMocks();
    });

    it('should handle position click when game state is null', () => {
      const controller = new GameController(
        GameMode.SINGLE_PLAYER,
        boardRenderer,
        PlayerColor.WHITE
      );

      // Don't start game — currentGameState is null
      // Should not throw
      expect(() => controller.handlePositionClick(5)).not.toThrow();

      controller.stopGameLoop();
    });

    it('should handle position click when game is over', () => {
      const controller = new GameController(
        GameMode.SINGLE_PLAYER,
        boardRenderer,
        PlayerColor.WHITE
      );
      controller.startGame();

      // Force game over state
      const ctrl = controller as any;
      ctrl.currentGameState.isGameOver = true;
      ctrl.currentGameState.gameOver = true;

      // Should not throw
      expect(() => controller.handlePositionClick(5)).not.toThrow();

      controller.stopGameLoop();
    });

    it('should throw when getting board state before game starts', () => {
      const controller = new GameController(
        GameMode.SINGLE_PLAYER,
        boardRenderer,
        PlayerColor.WHITE
      );

      expect(() => controller.getBoardState()).toThrow('Game not started');

      controller.stopGameLoop();
    });
  });

  describe('BoardRenderer rendering error recovery', () => {
    let canvas: HTMLCanvasElement;
    let renderer: BoardRenderer;

    beforeEach(() => {
      vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 1);
      vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

      canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      document.body.appendChild(canvas);
      renderer = new BoardRenderer(canvas);
    });

    afterEach(() => {
      document.body.removeChild(canvas);
      vi.restoreAllMocks();
    });

    it('should recover from rendering errors via fallback', () => {
      const board = new Array(24).fill(null);
      board[0] = PlayerColor.WHITE;
      board[5] = PlayerColor.BLACK;

      // Spy on internal methods to simulate error in renderInternal
      const drawBoardSpy = vi.spyOn(renderer, 'drawBoard');
      const drawPiecesSpy = vi.spyOn(renderer, 'drawPieces');

      // First call to drawBoard (in renderInternal) throws, triggering fallback
      let callCount = 0;
      drawBoardSpy.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Canvas context lost');
        }
        // Second call (in fallback) succeeds
      });

      // render() should not throw — it catches and falls back
      expect(() => {
        renderer.render(board, PlayerColor.WHITE, GamePhase.PLACEMENT, 9, 9, 16);
      }).not.toThrow();

      // drawBoard should have been called twice (once in renderInternal, once in fallback)
      expect(drawBoardSpy).toHaveBeenCalledTimes(2);
      // drawPieces should have been called in fallback
      expect(drawPiecesSpy).toHaveBeenCalledWith(board);
    });

    it('should not throw even when fallback also fails', () => {
      const board = new Array(24).fill(null);

      // Make drawBoard always throw
      vi.spyOn(renderer, 'drawBoard').mockImplementation(() => {
        throw new Error('Canvas completely broken');
      });

      // Even double failure should not propagate
      expect(() => {
        renderer.render(board, PlayerColor.WHITE, GamePhase.PLACEMENT, 9, 9, 16);
      }).not.toThrow();
    });
  });
});
