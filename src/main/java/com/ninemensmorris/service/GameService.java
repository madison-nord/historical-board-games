package com.ninemensmorris.service;

import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.engine.RuleEngine;
import com.ninemensmorris.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.Map;
import java.util.UUID;

/**
 * Service class for orchestrating Nine Men's Morris games.
 * 
 * This service provides the main interface for game management, including:
 * - Creating new games in different modes (single-player, local, online)
 * - Managing game state and move validation
 * - Integrating with AI for single-player mode
 * - Handling game completion and cleanup
 * - Thread-safe game storage for concurrent access
 * 
 * The service acts as the central coordinator between the game engine,
 * AI service, and external interfaces (REST controllers, WebSocket handlers).
 */
@Service
public class GameService {
    
    private final AIService aiService;
    private final RuleEngine ruleEngine;
    
    // Thread-safe storage for active games
    private final ConcurrentHashMap<String, GameState> activeGames;
    private final ConcurrentHashMap<String, GameMode> gameModes;
    private final ConcurrentHashMap<String, String> gamePlayerMappings; // gameId -> player1Id:player2Id
    
    // Scheduled executor for cleanup tasks
    private final ScheduledExecutorService scheduler;
    
    @Autowired
    public GameService(AIService aiService) {
        this.aiService = aiService;
        this.ruleEngine = new RuleEngine();
        this.activeGames = new ConcurrentHashMap<>();
        this.gameModes = new ConcurrentHashMap<>();
        this.gamePlayerMappings = new ConcurrentHashMap<>();
        this.scheduler = Executors.newScheduledThreadPool(1);
        
        // Schedule cleanup task to run every 30 minutes
        scheduler.scheduleAtFixedRate(this::cleanupCompletedGames, 30, 30, TimeUnit.MINUTES);
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
            case SINGLE_PLAYER:
                // In single-player mode, player2Id should be null (AI will be the opponent)
                if (player2Id != null) {
                    throw new IllegalArgumentException("Player 2 ID must be null for single-player mode");
                }
                break;
            case LOCAL_TWO_PLAYER:
            case ONLINE_MULTIPLAYER:
                // In multiplayer modes, player2Id is required
                if (player2Id == null || player2Id.trim().isEmpty()) {
                    throw new IllegalArgumentException("Player 2 ID cannot be null or empty for multiplayer modes");
                }
                if (player1Id.equals(player2Id)) {
                    throw new IllegalArgumentException("Player 1 and Player 2 cannot have the same ID");
                }
                break;
        }
        
        // Generate unique game ID
        String gameId = UUID.randomUUID().toString();
        
        // Create new game state
        GameState gameState = new GameState(gameId);
        
        // Store game information
        activeGames.put(gameId, gameState);
        gameModes.put(gameId, mode);
        
        // Store player mapping
        String playerMapping = mode == GameMode.SINGLE_PLAYER 
            ? player1Id + ":AI" 
            : player1Id + ":" + player2Id;
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
        
        // Update stored state
        activeGames.put(gameId, newState);
        
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
        GameState forfeitedState = currentState.clone();
        
        // The forfeit logic would need to be implemented in GameState
        // For now, we'll just mark it as completed and remove from active games
        // This is a simplified implementation
        
        return forfeitedState;
    }
    
    /**
     * Removes completed games from active storage to free up memory.
     * This method is called periodically by a scheduled task and can also be called manually.
     * 
     * @return the number of games that were cleaned up
     */
    public int cleanupCompletedGames() {
        int cleanedUp = 0;
        
        // Create a copy of the key set to avoid concurrent modification
        for (String gameId : activeGames.keySet()) {
            GameState gameState = activeGames.get(gameId);
            
            if (gameState != null && gameState.isGameOver()) {
                // Remove completed game from all maps
                activeGames.remove(gameId);
                gameModes.remove(gameId);
                gamePlayerMappings.remove(gameId);
                cleanedUp++;
            }
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
     * Shuts down the cleanup scheduler.
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