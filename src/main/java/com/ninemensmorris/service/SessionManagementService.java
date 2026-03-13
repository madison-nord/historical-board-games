package com.ninemensmorris.service;

import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.ninemensmorris.dto.GameEndMessage;
import com.ninemensmorris.dto.OpponentDisconnectedMessage;
import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.model.PlayerColor;

/**
 * Service for managing WebSocket sessions and handling player disconnections.
 * 
 * This service tracks active WebSocket sessions for each player and handles:
 * - Session registration and tracking
 * - Disconnect detection and notification
 * - Game state preservation during disconnection
 * - Reconnection within timeout period
 * - Automatic winner declaration if opponent doesn't reconnect
 * 
 * Thread-safe implementation using ConcurrentHashMap and scheduled tasks.
 */
@Service
public class SessionManagementService {
    
    private static final int RECONNECT_TIMEOUT_SECONDS = 60;
    
    private final SimpMessagingTemplate messagingTemplate;
    private final GameService gameService;
    private final ScheduledExecutorService scheduler;
    private final int reconnectTimeoutSeconds;
    
    // Maps sessionId -> playerId
    private final ConcurrentHashMap<String, String> sessionToPlayer;
    
    // Maps playerId -> sessionId
    private final ConcurrentHashMap<String, String> playerToSession;
    
    // Maps playerId -> gameId (for players currently in a game)
    private final ConcurrentHashMap<String, String> playerToGame;
    
    // Maps gameId -> disconnected playerId (for games with a disconnected player)
    private final ConcurrentHashMap<String, String> gameToDisconnectedPlayer;
    
    // Maps gameId -> scheduled timeout task
    private final ConcurrentHashMap<String, ScheduledFuture<?>> gameToTimeoutTask;
    
    /**
     * Creates a new SessionManagementService with default timeout.
     * 
     * @param messagingTemplate the messaging template for WebSocket communication
     * @param gameService the game service for managing game state
     */
    public SessionManagementService(
            @NonNull SimpMessagingTemplate messagingTemplate,
            @NonNull GameService gameService) {
        this(messagingTemplate, gameService, RECONNECT_TIMEOUT_SECONDS);
    }
    
    /**
     * Creates a new SessionManagementService with configurable timeout.
     * Package-private for testing.
     * 
     * @param messagingTemplate the messaging template for WebSocket communication
     * @param gameService the game service for managing game state
     * @param reconnectTimeoutSeconds the timeout in seconds before declaring winner
     */
    SessionManagementService(
            @NonNull SimpMessagingTemplate messagingTemplate,
            @NonNull GameService gameService,
            int reconnectTimeoutSeconds) {
        this.messagingTemplate = messagingTemplate;
        this.gameService = gameService;
        this.reconnectTimeoutSeconds = reconnectTimeoutSeconds;
        this.scheduler = Executors.newScheduledThreadPool(2);
        this.sessionToPlayer = new ConcurrentHashMap<>();
        this.playerToSession = new ConcurrentHashMap<>();
        this.playerToGame = new ConcurrentHashMap<>();
        this.gameToDisconnectedPlayer = new ConcurrentHashMap<>();
        this.gameToTimeoutTask = new ConcurrentHashMap<>();
    }
    
    /**
     * Registers a WebSocket session for a player.
     * 
     * @param sessionId the WebSocket session ID
     * @param playerId the player ID
     */
    public void registerSession(@NonNull String sessionId, @NonNull String playerId) {
        sessionToPlayer.put(sessionId, playerId);
        
        // Check if this is a reconnection
        String oldSessionId = playerToSession.put(playerId, sessionId);
        
        if (oldSessionId != null && !oldSessionId.equals(sessionId)) {
            // Player reconnected with a new session
            sessionToPlayer.remove(oldSessionId);
            handleReconnection(playerId);
        }
    }
    
    /**
     * Associates a player with a game.
     * 
     * @param playerId the player ID
     * @param gameId the game ID
     */
    public void associatePlayerWithGame(@NonNull String playerId, @NonNull String gameId) {
        playerToGame.put(playerId, gameId);
    }
    
