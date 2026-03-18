import { logger } from './utils/logger.js';
import { GameController } from './controllers/GameController.js';
import { BoardRenderer } from './rendering/BoardRenderer.js';
import { UIManager } from './controllers/UIManager.js';
import { GameMode, GamePhase, PlayerColor } from './models/index.js';
import { WebSocketClient } from './network/WebSocketClient.js';
import { ChatPanel } from './controllers/ChatPanel.js';
import { InfoPanel } from './controllers/InfoPanel.js';

/**
 * Start the online multiplayer flow:
 * Connect to WebSocket server, show matchmaking, wire up all handlers.
 *
 * @param ui - UIManager instance for dialogs
 * @param renderer - BoardRenderer instance for game rendering
 * @param setGameController - callback to set the global game controller reference
 * @param infoPanel - InfoPanel instance for displaying game state
 */
export async function startOnlineMultiplayer(
  ui: UIManager,
  renderer: BoardRenderer,
  setGameController: (gc: GameController | null) => void,
  infoPanel: InfoPanel
): Promise<void> {
  const webSocketClient = new WebSocketClient();
  const chatPanel = new ChatPanel();
  const playerId = `player-${Math.random().toString(36).substring(2, 11)}`;

  // Track state for disconnect handling
  let myPlayerColor: PlayerColor | null = null;
  let activeGameController: GameController | null = null;

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

  // Helper to end the game due to disconnect and show result
  const endGameWithDisconnectVictory = (): void => {
    if (activeGameController && myPlayerColor) {
      const gs = activeGameController.getCurrentGameState();
      if (gs) {
        gs.isGameOver = true;
        gs.winner = myPlayerColor;
        activeGameController.updateDisplay();
      }
    }
    ui.showGameResult(myPlayerColor, true, GameMode.ONLINE_MULTIPLAYER, myPlayerColor!);
    chatPanel.destroy();

    ui.setOnRematch(() => {
      chatPanel.clearMessages();
      webSocketClient.joinMatchmaking();
      ui.showMatchmakingDialog();
    });
  };

  // Game start handler
  webSocketClient.setOnGameStart(message => {
    myPlayerColor = message.playerColor as PlayerColor;
    ui.showMatchFoundDialog(message.opponentId);

    const gc = new GameController(
      GameMode.ONLINE_MULTIPLAYER,
      renderer,
      message.playerColor as PlayerColor
    );
    gc.setWebSocketClient(webSocketClient);
    activeGameController = gc;

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

    // Explicitly update InfoPanel with initial game state so it's never empty
    const initialState = gc.getCurrentGameState();
    if (initialState) {
      infoPanel.update(
        initialState,
        GameMode.ONLINE_MULTIPLAYER,
        message.playerColor as PlayerColor,
        null,
        false
      );
    }

    // Override game end handler AFTER setWebSocketClient (which sets its own)
    // so we can also show the UI result dialog
    webSocketClient.setOnGameEnd(msg => {
      if (activeGameController) {
        const gs = activeGameController.getCurrentGameState();
        if (gs) {
          gs.isGameOver = true;
          gs.winner = msg.winner;
          activeGameController.updateDisplay();
        }
      }
      ui.showGameResult(msg.winner, true, GameMode.ONLINE_MULTIPLAYER, myPlayerColor!);
      chatPanel.destroy();

      ui.setOnRematch(() => {
        chatPanel.clearMessages();
        webSocketClient.joinMatchmaking();
        ui.showMatchmakingDialog();
      });
    });

    // Fallback: detect game-over from state updates in case GameEndMessage
    // is not received (e.g. server sends gameOver=true in state update)
    gc.setOnGameOverFromStateUpdate(winner => {
      ui.showGameResult(winner, true, GameMode.ONLINE_MULTIPLAYER, myPlayerColor!);
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

  // Claim victory on disconnect — end the game immediately for this player
  ui.setOnClaimVictory(() => {
    logger.info('Player claimed victory due to opponent disconnect');
    endGameWithDisconnectVictory();
  });

  // Wait for reconnect — just close the dialog, server timeout continues
  ui.setOnWaitForReconnect(() => {
    logger.info('Player chose to wait for opponent reconnection');
    // Dialog closes, countdown continues on server side.
    // If server timeout fires, the game-end handler will show the result.
  });
}
