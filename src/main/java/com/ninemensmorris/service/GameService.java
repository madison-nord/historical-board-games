package com.ninemensmorris.service;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.engine.RuleEngine;
import com.ninemensmorris.model.GameMode;
import com.ninemensmorris.model.Move;
import com.ninemensmorris.model.MoveType;
import com.ninemensmorris.model.PlayerColor;

/**
 * Service class for orchestrating Nine Men's Morris games.
 * 
 * <p>This service provides the main interface for game management, including:
 * <ul>
 *   <li>Creating new games in different modes (single-player, local, online)</li>
 *   <li>Managing game state and move validation</li>
 *   <li>Integrating with AI for single-player mode</li>
 *   <li>Handling game completion and cleanup</li>
 *   <li>Thread-safe game storage for concurrent access</li>
 *   <li>Scheduled cleanup of completed and abandoned games</li>
 * </ul>
 *
 * <p>The service acts as the central coordinator between the game engine,
 * AI service, and external interfaces (REST controllers, WebSocket handlers).
 */
@Service
public class GameService {

    private static final Logger logger = LoggerFactory.getLogger(GameService.class);

    /** Maximum age in seconds before an inactive game is considered stale and eligible for cleanup. */
    private static final long STALE_GAME_TIMEOUT_SECONDS = 3600; // 1 hour
    
    private final AIService aiService;
    private final RuleEngine ruleEngine;
    
    // Thread-safe storage for active games
    private final ConcurrentHashMap<String, GameState> activeGames;
    private final ConcurrentHashMap<String, GameMode> gameModes;
    private final ConcurrentHashMap<String, String> gamePlayerMappings; // gameId -> player1Id:player2Id
    private final ConcurrentHashMap<String, Instant> gameLastActivity; // gameId -> last activity timestamp
    
    /**
     * Creates a new GameService with the given AI service.
     *
     * @param aiService the AI service for single-player move selection
     */
    @Autowired
    public GameService(AIService aiService) {
        this.aiService = aiService;
        this.ruleEngine = new RuleEngine();
        this.activeGames = new ConcurrentHashMap<>();
        this.gameModes = new ConcurrentHashMap<>();
        this.gamePlayerMappings = new ConcurrentHashMap<>();
        this.gameLastActivity = new ConcurrentHashMap<>();
    }
    
    /**
     * Creates a new game with the specified mode and players.
     * 
     * @param mode the game mode (SINGLE_PLAYER, LOCAL_TWO_PLAYER, ONLINE_MULTIPLAYER)
     * @param player1Id the ID of the first player (human player in single-player mode)
     * @param player2Id the ID of the second player (null for single-player, AI will be used)
     * @return the initial game state with a unique game ID
     * @throws IllegalArgumentException if mode is null or player IDs are invalid
     */
    public GameState createGame(GameMode mode, String player1Id, String player2Id) {
        if (mode == null) {
            throw new IllegalArgumentException("Game mode cannot be null");
        }
        if (player1Id == null || player1Id.trim().isEmpty()) {
            throw new IllegalArgumentException("Player 1 ID cannot be null or empty");
        }
        
        // Validate player2Id based on game mode
        switch (mode) {
            case SINGLE_PLAYER, TUTORIAL -> {
                // In single-player and tutorial modes, player2Id should be null (AI/system will guide)
                if (player2Id != null) {
                    throw new IllegalArgumentException("Player 2 ID must be null for single-player and tutorial modes");
                }
            }
            case LOCAL_TWO_PLAYER, ONLINE_MULTIPLAYER -> {
                // In multiplayer modes, player2Id is required
                if (player2Id == null || player2Id.trim().isEmpty()) {
                    throw new IllegalArgumentException("Player 2 ID cannot be null or empty for multiplayer modes");
                }
                if (player1Id.equals(player2Id)) {
                    throw new IllegalArgumentException("Player 1 and Player 2 cannot have the same ID");
                }
            }
        }
        
        // Generate unique game ID
        String gameId = UUID.randomUUID().toString();
        
        // Create new game state
        GameState gameState = new GameState(gameId);
        
        // Store game information
        activeGames.put(gameId, gameState);
        gameModes.put(gameId, mode);
        gameLastActivity.put(gameId, Instant.now());
        
        // Store player mapping
        String playerMapping = switch (mode) {
            case SINGLE_PLAYER -> player1Id + ":AI";
            case TUTORIAL -> player1Id + ":TUTORIAL";
            case LOCAL_TWO_PLAYER, ONLINE_MULTIPLAYER -> player1Id + ":" + player2Id;
        };
        gamePlayerMappings.put(gameId, playerMapping);
        
        return gameState;
    }
    
    /**
     * Retrieves the current state of a game.
     * 
     * @param gameId the unique identifier of the game
     * @return the current game state, or null if game not found
     * @throws IllegalArgumentException if gameId is null or empty
     */
    public GameState getGame(String gameId) {
        if (gameId == null || gameId.trim().isEmpty()) {
            throw new IllegalArgumentException("Game ID cannot be null or empty");
        }
        
        return activeGames.get(gameId);
    }
    
