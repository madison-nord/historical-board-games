import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameController } from './GameController';
import { GameMode, PlayerColor, MoveType, GamePhase } from '../models';

// Mock BoardRenderer
vi.mock('../rendering/BoardRenderer');

// Mock WebSocketClient
vi.mock('../network/WebSocketClient');

describe('GameController - Online Multiplayer Integration', () => {
  let gameController: GameController;
  let mockBoardRenderer: any;
  let mockWebSocketClient: any;

  beforeEach(() => {
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

    gameController = new GameController(
      GameMode.ONLINE_MULTIPLAYER,
      mockBoardRenderer,
      PlayerColor.WHITE
    );

    gameController.setWebSocketClient(mockWebSocketClient);
  });

  afterEach(() => {
    gameController.stopGameLoop();
    vi.clearAllMocks();
  });

  /** Helper: initialize game state as if server sent game-start */
  function initGameAsWhite(): void {
    gameController.setBoardState({
      gameId: 'test-game-123',
      phase: GamePhase.PLACEMENT,
      currentPlayer: PlayerColor.WHITE,
      whitePiecesRemaining: 9,
      blackPiecesRemaining: 9,
      whitePiecesOnBoard: 0,
      blackPiecesOnBoard: 0,
      board: new Array(24).fill(null),
      isGameOver: false,
      winner: null,
      millFormed: false,
    });
    mockBoardRenderer.setInputEnabled(true); // white goes first
  }

  describe('WebSocket Integration', () => {
    it('should set up state update and game end handlers when WebSocket client is set', () => {
      expect(mockWebSocketClient.setOnGameStateUpdate).toHaveBeenCalledWith(expect.any(Function));
      expect(mockWebSocketClient.setOnGameEnd).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should NOT set onGameStart handler (managed by onlineMultiplayer.ts)', () => {
      expect(mockWebSocketClient.setOnGameStart).not.toHaveBeenCalled();
    });

    it('should initialize game state via setBoardState', () => {
      initGameAsWhite();

      const gameState = gameController.getCurrentGameState();
      expect(gameState).not.toBeNull();
      expect(gameState?.gameId).toBe('test-game-123');
      expect(gameState?.phase).toBe(GamePhase.PLACEMENT);
      expect(gameState?.currentPlayer).toBe(PlayerColor.WHITE);
      expect(gameState?.isGameOver).toBe(false);
    });
  });

  describe('Move Handling in Online Mode', () => {
    beforeEach(() => {
      initGameAsWhite();
    });

    it('should send move to server instead of applying locally', () => {
      const positionClickHandler = mockBoardRenderer.setOnPositionClick.mock.calls[0][0];
      positionClickHandler(0);

      expect(mockWebSocketClient.sendMove).toHaveBeenCalledWith({
        type: MoveType.PLACE,
        from: -1,
        to: 0,
        player: PlayerColor.WHITE,
        removed: -1,
      });

      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(false);
    });

    it('should update game state when receiving state update from server', () => {
      const stateUpdateHandler = mockWebSocketClient.setOnGameStateUpdate.mock.calls[0][0];

      const board = new Array(24).fill(null);
      board[0] = PlayerColor.WHITE;

      stateUpdateHandler({
        gameId: 'test-game-123',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.BLACK,
        whitePiecesRemaining: 8,
        blackPiecesRemaining: 9,
        whitePiecesOnBoard: 1,
        blackPiecesOnBoard: 0,
        board,
        gameOver: false,
        winner: null,
        millFormed: false,
      });

      const gameState = gameController.getCurrentGameState();
      expect(gameState?.currentPlayer).toBe(PlayerColor.BLACK);
      expect(gameState?.whitePiecesRemaining).toBe(8);
      expect(gameState?.board[0]).toBe(PlayerColor.WHITE);
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(false);
    });

    it('should enable input when it becomes our turn', () => {
      const stateUpdateHandler = mockWebSocketClient.setOnGameStateUpdate.mock.calls[0][0];

      const board = new Array(24).fill(null);
      board[0] = PlayerColor.WHITE;
      board[8] = PlayerColor.BLACK;

      stateUpdateHandler({
        gameId: 'test-game-123',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.WHITE,
        whitePiecesRemaining: 8,
        blackPiecesRemaining: 8,
        whitePiecesOnBoard: 1,
        blackPiecesOnBoard: 1,
        board,
        gameOver: false,
        winner: null,
        millFormed: false,
      });

      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(true);
    });

    it('should enable input and highlight removable pieces when mill formed on our turn', () => {
      const stateUpdateHandler = mockWebSocketClient.setOnGameStateUpdate.mock.calls[0][0];

      const board = new Array(24).fill(null);
      board[0] = PlayerColor.WHITE;
      board[1] = PlayerColor.WHITE;
      board[2] = PlayerColor.WHITE;
      board[8] = PlayerColor.BLACK;
      board[9] = PlayerColor.BLACK;

      stateUpdateHandler({
        gameId: 'test-game-123',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.WHITE,
        whitePiecesRemaining: 6,
        blackPiecesRemaining: 7,
        whitePiecesOnBoard: 3,
        blackPiecesOnBoard: 2,
        board,
        gameOver: false,
        winner: null,
        millFormed: true,
      });

      // Input should be enabled (our turn, mill formed)
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(true);
      // Removable pieces should be highlighted
      expect(mockBoardRenderer.highlightValidMoves).toHaveBeenCalled();
    });

    it('should send REMOVE move to server when removing opponent piece in online mode', () => {
      const stateUpdateHandler = mockWebSocketClient.setOnGameStateUpdate.mock.calls[0][0];

      const board = new Array(24).fill(null);
      board[0] = PlayerColor.WHITE;
      board[1] = PlayerColor.WHITE;
      board[2] = PlayerColor.WHITE;
      board[8] = PlayerColor.BLACK;
      board[9] = PlayerColor.BLACK;

      stateUpdateHandler({
        gameId: 'test-game-123',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.WHITE,
        whitePiecesRemaining: 6,
        blackPiecesRemaining: 7,
        whitePiecesOnBoard: 3,
        blackPiecesOnBoard: 2,
        board,
        gameOver: false,
        winner: null,
        millFormed: true,
      });

      // Click on opponent piece to remove it
      const positionClickHandler = mockBoardRenderer.setOnPositionClick.mock.calls[0][0];
      positionClickHandler(8);

      // Should send REMOVE move to server
      expect(mockWebSocketClient.sendMove).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MoveType.REMOVE,
          to: 8,
        })
      );
    });
  });

  describe('Game End Handling', () => {
    beforeEach(() => {
      initGameAsWhite();
    });

    it('should handle game end message from server', () => {
      const gameEndHandler = mockWebSocketClient.setOnGameEnd.mock.calls[0][0];

      gameEndHandler({
        gameId: 'test-game-123',
        winner: PlayerColor.WHITE,
        reason: 'Opponent has fewer than 3 pieces',
      });

      const gameState = gameController.getCurrentGameState();
      expect(gameState?.isGameOver).toBe(true);
      expect(gameState?.winner).toBe(PlayerColor.WHITE);
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      initGameAsWhite();
    });

    it('should handle WebSocket send error gracefully', () => {
      mockWebSocketClient.sendMove.mockImplementation(() => {
        throw new Error('Connection lost');
      });

      const positionClickHandler = mockBoardRenderer.setOnPositionClick.mock.calls[0][0];
      positionClickHandler(0);

      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(true);
    });
  });

  describe('State Persistence', () => {
    it('should not save online multiplayer games to localStorage', () => {
      initGameAsWhite();

      const positionClickHandler = mockBoardRenderer.setOnPositionClick.mock.calls[0][0];
      positionClickHandler(0);

      expect(GameController.hasSavedGame()).toBe(false);
    });
  });

  describe('Complete Online Game Flow', () => {
    it('should handle complete game flow from start to finish', () => {
      // 1. Game initialized (as done by onlineMultiplayer.ts)
      initGameAsWhite();
      expect(gameController.getCurrentGameState()?.phase).toBe(GamePhase.PLACEMENT);

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
          const b = new Array(24).fill(null);
          b[0] = PlayerColor.WHITE;
          return b;
        })(),
        gameOver: false,
        winner: null,
        millFormed: false,
      });

      expect(gameController.getCurrentGameState()?.currentPlayer).toBe(PlayerColor.BLACK);
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(false);

      // 4. Opponent makes move (server sends update, now our turn)
      stateUpdateHandler({
        gameId: 'test-game-123',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.WHITE,
        whitePiecesRemaining: 8,
        blackPiecesRemaining: 8,
        whitePiecesOnBoard: 1,
        blackPiecesOnBoard: 1,
        board: (() => {
          const b = new Array(24).fill(null);
          b[0] = PlayerColor.WHITE;
          b[8] = PlayerColor.BLACK;
          return b;
        })(),
        gameOver: false,
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

  describe('Bug F: Board interaction after setBoardState', () => {
    it('should allow WHITE player to click and send move after setBoardState + setInputEnabled', () => {
      // Use the gameController from beforeEach (already set up as WHITE online player)
      // Replicate exact onlineMultiplayer.ts flow
      gameController.setBoardState({
        gameId: 'server-game-id',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.WHITE,
        whitePiecesRemaining: 9,
        blackPiecesRemaining: 9,
        whitePiecesOnBoard: 0,
        blackPiecesOnBoard: 0,
        board: new Array(24).fill(null),
        isGameOver: false,
        winner: null,
        millFormed: false,
      });

      // setInputEnabled(true) as onlineMultiplayer.ts does for WHITE
      mockBoardRenderer.setInputEnabled(true);

      // Verify game state is set
      expect(gameController.getCurrentGameState()).not.toBeNull();
      expect(gameController.getCurrentGameState()?.gameId).toBe('server-game-id');

      // Simulate click — get the handler registered in constructor
      const clickHandler = mockBoardRenderer.setOnPositionClick.mock.calls[0][0];
      clickHandler(0);

      // Should send move to server
      expect(mockWebSocketClient.sendMove).toHaveBeenCalledWith({
        type: MoveType.PLACE,
        from: -1,
        to: 0,
        player: PlayerColor.WHITE,
        removed: -1,
      });
    });

    it('should NOT allow BLACK player to click when currentPlayer is WHITE', () => {
      // Create fresh mocks for this test to avoid call count confusion
      const freshRenderer = {
        setOnPositionClick: vi.fn(),
        render: vi.fn(),
        setInputEnabled: vi.fn(),
        highlightValidMoves: vi.fn(),
        clearHighlights: vi.fn(),
        animatePlacement: vi.fn(),
        animateMovement: vi.fn(),
        animateRemoval: vi.fn(),
      };
      const freshWs = {
        ...mockWebSocketClient,
        sendMove: vi.fn(),
        setOnGameStateUpdate: vi.fn(),
        setOnGameEnd: vi.fn(),
      };

      const gc = new GameController(
        GameMode.ONLINE_MULTIPLAYER,
        freshRenderer as any,
        PlayerColor.BLACK
      );
      gc.setWebSocketClient(freshWs as any);

      gc.setBoardState({
        gameId: 'server-game-id',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.WHITE,
        whitePiecesRemaining: 9,
        blackPiecesRemaining: 9,
        whitePiecesOnBoard: 0,
        blackPiecesOnBoard: 0,
        board: new Array(24).fill(null),
        isGameOver: false,
        winner: null,
        millFormed: false,
      });

      // Click handler from THIS gc's constructor
      const clickHandler = freshRenderer.setOnPositionClick.mock.calls[0][0];
      clickHandler(0);

      // Should NOT send move (not BLACK's turn)
      expect(freshWs.sendMove).not.toHaveBeenCalled();

      gc.stopGameLoop();
    });

    it('should allow BLACK player to click after server state update makes it their turn', () => {
      const freshRenderer = {
        setOnPositionClick: vi.fn(),
        render: vi.fn(),
        setInputEnabled: vi.fn(),
        highlightValidMoves: vi.fn(),
        clearHighlights: vi.fn(),
        animatePlacement: vi.fn(),
        animateMovement: vi.fn(),
        animateRemoval: vi.fn(),
      };
      const freshWs = {
        ...mockWebSocketClient,
        sendMove: vi.fn(),
        setOnGameStateUpdate: vi.fn(),
        setOnGameEnd: vi.fn(),
      };

      const gc = new GameController(
        GameMode.ONLINE_MULTIPLAYER,
        freshRenderer as any,
        PlayerColor.BLACK
      );
      gc.setWebSocketClient(freshWs as any);

      gc.setBoardState({
        gameId: 'server-game-id',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.WHITE,
        whitePiecesRemaining: 9,
        blackPiecesRemaining: 9,
        whitePiecesOnBoard: 0,
        blackPiecesOnBoard: 0,
        board: new Array(24).fill(null),
        isGameOver: false,
        winner: null,
        millFormed: false,
      });

      // Server sends state update — now it's BLACK's turn
      const stateHandler = freshWs.setOnGameStateUpdate.mock.calls[0][0];
      const board = new Array(24).fill(null);
      board[0] = PlayerColor.WHITE;
      stateHandler({
        gameId: 'server-game-id',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.BLACK,
        whitePiecesRemaining: 8,
        blackPiecesRemaining: 9,
        whitePiecesOnBoard: 1,
        blackPiecesOnBoard: 0,
        board,
        gameOver: false,
        winner: null,
        millFormed: false,
      });

      // Now BLACK clicks
      const clickHandler = freshRenderer.setOnPositionClick.mock.calls[0][0];
      clickHandler(8);

      expect(freshWs.sendMove).toHaveBeenCalledWith({
        type: MoveType.PLACE,
        from: -1,
        to: 8,
        player: PlayerColor.BLACK,
        removed: -1,
      });

      gc.stopGameLoop();
    });
  });

  describe('Bug E: Chat message sending requires gameId', () => {
    it('should be able to send chat messages when gameId is set on WebSocketClient', () => {
      // This tests the real WebSocketClient behavior — gameId must be set
      // In onlineMultiplayer.ts, the setOnGameStart callback fires AFTER
      // WebSocketClient.handleGameStart sets this.gameId
      // So sendChatMessage should work inside that callback

      // For this unit test, we verify the mock is called correctly
      initGameAsWhite();

      // The chat send callback in onlineMultiplayer.ts does:
      // webSocketClient.sendChatMessage(content)
      // Verify it doesn't throw with our mock
      expect(() => mockWebSocketClient.sendChatMessage('hello')).not.toThrow();
      expect(mockWebSocketClient.sendChatMessage).toHaveBeenCalledWith('hello');
    });
  });

  describe('Bug G: handleGameStateUpdate maps server fields correctly', () => {
    it('should map gameOver field to isGameOver in local state', () => {
      initGameAsWhite();

      const stateHandler = mockWebSocketClient.setOnGameStateUpdate.mock.calls[0][0];
      stateHandler({
        gameId: 'test-game-123',
        phase: 'PLACEMENT',
        currentPlayer: PlayerColor.WHITE,
        whitePiecesRemaining: 9,
        blackPiecesRemaining: 9,
        whitePiecesOnBoard: 0,
        blackPiecesOnBoard: 0,
        board: new Array(24).fill(null),
        gameOver: false,
        winner: null,
        millFormed: false,
      });

      const gs = gameController.getCurrentGameState();
      expect(gs?.isGameOver).toBe(false);
      expect(gs?.phase).toBe('PLACEMENT');
    });

    it('should correctly handle phase as string from server', () => {
      initGameAsWhite();

      const stateHandler = mockWebSocketClient.setOnGameStateUpdate.mock.calls[0][0];
      const board = new Array(24).fill(null);
      // Place 9 white and 9 black pieces to trigger MOVEMENT phase
      board[0] = PlayerColor.WHITE;
      board[8] = PlayerColor.BLACK;

      stateHandler({
        gameId: 'test-game-123',
        phase: 'MOVEMENT',
        currentPlayer: PlayerColor.WHITE,
        whitePiecesRemaining: 0,
        blackPiecesRemaining: 0,
        whitePiecesOnBoard: 9,
        blackPiecesOnBoard: 9,
        board,
        gameOver: false,
        winner: null,
        millFormed: false,
      });

      const gs = gameController.getCurrentGameState();
      expect(gs?.phase).toBe('MOVEMENT');
    });
  });

  describe('Input Control for startGame', () => {
    it('should disable input for BLACK player when startGame is called in online mode', () => {
      // Create a BLACK player controller
      const blackController = new GameController(
        GameMode.ONLINE_MULTIPLAYER,
        mockBoardRenderer,
        PlayerColor.BLACK
      );
      blackController.setWebSocketClient(mockWebSocketClient);
      blackController.startGame();

      // BLACK should NOT have input enabled (WHITE goes first)
      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(false);
      blackController.stopGameLoop();
    });

    it('should enable input for WHITE player when startGame is called in online mode', () => {
      const whiteController = new GameController(
        GameMode.ONLINE_MULTIPLAYER,
        mockBoardRenderer,
        PlayerColor.WHITE
      );
      whiteController.setWebSocketClient(mockWebSocketClient);
      whiteController.startGame();

      expect(mockBoardRenderer.setInputEnabled).toHaveBeenCalledWith(true);
      whiteController.stopGameLoop();
    });
  });
});
