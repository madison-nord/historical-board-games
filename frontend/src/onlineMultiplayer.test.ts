/**
 * Tests for online multiplayer flow wiring in onlineMultiplayer.ts
 * TDD: Verifies that startOnlineMultiplayer properly creates a WebSocketClient,
 * connects, shows matchmaking, and wires up all handlers.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Store the most recently created mock WebSocketClient instance
let lastCreatedWsClient: Record<string, ReturnType<typeof vi.fn>>;

vi.mock('./network/WebSocketClient', () => ({
  WebSocketClient: vi.fn().mockImplementation(() => {
    lastCreatedWsClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      joinMatchmaking: vi.fn(),
      leaveMatchmaking: vi.fn(),
      sendMove: vi.fn(),
      sendChatMessage: vi.fn(),
      setOnGameStateUpdate: vi.fn(),
      setOnGameStart: vi.fn(),
      setOnGameEnd: vi.fn(),
      setOnChatMessage: vi.fn(),
      setOnOpponentDisconnected: vi.fn(),
      setOnOpponentReconnected: vi.fn(),
      setOnConnectionStatus: vi.fn(),
    };
    return lastCreatedWsClient;
  }),
}));

vi.mock('./rendering/BoardRenderer');
vi.mock('./controllers/GameController');
vi.mock('./controllers/ChatPanel');

import { startOnlineMultiplayer } from './onlineMultiplayer';
import { UIManager } from './controllers/UIManager';
import { GameController } from './controllers/GameController';
import { BoardRenderer } from './rendering/BoardRenderer';
import { InfoPanel } from './controllers/InfoPanel';
import { GameMode, PlayerColor } from './models';

describe('Online Multiplayer Flow', () => {
  let mockUIManager: UIManager;
  let mockBoardRenderer: BoardRenderer;
  let mockSetGameController: ReturnType<typeof vi.fn>;
  let mockInfoPanel: InfoPanel;

  beforeEach(() => {
    mockUIManager = new UIManager();
    mockBoardRenderer = { setInputEnabled: vi.fn() } as unknown as BoardRenderer;
    mockSetGameController = vi.fn();
    mockInfoPanel = { create: vi.fn(), update: vi.fn(), show: vi.fn(), hide: vi.fn(), destroy: vi.fn() } as unknown as InfoPanel;

    vi.spyOn(mockUIManager, 'showMatchmakingDialog').mockImplementation(() => {});
    vi.spyOn(mockUIManager, 'showMatchFoundDialog').mockImplementation(() => {});
    vi.spyOn(mockUIManager, 'showErrorDialog').mockImplementation(() => {});
    vi.spyOn(mockUIManager, 'showOpponentDisconnectedDialog').mockImplementation(() => {});
    vi.spyOn(mockUIManager, 'showOpponentReconnectedDialog').mockImplementation(() => {});
    vi.spyOn(mockUIManager, 'showGameResult').mockImplementation(() => {});
    vi.spyOn(mockUIManager, 'closeCurrentDialog').mockImplementation(() => {});
    vi.spyOn(mockUIManager, 'setOnCancelMatchmaking').mockImplementation(() => {});
    vi.spyOn(mockUIManager, 'setOnClaimVictory').mockImplementation(() => {});
    vi.spyOn(mockUIManager, 'setOnWaitForReconnect').mockImplementation(() => {});
    vi.spyOn(mockUIManager, 'setOnRematch').mockImplementation(() => {});
    vi.spyOn(mockUIManager, 'showMainMenu').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should connect to WebSocket server and show matchmaking dialog', async () => {
    await startOnlineMultiplayer(mockUIManager, mockBoardRenderer, mockSetGameController, mockInfoPanel);

    expect(mockUIManager.showMatchmakingDialog).toHaveBeenCalled();
    expect(lastCreatedWsClient.connect).toHaveBeenCalledWith(expect.any(String));
    expect(lastCreatedWsClient.joinMatchmaking).toHaveBeenCalled();
  });

  it('should set up cancel matchmaking callback', async () => {
    await startOnlineMultiplayer(mockUIManager, mockBoardRenderer, mockSetGameController, mockInfoPanel);

    expect(mockUIManager.setOnCancelMatchmaking).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should set up game start handler on WebSocket client', async () => {
    await startOnlineMultiplayer(mockUIManager, mockBoardRenderer, mockSetGameController, mockInfoPanel);

    expect(lastCreatedWsClient.setOnGameStart).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should set up opponent disconnected handler', async () => {
    await startOnlineMultiplayer(mockUIManager, mockBoardRenderer, mockSetGameController, mockInfoPanel);

    expect(lastCreatedWsClient.setOnOpponentDisconnected).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('should set up opponent reconnected handler', async () => {
    await startOnlineMultiplayer(mockUIManager, mockBoardRenderer, mockSetGameController, mockInfoPanel);

    expect(lastCreatedWsClient.setOnOpponentReconnected).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should set up chat message handler', async () => {
    await startOnlineMultiplayer(mockUIManager, mockBoardRenderer, mockSetGameController, mockInfoPanel);

    expect(lastCreatedWsClient.setOnChatMessage).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should show error dialog if connection fails', async () => {
    // Need to make the next created instance fail on connect
    const { WebSocketClient } = await import('./network/WebSocketClient');
    (WebSocketClient as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      const failClient = {
        connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
        disconnect: vi.fn(),
        joinMatchmaking: vi.fn(),
        leaveMatchmaking: vi.fn(),
        sendMove: vi.fn(),
        sendChatMessage: vi.fn(),
        setOnGameStateUpdate: vi.fn(),
        setOnGameStart: vi.fn(),
        setOnGameEnd: vi.fn(),
        setOnChatMessage: vi.fn(),
        setOnOpponentDisconnected: vi.fn(),
        setOnOpponentReconnected: vi.fn(),
        setOnConnectionStatus: vi.fn(),
      };
      lastCreatedWsClient = failClient;
      return failClient;
    });

    await startOnlineMultiplayer(mockUIManager, mockBoardRenderer, mockSetGameController, mockInfoPanel);

    expect(mockUIManager.showErrorDialog).toHaveBeenCalledWith(expect.stringContaining('connect'));
  });

  it('should not join matchmaking if connection fails', async () => {
    const { WebSocketClient } = await import('./network/WebSocketClient');
    (WebSocketClient as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      const failClient = {
        connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
        disconnect: vi.fn(),
        joinMatchmaking: vi.fn(),
        leaveMatchmaking: vi.fn(),
        sendMove: vi.fn(),
        sendChatMessage: vi.fn(),
        setOnGameStateUpdate: vi.fn(),
        setOnGameStart: vi.fn(),
        setOnGameEnd: vi.fn(),
        setOnChatMessage: vi.fn(),
        setOnOpponentDisconnected: vi.fn(),
        setOnOpponentReconnected: vi.fn(),
        setOnConnectionStatus: vi.fn(),
      };
      lastCreatedWsClient = failClient;
      return failClient;
    });

    await startOnlineMultiplayer(mockUIManager, mockBoardRenderer, mockSetGameController, mockInfoPanel);

    expect(lastCreatedWsClient.joinMatchmaking).not.toHaveBeenCalled();
  });

  it('should create GameController when game starts', async () => {
    await startOnlineMultiplayer(mockUIManager, mockBoardRenderer, mockSetGameController, mockInfoPanel);

    const gameStartHandler = lastCreatedWsClient.setOnGameStart.mock.calls[0][0];
    gameStartHandler({
      gameId: 'test-game-123',
      playerColor: PlayerColor.WHITE,
      opponentId: 'opponent-456',
    });

    expect(GameController).toHaveBeenCalledWith(
      GameMode.ONLINE_MULTIPLAYER,
      mockBoardRenderer,
      PlayerColor.WHITE
    );
  });

  it('should show match found dialog when game starts', async () => {
    await startOnlineMultiplayer(mockUIManager, mockBoardRenderer, mockSetGameController, mockInfoPanel);

    const gameStartHandler = lastCreatedWsClient.setOnGameStart.mock.calls[0][0];
    gameStartHandler({
      gameId: 'test-game-123',
      playerColor: PlayerColor.WHITE,
      opponentId: 'opponent-456',
    });

    expect(mockUIManager.showMatchFoundDialog).toHaveBeenCalledWith('opponent-456');
  });

  it('should call setGameController callback when game starts', async () => {
    await startOnlineMultiplayer(mockUIManager, mockBoardRenderer, mockSetGameController, mockInfoPanel);

    const gameStartHandler = lastCreatedWsClient.setOnGameStart.mock.calls[0][0];
    gameStartHandler({
      gameId: 'test-game-123',
      playerColor: PlayerColor.WHITE,
      opponentId: 'opponent-456',
    });

    expect(mockSetGameController).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should show opponent disconnected dialog on disconnect event', async () => {
    await startOnlineMultiplayer(mockUIManager, mockBoardRenderer, mockSetGameController, mockInfoPanel);

    const handler = lastCreatedWsClient.setOnOpponentDisconnected.mock.calls[0][0];
    handler({ gameId: 'test-game-123', timeoutSeconds: 60 });

    expect(mockUIManager.showOpponentDisconnectedDialog).toHaveBeenCalledWith(60);
  });

  it('should show opponent reconnected dialog on reconnect event', async () => {
    await startOnlineMultiplayer(mockUIManager, mockBoardRenderer, mockSetGameController, mockInfoPanel);

    const handler = lastCreatedWsClient.setOnOpponentReconnected.mock.calls[0][0];
    handler({ gameId: 'test-game-123' });

    expect(mockUIManager.showOpponentReconnectedDialog).toHaveBeenCalled();
  });

  it('should show game result on game end', async () => {
    await startOnlineMultiplayer(mockUIManager, mockBoardRenderer, mockSetGameController, mockInfoPanel);

    // First start a game so the game end handler inside onGameStart is set
    const gameStartHandler = lastCreatedWsClient.setOnGameStart.mock.calls[0][0];
    gameStartHandler({
      gameId: 'test-game-123',
      playerColor: PlayerColor.WHITE,
      opponentId: 'opponent-456',
    });

    // The game end handler is set inside the game start handler (last call)
    const lastEndCall = lastCreatedWsClient.setOnGameEnd.mock.calls;
    const gameEndHandler = lastEndCall[lastEndCall.length - 1][0];
    gameEndHandler({
      gameId: 'test-game-123',
      winner: PlayerColor.WHITE,
      reason: 'Opponent has fewer than 3 pieces',
    });

    expect(mockUIManager.showGameResult).toHaveBeenCalledWith(PlayerColor.WHITE, true, GameMode.ONLINE_MULTIPLAYER, PlayerColor.WHITE);
  });
});