    /**
     * Handles a WebSocket session disconnect.
     * 
     * @param sessionId the WebSocket session ID that disconnected
     */
    public void handleDisconnect(@NonNull String sessionId) {
        String playerId = sessionToPlayer.remove(sessionId);
        
        if (playerId == null) {
            // Unknown session, nothing to do
            return;
        }
        
        // Keep playerToSession mapping to detect reconnection
        // The isPlayerConnected() method checks both maps to determine actual connection status
        
        // Check if player was in a game
        String gameId = playerToGame.get(playerId);
        
        if (gameId == null) {
            // Player wasn't in a game, clean up session mapping
            playerToSession.remove(playerId, sessionId);
            return;
        }
        
        // Get game state to check if game is still active
        GameState gameState = gameService.getGame(gameId);
        
        if (gameState == null || gameState.isGameOver()) {
            // Game already ended, clean up
            playerToGame.remove(playerId);
            playerToSession.remove(playerId, sessionId);
            return;
        }
        
        // Mark player as disconnected
        gameToDisconnectedPlayer.put(gameId, playerId);
        
        // Notify opponent
        notifyOpponentOfDisconnect(gameId, playerId);
        
        // Schedule timeout task
        scheduleDisconnectTimeout(gameId, playerId);
    }
    
    /**
     * Handles a player reconnection.
     * 
     * @param playerId the player ID that reconnected
     */
    private void handleReconnection(@NonNull String playerId) {
        String gameId = playerToGame.get(playerId);
        
        if (gameId == null) {
            // Player wasn't in a game
            return;
        }
        
        // Check if this player was marked as disconnected
        String disconnectedPlayerId = gameToDisconnectedPlayer.get(gameId);
        
        if (playerId.equals(disconnectedPlayerId)) {
            // Player reconnected! Cancel timeout and notify opponent
            gameToDisconnectedPlayer.remove(gameId);
            
            // Cancel timeout task
            ScheduledFuture<?> timeoutTask = gameToTimeoutTask.remove(gameId);
            if (timeoutTask != null) {
                timeoutTask.cancel(false);
            }
            
            // Notify opponent that player reconnected
            notifyOpponentOfReconnect(gameId, playerId);
        }
    }
    
    /**
     * Notifies the opponent that a player has disconnected.
     * 
     * @param gameId the game ID
     * @param disconnectedPlayerId the player ID that disconnected
     */
    private void notifyOpponentOfDisconnect(@NonNull String gameId, @NonNull String disconnectedPlayerId) {
        // Get player mapping to find opponent
        String playerMapping = gameService.getPlayerMapping(gameId);
        
        if (playerMapping == null) {
            return;
        }
        
        String[] players = playerMapping.split(":");
        if (players.length != 2 || players[0] == null || players[1] == null) {
            return;
        }
        
        // Extract non-null player IDs
        String player1 = players[0];
        String player2 = players[1];
        
        // Find opponent and ensure non-null
        String opponentId = Objects.requireNonNull(
            player1.equals(disconnectedPlayerId) ? player2 : player1,
            "Opponent ID must not be null"
        );
        
        // Determine disconnected player's color
        PlayerColor disconnectedColor = player1.equals(disconnectedPlayerId) 
                ? PlayerColor.WHITE 
                : PlayerColor.BLACK;
        
        // Create and send disconnect message
        OpponentDisconnectedMessage message = new OpponentDisconnectedMessage(
                gameId,
                disconnectedColor,
                reconnectTimeoutSeconds
        );
        
        messagingTemplate.convertAndSendToUser(
                opponentId,
                "/queue/opponent-disconnected",
                message
        );
    }
    
    /**
     * Notifies the opponent that a player has reconnected.
     * 
     * @param gameId the game ID
     * @param reconnectedPlayerId the player ID that reconnected
     */
    private void notifyOpponentOfReconnect(@NonNull String gameId, @NonNull String reconnectedPlayerId) {
        // Get player mapping to find opponent
        String playerMapping = gameService.getPlayerMapping(gameId);
        
        if (playerMapping == null) {
            return;
        }
        
        String[] players = playerMapping.split(":");
        if (players.length != 2 || players[0] == null || players[1] == null) {
            return;
        }
        
        // Extract non-null player IDs
        String player1 = players[0];
        String player2 = players[1];
        
        // Find opponent and ensure non-null
        String opponentId = Objects.requireNonNull(
            player1.equals(reconnectedPlayerId) ? player2 : player1,
            "Opponent ID must not be null"
        );
        
        // Send reconnection notification (could be a custom DTO, for now using a simple message)
        // In a full implementation, you might want to create an OpponentReconnectedMessage DTO
        messagingTemplate.convertAndSendToUser(
                opponentId,
                "/queue/opponent-reconnected",
                "Opponent has reconnected"
        );
    }
    
