package com.ninemensmorris.service;

import java.util.Objects;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.ninemensmorris.dto.GameStartMessage;
import com.ninemensmorris.model.GameMode;
import com.ninemensmorris.model.PlayerColor;

/**
 * Service for managing player matchmaking in online multiplayer games.
 * 
 * This service maintains a queue of players waiting for matches and pairs them
 * when two players are available. It handles:
 * - Adding players to the matchmaking queue
 * - Removing players from the queue
 * - Pairing players and creating games
 * - Notifying players when a match is found
 * - Handling player disconnections
 * 
 * Thread-safe implementation using ConcurrentLinkedQueue and ConcurrentHashMap.
 */
@Service
public class MatchmakingService {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final GameService gameService;
    private final SessionManagementService sessionManagementService;
    private final ConcurrentLinkedQueue<QueuedPlayer> queue;
    private final ConcurrentHashMap<String, QueuedPlayer> playerMap;
    private final Random random;
    
    /**
     * Represents a player in the matchmaking queue.
     */
    @SuppressWarnings("unused") // sessionId preserved for potential future use in session-based matchmaking
    private static class QueuedPlayer {
        final String playerId;
        final String sessionId;
        
        QueuedPlayer(String playerId, String sessionId) {
            this.playerId = playerId;
            this.sessionId = sessionId;
        }
    }
    
    /**
     * Creates a new MatchmakingService.
     * 
     * @param messagingTemplate the messaging template for WebSocket communication
     * @param gameService the game service for creating games
     * @param sessionManagementService the session management service for tracking player-game associations
     */
    public MatchmakingService(SimpMessagingTemplate messagingTemplate, GameService gameService,
                              SessionManagementService sessionManagementService) {
        this.messagingTemplate = messagingTemplate;
        this.gameService = gameService;
        this.sessionManagementService = sessionManagementService;
        this.queue = new ConcurrentLinkedQueue<>();
        this.playerMap = new ConcurrentHashMap<>();
        this.random = new Random();
    }
    
    /**
     * Adds a player to the matchmaking queue.
     * If two players are in the queue, they are automatically paired.
     * 
     * @param playerId the unique player identifier
     * @param sessionId the WebSocket session identifier
     */
    public void joinQueue(String playerId, String sessionId) {
        QueuedPlayer player = new QueuedPlayer(playerId, sessionId);
        queue.offer(player);
        playerMap.put(playerId, player);
        
        // Try to match players
        tryMatchPlayers();
    }
    
    /**
     * Removes a player from the matchmaking queue.
     * 
     * @param playerId the unique player identifier
     */
    public void leaveQueue(String playerId) {
        QueuedPlayer player = playerMap.remove(playerId);
        if (player != null) {
            queue.remove(player);
        }
    }
    
    /**
     * Gets the current size of the matchmaking queue.
     * 
     * @return the number of players waiting for a match
     */
    public int getQueueSize() {
        return queue.size();
    }
    
    /**
     * Handles a player disconnection by removing them from the queue.
     * 
     * @param playerId the unique player identifier
     */
    public void handleDisconnect(String playerId) {
        leaveQueue(playerId);
    }
    
    /**
     * Attempts to match two players from the queue.
     * If two or more players are available, pairs them and creates a game.
     */
    private void tryMatchPlayers() {
        // Keep matching while we have at least 2 players
        while (queue.size() >= 2) {
            QueuedPlayer player1 = queue.poll();
            QueuedPlayer player2 = queue.poll();
            
            if (player1 != null && player2 != null) {
                // Remove from player map
                playerMap.remove(player1.playerId);
                playerMap.remove(player2.playerId);
                
                // Create game and notify players
                notifyPlayersOfMatch(player1, player2);
            }
        }
    }
    
    /**
     * Notifies both players that a match has been found.
     * Randomly assigns colors to players.
     * 
     * @param player1 the first player
     * @param player2 the second player
     */
    private void notifyPlayersOfMatch(QueuedPlayer player1, QueuedPlayer player2) {
        // Randomly assign colors
        boolean player1IsWhite = random.nextBoolean();
        
        String whitePlayerId = player1IsWhite ? player1.playerId : player2.playerId;
        String blackPlayerId = player1IsWhite ? player2.playerId : player1.playerId;
        
        // Create the game on the server via GameService
        com.ninemensmorris.engine.GameState createdGame = gameService.createGame(
                GameMode.ONLINE_MULTIPLAYER, whitePlayerId, blackPlayerId);
        String actualGameId = createdGame.getGameId();
        
        // Associate both players with the game for disconnect handling
        sessionManagementService.associatePlayerWithGame(
                Objects.requireNonNull(whitePlayerId), Objects.requireNonNull(actualGameId));
        sessionManagementService.associatePlayerWithGame(
                Objects.requireNonNull(blackPlayerId), actualGameId);
        
        // Build personalized message for player 1
        GameStartMessage message1 = new GameStartMessage();
        message1.setGameId(actualGameId);
        message1.setPlayer1Id(player1.playerId);
        message1.setPlayer2Id(player2.playerId);
        PlayerColor p1Color = player1IsWhite ? PlayerColor.WHITE : PlayerColor.BLACK;
        PlayerColor p2Color = player1IsWhite ? PlayerColor.BLACK : PlayerColor.WHITE;
        message1.setPlayer1Color(p1Color);
        message1.setPlayer2Color(p2Color);
        message1.setPlayerColor(p1Color);
        message1.setOpponentId(player2.playerId);
        
        // Build personalized message for player 2
        GameStartMessage message2 = new GameStartMessage();
        message2.setGameId(actualGameId);
        message2.setPlayer1Id(player1.playerId);
        message2.setPlayer2Id(player2.playerId);
        message2.setPlayer1Color(p1Color);
        message2.setPlayer2Color(p2Color);
        message2.setPlayerColor(p2Color);
        message2.setOpponentId(player1.playerId);
        
        // Send personalized notifications to both players
        String player1Id = Objects.requireNonNull(player1.playerId, "Player 1 ID must not be null");
        String player2Id = Objects.requireNonNull(player2.playerId, "Player 2 ID must not be null");
        
        messagingTemplate.convertAndSendToUser(
                player1Id,
                "/queue/game-start",
                message1
        );
        
        messagingTemplate.convertAndSendToUser(
                player2Id,
                "/queue/game-start",
                message2
        );
    }
}
