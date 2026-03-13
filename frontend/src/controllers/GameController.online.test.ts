import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameController } from './GameController';
import { GameMode, PlayerColor, MoveType, GamePhase } from '../models';

// Mock BoardRenderer
vi.mock('../rendering/BoardRenderer');

// Mock WebSocketClient
vi.mock('../network/WebSocketClient');
vi.mock('../network/WebSocketClient');

describe('GameController - Online Multiplayer Integration', () => {
  let gameController: GameController;
  let mockBoardRenderer: any;
  let mockWebSocketClient: any;

  beforeEach(() => {
    // Create mock BoardRenderer
    mockBoardRenderer = {
      setOnPositionClick: vi.fn(),
      render: vi.fn(),
      setInputEnabled: vi.fn(),
      highlightValidMoves: vi.fn(),
      clearHighlights: vi.fn(),
      animatePlacement: vi.fn(),
      animateMovement: vi.fn(),
      animateRemoval: vi.fn(),
    };

    // Create mock WebSocketClient
    mockWebSocketClient = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      sendMove: vi.fn(),
      sendChatMessage: vi.fn(),
      joinMatchmaking: vi.fn(),
      leaveMatchmaking: vi.fn(),
      setOnGameStateUpdate: vi.fn(),
      setOnGameStart: vi.fn(),
      setOnGameEnd: vi.fn(),
      setOnChatMessage: vi.fn(),
      setOnOpponentDisconnected: vi.fn(),
      setOnOpponentReconnected: vi.fn(),
      setOnConnectionStatus: vi.fn(),
    };

    // Create GameController in online multiplayer mode
    gameController = new GameController(
      GameMode.ONLINE_MULTIPLAYER,
      mockBoardRenderer,
      PlayerColor.WHITE
    );

    // Set WebSocket client
    gameController.setWebSocketClient(mockWebSocketClient);
  });

  afterEach(() => {
    gameController.stopGameLoop();
    vi.clearAllMocks();
  });

  describe('WebSocket Integration', () => {
    it('should set up message handlers when WebSocket client is set', () => {
      expect(mockWebSocketClient.setOnGameStateUpdate).toHaveBeenCalledWith(expect.any(Function));
      expect(mockWebSocketClient.setOnGameStart).toHaveBeenCalledWith(expect.any(Function));
      expect(mockWebSocketClient.setOnGameEnd).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle game start message from server', () => {
      // Get the game start handler
      const gameStartHandler = mockWebSocketClient.setOnGameStart.mock.calls[0][0];

      // Simulate game start message
      const gameStartMessage = {
        gameId: 'test-game-123',
        playerColor: PlayerColor.WHITE,
        opponentId: 'opponent-456',
      };

      gameStartHandler(gameStartMessage);

      // Verify game state was initialized
      const gameState = gameController.getCurrentGameState();
      expect(gameState).not.toBeNull();
      expect(gameState?.gameId).toBe('test-game-123');
      expect(gameState?.phase).toBe(GamePhase.PLACEMENT);
      expect(gameState?.currentPlayer).toBe(PlayerColor.WHITE);
      expect(gameState?.isGameOver).toBe(false);

      // Verify input enabled for white player (goes first)
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(true);
    });

    it('should disable input when game starts and player is black', () => {
      // Get the game start handler
      const gameStartHandler = mockWebSocketClient.setOnGameStart.mock.calls[0][0];

      // Simulate game start message with black player
      const gameStartMessage = {
        gameId: 'test-game-123',
        playerColor: PlayerColor.BLACK,
        opponentId: 'opponent-456',
      };

      gameStartHandler(gameStartMessage);

      // Verify input disabled for black player (white goes first)
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('Move Handling in Online Mode', () => {
    beforeEach(() => {
      // Initialize game
      const gameStartHandler = mockWebSocketClient.setOnGameStart.mock.calls[0][0];
      gameStartHandler({
        gameId: 'test-game-123',
        playerColor: PlayerColor.WHITE,
        opponentId: 'opponent-456',
      });
    });

    it('should send move to server instead of applying locally', () => {
      // Simulate placement click
      const positionClickHandler = mockBoardRenderer.setOnPositionClick.mock.calls[0][0];
      positionClickHandler(0);

      // Verify move was sent to server
      expect(mockWebSocketClient.sendMove).toHaveBeenCalledWith({
        type: MoveType.PLACE,
        from: -1,
        to: 0,
        player: PlayerColor.WHITE,
        removed: -1,
      });

      // Verify input was disabled while waiting for server response
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(false);
    });

    it('should update game state when receiving state update from server', () => {
      // Get the game state update handler
      const stateUpdateHandler = mockWebSocketClient.setOnGameStateUpdate.mock.calls[0][0];

      // Simulate state update from server
      const stateUpdate = {
        gameId: 'test-game-123',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.BLACK,
        whitePiecesRemaining: 8,
        blackPiecesRemaining: 9,
        whitePiecesOnBoard: 1,
        blackPiecesOnBoard: 0,
        board: new Array(24).fill(null),
        isGameOver: false,
        winner: null,
        millFormed: false,
      };
      stateUpdate.board[0] = PlayerColor.WHITE;

      stateUpdateHandler(stateUpdate);

      // Verify game state was updated
      const gameState = gameController.getCurrentGameState();
      expect(gameState?.currentPlayer).toBe(PlayerColor.BLACK);
      expect(gameState?.whitePiecesRemaining).toBe(8);
      expect(gameState?.board[0]).toBe(PlayerColor.WHITE);

      // Verify input was disabled (not our turn)
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(false);
    });

    it('should enable input when it becomes our turn', () => {
      // Get the game state update handler
      const stateUpdateHandler = mockWebSocketClient.setOnGameStateUpdate.mock.calls[0][0];

      // Simulate opponent's move (now our turn)
      const stateUpdate = {
        gameId: 'test-game-123',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.WHITE, // Our turn
        whitePiecesRemaining: 8,
        blackPiecesRemaining: 8,
        whitePiecesOnBoard: 1,
        blackPiecesOnBoard: 1,
        board: new Array(24).fill(null),
        isGameOver: false,
        winner: null,
        millFormed: false,
      };
      stateUpdate.board[0] = PlayerColor.WHITE;
      stateUpdate.board[8] = PlayerColor.BLACK;

      stateUpdateHandler(stateUpdate);

      // Verify input was enabled (our turn)
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(true);
    });
  });

  describe('Game End Handling', () => {
    beforeEach(() => {
      // Initialize game
      const gameStartHandler = mockWebSocketClient.setOnGameStart.mock.calls[0][0];
      gameStartHandler({
        gameId: 'test-game-123',
        playerColor: PlayerColor.WHITE,
        opponentId: 'opponent-456',
      });
    });

    it('should handle game end message from server', () => {
      // Get the game end handler
      const gameEndHandler = mockWebSocketClient.setOnGameEnd.mock.calls[0][0];

      // Simulate game end message
      const gameEndMessage = {
        gameId: 'test-game-123',
        winner: PlayerColor.WHITE,
        reason: 'Opponent has fewer than 3 pieces',
      };

      gameEndHandler(gameEndMessage);

      // Verify game state was updated
      const gameState = gameController.getCurrentGameState();
      expect(gameState?.isGameOver).toBe(true);
      expect(gameState?.winner).toBe(PlayerColor.WHITE);

      // Verify input was disabled
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Initialize game
      const gameStartHandler = mockWebSocketClient.setOnGameStart.mock.calls[0][0];
      gameStartHandler({
        gameId: 'test-game-123',
        playerColor: PlayerColor.WHITE,
        opponentId: 'opponent-456',
      });
    });

    it('should handle WebSocket send error gracefully', () => {
      // Make sendMove throw an error
      mockWebSocketClient.sendMove.mockImplementation(() => {
        throw new Error('Connection lost');
      });

      // Simulate placement click
      const positionClickHandler = mockBoardRenderer.setOnPositionClick.mock.calls[0][0];
      positionClickHandler(0);

      // Verify input was re-enabled after error
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(true);
    });
  });

  describe('State Persistence', () => {
    it('should not save online multiplayer games to localStorage', () => {
      // Initialize game
      const gameStartHandler = mockWebSocketClient.setOnGameStart.mock.calls[0][0];
      gameStartHandler({
        gameId: 'test-game-123',
        playerColor: PlayerColor.WHITE,
        opponentId: 'opponent-456',
      });

      // Make a move
      const positionClickHandler = mockBoardRenderer.setOnPositionClick.mock.calls[0][0];
      positionClickHandler(0);

      // Verify no localStorage operations (online games should not be saved)
      // This is implicit - if saveGameState is called, it checks isOnlineMode() and returns early
      // We can verify by checking that hasSavedGame returns false
      expect(GameController.hasSavedGame()).toBe(false);
    });
  });

  describe('Complete Online Game Flow', () => {
    it('should handle complete game flow from start to finish', () => {
      // 1. Game start
      const gameStartHandler = mockWebSocketClient.setOnGameStart.mock.calls[0][0];
      gameStartHandler({
        gameId: 'test-game-123',
        playerColor: PlayerColor.WHITE,
        opponentId: 'opponent-456',
      });

      expect(gameController.getCurrentGameState()?.phase).toBe(GamePhase.PLACEMENT);
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(true);

      // 2. Player makes first move
      const positionClickHandler = mockBoardRenderer.setOnPositionClick.mock.calls[0][0];
      positionClickHandler(0);

      expect(mockWebSocketClient.sendMove).toHaveBeenCalledTimes(1);
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(false);

      // 3. Server responds with state update
      const stateUpdateHandler = mockWebSocketClient.setOnGameStateUpdate.mock.calls[0][0];
      stateUpdateHandler({
        gameId: 'test-game-123',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.BLACK,
        whitePiecesRemaining: 8,
        blackPiecesRemaining: 9,
        whitePiecesOnBoard: 1,
        blackPiecesOnBoard: 0,
        board: (() => {
          const board = new Array(24).fill(null);
          board[0] = PlayerColor.WHITE;
          return board;
        })(),
        isGameOver: false,
        winner: null,
        millFormed: false,
      });

      expect(gameController.getCurrentGameState()?.currentPlayer).toBe(PlayerColor.BLACK);
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(false);

      // 4. Opponent makes move (server sends update)
      stateUpdateHandler({
        gameId: 'test-game-123',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.WHITE,
        whitePiecesRemaining: 8,
        blackPiecesRemaining: 8,
        whitePiecesOnBoard: 1,
        blackPiecesOnBoard: 1,
        board: (() => {
          const board = new Array(24).fill(null);
          board[0] = PlayerColor.WHITE;
          board[8] = PlayerColor.BLACK;
          return board;
        })(),
        isGameOver: false,
        winner: null,
        millFormed: false,
      });

      expect(gameController.getCurrentGameState()?.currentPlayer).toBe(PlayerColor.WHITE);
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(true);

      // 5. Game ends
      const gameEndHandler = mockWebSocketClient.setOnGameEnd.mock.calls[0][0];
      gameEndHandler({
        gameId: 'test-game-123',
        winner: PlayerColor.WHITE,
        reason: 'Opponent resigned',
      });

      expect(gameController.getCurrentGameState()?.isGameOver).toBe(true);
      expect(gameController.getCurrentGameState()?.winner).toBe(PlayerColor.WHITE);
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(false);
    });
  });
});