    /**
     * Schedules a timeout task that will declare the opponent as winner if the
     * disconnected player doesn't reconnect within the timeout period.
     * 
     * @param gameId the game ID
     * @param disconnectedPlayerId the player ID that disconnected
     */
    private void scheduleDisconnectTimeout(@NonNull String gameId, @NonNull String disconnectedPlayerId) {
        ScheduledFuture<?> timeoutTask = scheduler.schedule(
                () -> handleDisconnectTimeout(gameId, disconnectedPlayerId),
                reconnectTimeoutSeconds,
                TimeUnit.SECONDS
        );
        
        gameToTimeoutTask.put(gameId, timeoutTask);
    }
    
    /**
     * Handles the disconnect timeout by declaring the opponent as winner.
     * 
     * @param gameId the game ID
     * @param disconnectedPlayerId the player ID that didn't reconnect
     */
    private void handleDisconnectTimeout(@NonNull String gameId, @NonNull String disconnectedPlayerId) {
        // Check if player is still disconnected
        String currentlyDisconnected = gameToDisconnectedPlayer.get(gameId);
        
        if (!disconnectedPlayerId.equals(currentlyDisconnected)) {
            // Player reconnected, nothing to do
            return;
        }
        
        // Get player mapping to find opponent (winner)
        String playerMapping = gameService.getPlayerMapping(gameId);
        
        if (playerMapping == null) {
            return;
        }
        
        String[] players = playerMapping.split(":");
        if (players.length != 2 || players[0] == null || players[1] == null) {
            return;
        }
        
        // Extract non-null player IDs
        String player1 = players[0];
        String player2 = players[1];
        
        // Find opponent (winner) and ensure non-null
        String winnerId = Objects.requireNonNull(
            player1.equals(disconnectedPlayerId) ? player2 : player1,
            "Winner ID must not be null"
        );
        PlayerColor winnerColor = player1.equals(disconnectedPlayerId) 
                ? PlayerColor.BLACK 
                : PlayerColor.WHITE;
        
        // Create game end message
        GameEndMessage endMessage = new GameEndMessage();
        endMessage.setGameId(gameId);
        endMessage.setWinner(winnerColor);
        endMessage.setReason("Opponent disconnected");
        
        // Notify winner
        messagingTemplate.convertAndSendToUser(
                winnerId,
                "/queue/game-end",
                endMessage
        );
        
        // Clean up
        gameToDisconnectedPlayer.remove(gameId);
        gameToTimeoutTask.remove(gameId);
        playerToGame.remove(player1);
        playerToGame.remove(player2);
        
        // Forfeit the game in the game service
        try {
            gameService.forfeitGame(gameId, disconnectedPlayerId);
        } catch (Exception e) {
            // Log error but don't fail the timeout handling
            System.err.println("Error forfeiting game after disconnect timeout: " + e.getMessage());
        }
    }
    
    /**
     * Cleans up session data for a completed game.
     * 
     * @param gameId the game ID
     */
    public void cleanupGame(@NonNull String gameId) {
        // Cancel any pending timeout tasks
        ScheduledFuture<?> timeoutTask = gameToTimeoutTask.remove(gameId);
        if (timeoutTask != null) {
            timeoutTask.cancel(false);
        }
        
        // Remove disconnect tracking
        gameToDisconnectedPlayer.remove(gameId);
        
        // Remove player-to-game mappings
        String playerMapping = gameService.getPlayerMapping(gameId);
        if (playerMapping != null) {
            String[] players = playerMapping.split(":");
            for (String playerId : players) {
                playerToGame.remove(playerId);
            }
        }
    }
    
    /**
     * Gets the session ID for a player.
     * 
     * @param playerId the player ID
     * @return the session ID, or null if player has no active session
     */
    public String getSessionId(@NonNull String playerId) {
        return playerToSession.get(playerId);
    }
    
    /**
     * Checks if a player is currently connected.
     * 
     * @param playerId the player ID
     * @return true if the player has an active session
     */
    public boolean isPlayerConnected(@NonNull String playerId) {
        String sessionId = playerToSession.get(playerId);
        // Player is connected only if they have a session ID AND that session is active
        return sessionId != null && sessionToPlayer.containsKey(sessionId);
    }
    
    /**
     * Shuts down the scheduler.
     * This method should be called when the service is being destroyed.
     */
    public void shutdown() {
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
