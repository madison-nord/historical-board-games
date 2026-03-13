import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketClient } from './WebSocketClient';
import { Client } from '@stomp/stompjs';
import { MoveType, PlayerColor } from '../models';

// Mock the STOMP client
vi.mock('@stomp/stompjs', () => ({
  Client: vi.fn(),
}));

// Mock SockJS
vi.mock('sockjs-client', () => ({
  default: vi.fn(() => ({})),
}));

describe('WebSocketClient', () => {
  let client: WebSocketClient;
  let mockStompClient: any;

  beforeEach(() => {
    // Create mock STOMP client
    mockStompClient = {
      activate: vi.fn(),
      deactivate: vi.fn(() => Promise.resolve()),
      publish: vi.fn(),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
      connected: false,
    };

    // Mock the Client constructor
    (Client as any).mockImplementation((config: any) => {
      // Store callbacks for later invocation
      mockStompClient.onConnect = config.onConnect;
      mockStompClient.onStompError = config.onStompError;
      mockStompClient.onWebSocketClose = config.onWebSocketClose;
      mockStompClient.onWebSocketError = config.onWebSocketError;
      return mockStompClient;
    });

    client = new WebSocketClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket server', async () => {
      const connectPromise = client.connect('player-1');

      // Simulate successful connection
      mockStompClient.connected = true;
      mockStompClient.onConnect();

      await connectPromise;

      expect(mockStompClient.activate).toHaveBeenCalled();
      expect(client.isConnected()).toBe(true);
      expect(client.getPlayerId()).toBe('player-1');
    });

    it('should handle connection errors', async () => {
      const connectPromise = client.connect('player-1');

      // Simulate connection error
      mockStompClient.onStompError({ headers: { message: 'Connection failed' } });

      await expect(connectPromise).rejects.toThrow('STOMP error: Connection failed');
    });

    it('should disconnect from WebSocket server', async () => {
      // Connect first
      const connectPromise = client.connect('player-1');
      mockStompClient.connected = true;
      mockStompClient.onConnect();
      await connectPromise;

      // Disconnect
      await client.disconnect();

      expect(mockStompClient.deactivate).toHaveBeenCalled();
      expect(client.isConnected()).toBe(false);
      expect(client.getPlayerId()).toBe(null);
    });

    it('should notify connection status changes', async () => {
      const statusHandler = vi.fn();
      client.setOnConnectionStatus(statusHandler);

      const connectPromise = client.connect('player-1');
      mockStompClient.connected = true;
      mockStompClient.onConnect();
      await connectPromise;

      expect(statusHandler).toHaveBeenCalledWith(true);

      await client.disconnect();
      expect(statusHandler).toHaveBeenCalledWith(false);
    });
  });

  describe('Matchmaking', () => {
    beforeEach(async () => {
      const connectPromise = client.connect('player-1');
      mockStompClient.connected = true;
      mockStompClient.onConnect();
      await connectPromise;
    });

    it('should join matchmaking queue', () => {
      client.joinMatchmaking();

      expect(mockStompClient.publish).toHaveBeenCalledWith({
        destination: '/app/matchmaking/join',
        body: JSON.stringify({ playerId: 'player-1' }),
      });
    });

    it('should leave matchmaking queue', () => {
      client.leaveMatchmaking();

      expect(mockStompClient.publish).toHaveBeenCalledWith({
        destination: '/app/matchmaking/leave',
        body: JSON.stringify({ playerId: 'player-1' }),
      });
    });

    it('should throw error when joining matchmaking while disconnected', () => {
      const disconnectedClient = new WebSocketClient();

      expect(() => disconnectedClient.joinMatchmaking()).toThrow('Not connected to server');
    });
  });

  describe('Game Moves', () => {
    beforeEach(async () => {
      const connectPromise = client.connect('player-1');
      mockStompClient.connected = true;
      mockStompClient.onConnect();
      await connectPromise;

      // Simulate game start to set gameId
      const gameStartHandler = vi.fn();
      client.setOnGameStart(gameStartHandler);

      // Find the game-start subscription callback
      const gameStartCallback = mockStompClient.subscribe.mock.calls.find(
        (call: any) => call[0] === '/user/queue/game-start'
      )?.[1];

      gameStartCallback({
        body: JSON.stringify({
          gameId: 'game-123',
          playerColor: 'WHITE',
          opponentId: 'player-2',
        }),
      });
    });

    it('should send PLACE move', () => {
      client.sendMove({
        type: MoveType.PLACE,
        from: -1,
        to: 5,
        player: PlayerColor.WHITE,
      });

      expect(mockStompClient.publish).toHaveBeenCalledWith({
        destination: '/app/game/place',
        body: JSON.stringify({
          gameId: 'game-123',
          playerId: 'player-1',
          position: 5,
        }),
      });
    });

    it('should send MOVE move', () => {
      client.sendMove({
        type: MoveType.MOVE,
        from: 5,
        to: 6,
        player: PlayerColor.WHITE,
      });

      expect(mockStompClient.publish).toHaveBeenCalledWith({
        destination: '/app/game/move',
        body: JSON.stringify({
          gameId: 'game-123',
          playerId: 'player-1',
          from: 5,
          to: 6,
        }),
      });
    });

    it('should send REMOVE move', () => {
      client.sendMove({
        type: MoveType.REMOVE,
        from: -1,
        to: 10,
        player: PlayerColor.WHITE,
      });

      expect(mockStompClient.publish).toHaveBeenCalledWith({
        destination: '/app/game/remove',
        body: JSON.stringify({
          gameId: 'game-123',
          playerId: 'player-1',
          position: 10,
        }),
      });
    });

    it('should throw error when sending move while not in game', () => {
      const newClient = new WebSocketClient();

      expect(() =>
        newClient.sendMove({
          type: MoveType.PLACE,
          from: -1,
          to: 5,
          player: PlayerColor.WHITE,
        })
      ).toThrow('Not connected or not in a game');
    });
  });

  describe('Chat Messages', () => {
    beforeEach(async () => {
      const connectPromise = client.connect('player-1');
      mockStompClient.connected = true;
      mockStompClient.onConnect();
      await connectPromise;

      // Simulate game start
      const gameStartCallback = mockStompClient.subscribe.mock.calls.find(
        (call: any) => call[0] === '/user/queue/game-start'
      )?.[1];

      gameStartCallback({
        body: JSON.stringify({
          gameId: 'game-123',
          playerColor: 'WHITE',
          opponentId: 'player-2',
        }),
      });
    });

    it('should send chat message', () => {
      client.sendChatMessage('Hello!');

      expect(mockStompClient.publish).toHaveBeenCalledWith({
        destination: '/app/chat/send',
        body: JSON.stringify({
          gameId: 'game-123',
          playerId: 'player-1',
          content: 'Hello!',
        }),
      });
    });

    it('should throw error when sending chat while not in game', () => {
      const newClient = new WebSocketClient();

      expect(() => newClient.sendChatMessage('Hello!')).toThrow('Not connected or not in a game');
    });
  });

  describe('Message Handlers', () => {
    beforeEach(async () => {
      const connectPromise = client.connect('player-1');
      mockStompClient.connected = true;
      mockStompClient.onConnect();
      await connectPromise;
    });

    it('should handle game state update', () => {
      const handler = vi.fn();
      client.setOnGameStateUpdate(handler);

      const callback = mockStompClient.subscribe.mock.calls.find(
        (call: any) => call[0] === '/user/queue/game-state'
      )?.[1];

      const gameState = {
        gameId: 'game-123',
        board: { positions: [] },
        currentPlayer: 'WHITE',
        phase: 'PLACEMENT',
        whitePiecesRemaining: 9,
        blackPiecesRemaining: 9,
        whitePiecesOnBoard: 0,
        blackPiecesOnBoard: 0,
        millFormed: false,
        gameOver: false,
        winner: null,
      };

      callback({
        body: JSON.stringify({
          gameId: 'game-123',
          gameState,
        }),
      });

      expect(handler).toHaveBeenCalledWith({
        gameId: 'game-123',
        gameState,
      });
    });

    it('should handle game start', () => {
      const handler = vi.fn();
      client.setOnGameStart(handler);

      const callback = mockStompClient.subscribe.mock.calls.find(
        (call: any) => call[0] === '/user/queue/game-start'
      )?.[1];

      callback({
        body: JSON.stringify({
          gameId: 'game-123',
          playerColor: 'WHITE',
          opponentId: 'player-2',
        }),
      });

      expect(handler).toHaveBeenCalledWith({
        gameId: 'game-123',
        playerColor: 'WHITE',
        opponentId: 'player-2',
      });
      expect(client.getGameId()).toBe('game-123');
    });

    it('should handle game end', () => {
      const handler = vi.fn();
      client.setOnGameEnd(handler);

      // First start a game
      const gameStartCallback = mockStompClient.subscribe.mock.calls.find(
        (call: any) => call[0] === '/user/queue/game-start'
      )?.[1];

      gameStartCallback({
        body: JSON.stringify({
          gameId: 'game-123',
          playerColor: 'WHITE',
          opponentId: 'player-2',
        }),
      });

      // Then end it
      const gameEndCallback = mockStompClient.subscribe.mock.calls.find(
        (call: any) => call[0] === '/user/queue/game-end'
      )?.[1];

      gameEndCallback({
        body: JSON.stringify({
          gameId: 'game-123',
          winner: 'WHITE',
          reason: 'Opponent has no legal moves',
        }),
      });

      expect(handler).toHaveBeenCalledWith({
        gameId: 'game-123',
        winner: 'WHITE',
        reason: 'Opponent has no legal moves',
      });
      expect(client.getGameId()).toBe(null);
    });

    it('should handle chat message', () => {
      const handler = vi.fn();
      client.setOnChatMessage(handler);

      const callback = mockStompClient.subscribe.mock.calls.find(
        (call: any) => call[0] === '/user/queue/chat'
      )?.[1];

      callback({
        body: JSON.stringify({
          gameId: 'game-123',
          senderId: 'player-2',
          senderColor: 'BLACK',
          content: 'Good game!',
          timestamp: '2026-03-13T10:00:00Z',
        }),
      });

      expect(handler).toHaveBeenCalledWith({
        gameId: 'game-123',
        senderId: 'player-2',
        senderColor: 'BLACK',
        content: 'Good game!',
        timestamp: '2026-03-13T10:00:00Z',
      });
    });

    it('should handle opponent disconnected', () => {
      const handler = vi.fn();
      client.setOnOpponentDisconnected(handler);

      const callback = mockStompClient.subscribe.mock.calls.find(
        (call: any) => call[0] === '/user/queue/opponent-disconnected'
      )?.[1];

      callback({
        body: JSON.stringify({
          gameId: 'game-123',
          timeoutSeconds: 60,
        }),
      });

      expect(handler).toHaveBeenCalledWith({
        gameId: 'game-123',
        timeoutSeconds: 60,
      });
    });

    it('should handle opponent reconnected', () => {
      const handler = vi.fn();
      client.setOnOpponentReconnected(handler);

      const callback = mockStompClient.subscribe.mock.calls.find(
        (call: any) => call[0] === '/user/queue/opponent-reconnected'
      )?.[1];

      callback({
        body: JSON.stringify({
          gameId: 'game-123',
        }),
      });

      expect(handler).toHaveBeenCalledWith({
        gameId: 'game-123',
      });
    });
  });

  describe('Subscription Management', () => {
    it('should subscribe to all required queues on connect', async () => {
      const connectPromise = client.connect('player-1');
      mockStompClient.connected = true;
      mockStompClient.onConnect();
      await connectPromise;

      const subscriptions = mockStompClient.subscribe.mock.calls.map((call: any) => call[0]);

      expect(subscriptions).toContain('/user/queue/game-state');
      expect(subscriptions).toContain('/user/queue/game-start');
      expect(subscriptions).toContain('/user/queue/game-end');
      expect(subscriptions).toContain('/user/queue/chat');
      expect(subscriptions).toContain('/user/queue/opponent-disconnected');
      expect(subscriptions).toContain('/user/queue/opponent-reconnected');
    });

    it('should unsubscribe from all queues on disconnect', async () => {
      const connectPromise = client.connect('player-1');
      mockStompClient.connected = true;
      mockStompClient.onConnect();
      await connectPromise;

      const unsubscribeMocks = mockStompClient.subscribe.mock.results.map(
        (result: any) => result.value.unsubscribe
      );

      await client.disconnect();

      unsubscribeMocks.forEach((unsubscribe: any) => {
        expect(unsubscribe).toHaveBeenCalled();
      });
    });
  });
});