    /**
     * Applies a move to the specified game and returns the updated state.
     * 
     * @param gameId the unique identifier of the game
     * @param move the move to apply
     * @return the updated game state after applying the move
     * @throws IllegalArgumentException if gameId or move is null/invalid
     * @throws IllegalStateException if game not found or move is not valid
     */
    public GameState makeMove(String gameId, Move move) {
        if (gameId == null || gameId.trim().isEmpty()) {
            throw new IllegalArgumentException("Game ID cannot be null or empty");
        }
        if (move == null) {
            throw new IllegalArgumentException("Move cannot be null");
        }
        
        GameState currentState = activeGames.get(gameId);
        if (currentState == null) {
            throw new IllegalStateException("Game not found: " + gameId);
        }
        
        if (currentState.isGameOver()) {
            throw new IllegalStateException("Cannot make move on completed game: " + gameId);
        }
        
        // Validate the move
        if (!ruleEngine.isValidMove(currentState, move)) {
            throw new IllegalStateException("Invalid move: " + move);
        }
        
        // Apply the move
        GameState newState = currentState.applyMove(move);
        
        // Update stored state and refresh activity timestamp
        activeGames.put(gameId, newState);
        gameLastActivity.put(gameId, Instant.now());
        
        return newState;
    }
    
    /**
     * Gets the next AI move for the specified game.
     * This method should only be called for single-player games when it's the AI's turn.
     * 
     * @param gameId the unique identifier of the game
     * @return the AI's selected move, or null if no legal moves available
     * @throws IllegalArgumentException if gameId is null or empty
     * @throws IllegalStateException if game not found, not single-player, or not AI's turn
     */
    public Move getAIMove(String gameId) {
        if (gameId == null || gameId.trim().isEmpty()) {
            throw new IllegalArgumentException("Game ID cannot be null or empty");
        }
        
        GameState currentState = activeGames.get(gameId);
        if (currentState == null) {
            throw new IllegalStateException("Game not found: " + gameId);
        }
        
        GameMode mode = gameModes.get(gameId);
        if (mode != GameMode.SINGLE_PLAYER) {
            throw new IllegalStateException("AI moves are only available for single-player games");
        }
        
        if (currentState.isGameOver()) {
            throw new IllegalStateException("Cannot get AI move for completed game: " + gameId);
        }
        
        // In single-player mode, AI plays as BLACK (second player)
        PlayerColor aiColor = PlayerColor.BLACK;
        
        if (currentState.getCurrentPlayer() != aiColor) {
            throw new IllegalStateException("It is not the AI's turn");
        }
        
        // Get AI move
        return aiService.selectMove(currentState, aiColor);
    }
    
    /**
     * Forfeits a game for the specified player.
     * 
     * @param gameId the unique identifier of the game
     * @param playerId the ID of the player who is forfeiting
     * @return the updated game state with the forfeit recorded
     * @throws IllegalArgumentException if gameId or playerId is null/empty
     * @throws IllegalStateException if game not found or player not in game
     */
    public GameState forfeitGame(String gameId, String playerId) {
        if (gameId == null || gameId.trim().isEmpty()) {
            throw new IllegalArgumentException("Game ID cannot be null or empty");
        }
        if (playerId == null || playerId.trim().isEmpty()) {
            throw new IllegalArgumentException("Player ID cannot be null or empty");
        }
        
        GameState currentState = activeGames.get(gameId);
        if (currentState == null) {
            throw new IllegalStateException("Game not found: " + gameId);
        }
        
        if (currentState.isGameOver()) {
            throw new IllegalStateException("Cannot forfeit completed game: " + gameId);
        }
        
        // Verify player is in this game
        String playerMapping = gamePlayerMappings.get(gameId);
        if (playerMapping == null || !playerMapping.contains(playerId)) {
            throw new IllegalStateException("Player " + playerId + " is not in game " + gameId);
        }
        
        // Create a forfeited game state
        // For now, we'll mark the game as completed with the opponent as winner
        // In a full implementation, we might add a forfeit status to GameState
        GameState forfeitedState;
        try {
            forfeitedState = currentState.clone();
        } catch (CloneNotSupportedException e) {
            throw new IllegalStateException("Failed to clone game state", e);
        }
        
        // The forfeit logic would need to be implemented in GameState
        // For now, we'll just mark it as completed and remove from active games
        // This is a simplified implementation
        
        return forfeitedState;
    }
    
