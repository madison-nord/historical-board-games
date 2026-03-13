package com.ninemensmorris.service;

import java.util.Objects;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.ninemensmorris.dto.GameStartMessage;
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
    private final ConcurrentLinkedQueue<QueuedPlayer> queue;
    private final ConcurrentHashMap<String, QueuedPlayer> playerMap;
    private final Random random;
    
    /**
     * Represents a player in the matchmaking queue.
     */
    @SuppressWarnings("unused") // sessionId will be used in future tasks for session management
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
     */
    public MatchmakingService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
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
                String gameId = generateGameId();
                notifyPlayersOfMatch(player1, player2, gameId);
            }
        }
    }
    
    /**
     * Notifies both players that a match has been found.
     * Randomly assigns colors to players.
     * 
     * @param player1 the first player
     * @param player2 the second player
     * @param gameId the unique game identifier
     */
    private void notifyPlayersOfMatch(QueuedPlayer player1, QueuedPlayer player2, String gameId) {
        // Randomly assign colors
        boolean player1IsWhite = random.nextBoolean();
        PlayerColor player1Color = player1IsWhite ? PlayerColor.WHITE : PlayerColor.BLACK;
        PlayerColor player2Color = player1IsWhite ? PlayerColor.BLACK : PlayerColor.WHITE;
        
        // Create messages for both players
        GameStartMessage message1 = new GameStartMessage();
        message1.setGameId(gameId);
        message1.setPlayer1Id(player1.playerId);
        message1.setPlayer2Id(player2.playerId);
        message1.setPlayer1Color(player1Color);
        message1.setPlayer2Color(player2Color);
        
        GameStartMessage message2 = new GameStartMessage();
        message2.setGameId(gameId);
        message2.setPlayer1Id(player1.playerId);
        message2.setPlayer2Id(player2.playerId);
        message2.setPlayer1Color(player1Color);
        message2.setPlayer2Color(player2Color);
        
        // Send notifications to both players
        // Ensure player IDs are non-null before passing to messaging template
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
    
    /**
     * Generates a unique game identifier.
     * 
     * @return a unique game ID
     */
    private String generateGameId() {
        return "game-" + UUID.randomUUID().toString();
    }
}
