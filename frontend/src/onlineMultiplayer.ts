import { logger } from './utils/logger.js';
import { GameController } from './controllers/GameController.js';
import { BoardRenderer } from './rendering/BoardRenderer.js';
import { UIManager } from './controllers/UIManager.js';
import { GameMode, GamePhase, PlayerColor } from './models/index.js';
import { WebSocketClient } from './network/WebSocketClient.js';
import { ChatPanel } from './controllers/ChatPanel.js';

/**
 * Start the online multiplayer flow:
 * Connect to WebSocket server, show matchmaking, wire up all handlers.
 *
 * @param ui - UIManager instance for dialogs
 * @param renderer - BoardRenderer instance for game rendering
 * @param setGameController - callback to set the global game controller reference
 */
export async function startOnlineMultiplayer(
  ui: UIManager,
  renderer: BoardRenderer,
  setGameController: (gc: GameController | null) => void
): Promise<void> {
  const webSocketClient = new WebSocketClient();
  const chatPanel = new ChatPanel();
  const playerId = `player-${Math.random().toString(36).substring(2, 11)}`;

  // Show matchmaking dialog immediately
  ui.showMatchmakingDialog();

  try {
    await webSocketClient.connect(playerId);
    webSocketClient.joinMatchmaking();
  } catch (_err) {
    ui.showErrorDialog('Could not connect to the game server. Please try again later.');
    return;
  }

  // Cancel matchmaking
  ui.setOnCancelMatchmaking(() => {
    webSocketClient.leaveMatchmaking();
    webSocketClient.disconnect();
    chatPanel.destroy();
    ui.showMainMenu();
  });

  // Game start handler
  webSocketClient.setOnGameStart(message => {
    ui.showMatchFoundDialog(message.opponentId);

    const gc = new GameController(
      GameMode.ONLINE_MULTIPLAYER,
      renderer,
      message.playerColor as PlayerColor
    );
    gc.setWebSocketClient(webSocketClient);

    // Initialize game state with server's gameId and player color
    // Do NOT call gc.startGame() — that generates a random local gameId
    gc.setBoardState({
      gameId: message.gameId,
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

    // Enable input only if we're WHITE (white goes first)
    renderer.setInputEnabled(message.playerColor === PlayerColor.WHITE);

    setGameController(gc);

    // Override game end handler AFTER setWebSocketClient (which sets its own)
    // so we can also show the UI result dialog
    webSocketClient.setOnGameEnd(msg => {
      const currentGc = gc;
      if (currentGc) {
        const gs = currentGc.getCurrentGameState();
        if (gs) {
          gs.isGameOver = true;
          gs.winner = msg.winner;
          currentGc.updateDisplay();
        }
      }
      ui.showGameResult(msg.winner, true);
      chatPanel.destroy();

      ui.setOnRematch(() => {
        chatPanel.clearMessages();
        webSocketClient.joinMatchmaking();
        ui.showMatchmakingDialog();
      });
    });

    // Show chat panel
    chatPanel.show();
    chatPanel.setOnSendMessage(content => {
      webSocketClient.sendChatMessage(content);
    });
  });

  // Chat message handler
  webSocketClient.setOnChatMessage(msg => {
    chatPanel.addMessage({
      senderId: msg.senderId,
      senderColor: msg.senderColor,
      content: msg.content,
      timestamp: msg.timestamp,
    });
  });

  // Opponent disconnected
  webSocketClient.setOnOpponentDisconnected(msg => {
    ui.showOpponentDisconnectedDialog(msg.timeoutSeconds);
  });

  // Opponent reconnected
  webSocketClient.setOnOpponentReconnected(() => {
    ui.showOpponentReconnectedDialog();
  });

  // Claim victory on disconnect timeout
  ui.setOnClaimVictory(() => {
    logger.info('Player claimed victory due to opponent disconnect');
  });

  // Wait for reconnect
  ui.setOnWaitForReconnect(() => {
    logger.info('Player chose to wait for opponent reconnection');
  });
}