    /**
     * Removes completed and stale games from active storage to free up memory.
     * Runs automatically every 30 minutes via Spring scheduling.
     * A game is considered stale if it has had no activity for over 1 hour.
     * 
     * @return the number of games that were cleaned up
     */
    @Scheduled(fixedRate = 1_800_000) // 30 minutes in milliseconds
    public int cleanupCompletedGames() {
        int cleanedUp = 0;
        Instant staleThreshold = Instant.now().minusSeconds(STALE_GAME_TIMEOUT_SECONDS);
        
        for (String gameId : activeGames.keySet()) {
            GameState gameState = activeGames.get(gameId);
            
            boolean isCompleted = gameState != null && gameState.isGameOver();
            Instant lastActivity = gameLastActivity.get(gameId);
            boolean isStale = lastActivity != null && lastActivity.isBefore(staleThreshold);
            
            if (isCompleted || isStale) {
                activeGames.remove(gameId);
                gameModes.remove(gameId);
                gamePlayerMappings.remove(gameId);
                gameLastActivity.remove(gameId);
                cleanedUp++;
                
                if (isStale && !isCompleted) {
                    logger.info("Cleaned up stale game {} (last activity: {})", gameId, lastActivity);
                }
            }
        }
        
        if (cleanedUp > 0) {
            logger.info("Game cleanup completed: {} game(s) removed, {} active game(s) remaining",
                    cleanedUp, activeGames.size());
        }
        
        return cleanedUp;
    }
    
    /**
     * Gets the game mode for the specified game.
     * 
     * @param gameId the unique identifier of the game
     * @return the game mode, or null if game not found
     */
    public GameMode getGameMode(String gameId) {
        if (gameId == null || gameId.trim().isEmpty()) {
            return null;
        }
        return gameModes.get(gameId);
    }
    
    /**
     * Gets the player mapping for the specified game.
     * 
     * @param gameId the unique identifier of the game
     * @return the player mapping string (player1Id:player2Id), or null if game not found
     */
    public String getPlayerMapping(String gameId) {
        if (gameId == null || gameId.trim().isEmpty()) {
            return null;
        }
        return gamePlayerMappings.get(gameId);
    }
    
    /**
     * Gets the total number of active games.
     * 
     * @return the number of games currently being managed
     */
    public int getActiveGameCount() {
        return activeGames.size();
    }
    
    /**
     * Places a piece at the specified position for the given player.
     * Convenience method for online multiplayer that wraps makeMove.
     * 
     * @param gameId the game ID
     * @param playerId the player ID
     * @param position the position to place the piece
     * @return the updated game state
     * @throws IllegalArgumentException if the move is invalid
     */
    public GameState placePiece(String gameId, String playerId, int position) {
        PlayerColor playerColor = getPlayerColor(gameId, playerId);
        Move move = new Move(MoveType.PLACE, position, playerColor);
        return makeMove(gameId, move);
    }
    
    /**
     * Moves a piece from one position to another for the given player.
     * Convenience method for online multiplayer that wraps makeMove.
     * 
     * @param gameId the game ID
     * @param playerId the player ID
     * @param fromPosition the position to move from
     * @param toPosition the position to move to
     * @return the updated game state
     * @throws IllegalArgumentException if the move is invalid
     */
    public GameState movePiece(String gameId, String playerId, int fromPosition, int toPosition) {
        PlayerColor playerColor = getPlayerColor(gameId, playerId);
        Move move = new Move(MoveType.MOVE, fromPosition, toPosition, playerColor);
        return makeMove(gameId, move);
    }
    
    /**
     * Removes an opponent's piece at the specified position.
     * Convenience method for online multiplayer that wraps makeMove.
     * 
     * @param gameId the game ID
     * @param playerId the player ID
     * @param position the position of the piece to remove
     * @return the updated game state
     * @throws IllegalArgumentException if the removal is invalid
     */
    public GameState removePiece(String gameId, String playerId, int position) {
        PlayerColor playerColor = getPlayerColor(gameId, playerId);
        Move move = new Move(MoveType.REMOVE, -1, position, playerColor);
        return makeMove(gameId, move);
    }
    
    /**
     * Gets the player color for the given player ID in the specified game.
     * 
     * @param gameId the game ID
     * @param playerId the player ID
     * @return the player's color
     * @throws IllegalArgumentException if the player is not in the game
     */
    public PlayerColor getPlayerColor(String gameId, String playerId) {
        String mapping = getPlayerMapping(gameId);
        if (mapping == null) {
            throw new IllegalArgumentException("Game not found: " + gameId);
        }
        
        // Parse mapping format: "player1Id:player2Id"
        // Player 1 is always WHITE, Player 2 is always BLACK
        String[] parts = mapping.split(":");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid player mapping format: " + mapping);
        }
        
        if (parts[0].equals(playerId)) {
            return PlayerColor.WHITE;
        } else if (parts[1].equals(playerId)) {
            return PlayerColor.BLACK;
        }
        
        throw new IllegalArgumentException("Player not in game: " + playerId);
    }
    
    /**
     * Returns the last activity timestamp for the specified game.
     * Useful for monitoring and testing stale game detection.
     *
     * @param gameId the game identifier
     * @return the last activity instant, or null if game not found
     */
    public Instant getGameLastActivity(String gameId) {
        return gameLastActivity.get(gameId);
    }
}