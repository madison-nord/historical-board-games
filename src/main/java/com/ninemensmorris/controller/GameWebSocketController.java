package com.ninemensmorris.controller;

import org.springframework.lang.NonNull;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.ninemensmorris.dto.GameStateUpdate;
import com.ninemensmorris.dto.MovePieceMessage;
import com.ninemensmorris.dto.PlacePieceMessage;
import com.ninemensmorris.dto.RemovePieceMessage;
import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.service.GameService;

/**
 * WebSocket controller for handling game moves in online multiplayer.
 * 
 * This controller handles:
 * - Place piece messages during placement phase
 * - Move piece messages during movement/flying phase
 * - Remove piece messages after mill formation
 * - Broadcasting game state updates to both players
 * 
 * All messages are validated before being applied to the game state.
 * Invalid moves result in exceptions that can be caught and handled by the client.
 */
@Controller
public class GameWebSocketController {
    
    private final GameService gameService;
    private final SimpMessagingTemplate messagingTemplate;
    
    /**
     * Creates a new GameWebSocketController.
     * 
     * @param gameService the game service for managing game state
     * @param messagingTemplate the messaging template for broadcasting updates
     */
    public GameWebSocketController(
            @NonNull GameService gameService,
            @NonNull SimpMessagingTemplate messagingTemplate) {
        this.gameService = gameService;
        this.messagingTemplate = messagingTemplate;
    }
    
    /**
     * Handles place piece messages from clients.
     * 
     * Validates the move, applies it to the game state, and broadcasts
     * the updated state to both players in the game.
     * 
     * @param message the place piece message containing game ID, player ID, and position
     * @throws IllegalArgumentException if the move is invalid
     */
    @MessageMapping("/game/place")
    public void handlePlacePiece(@NonNull PlacePieceMessage message) {
        // Apply the move through the game service
        GameState updatedState = gameService.placePiece(
            message.getGameId(),
            message.getPlayerId(),
            message.getPosition()
        );
        
        // Broadcast the updated state to both players
        broadcastGameState(message.getGameId(), updatedState);
    }
    
    /**
     * Handles move piece messages from clients.
     * 
     * Validates the move, applies it to the game state, and broadcasts
     * the updated state to both players in the game.
     * 
     * @param message the move piece message containing game ID, player ID, from and to positions
     * @throws IllegalArgumentException if the move is invalid
     */
    @MessageMapping("/game/move")
    public void handleMovePiece(@NonNull MovePieceMessage message) {
        // Apply the move through the game service
        GameState updatedState = gameService.movePiece(
            message.getGameId(),
            message.getPlayerId(),
            message.getFromPosition(),
            message.getToPosition()
        );
        
        // Broadcast the updated state to both players
        broadcastGameState(message.getGameId(), updatedState);
    }
    
    /**
     * Handles remove piece messages from clients.
     * 
     * Validates the removal, applies it to the game state, and broadcasts
     * the updated state to both players in the game.
     * 
     * @param message the remove piece message containing game ID, player ID, and position
     * @throws IllegalArgumentException if the removal is invalid
     */
    @MessageMapping("/game/remove")
    public void handleRemovePiece(@NonNull RemovePieceMessage message) {
        // Apply the removal through the game service
        GameState updatedState = gameService.removePiece(
            message.getGameId(),
            message.getPlayerId(),
            message.getPosition()
        );
        
        // Broadcast the updated state to both players
        broadcastGameState(message.getGameId(), updatedState);
    }
    
    /**
     * Broadcasts the current game state to all players in the game.
     * 
     * @param gameId the game ID
     * @param state the current game state
     */
    private void broadcastGameState(String gameId, GameState state) {
        GameStateUpdate update = new GameStateUpdate();
        update.setGameId(gameId);
        update.setCurrentPlayer(state.getCurrentPlayer());
        update.setPhase(state.getPhase().name()); // Use name() to get uppercase enum name
        update.setWhitePiecesRemaining(state.getWhitePiecesRemaining());
        update.setBlackPiecesRemaining(state.getBlackPiecesRemaining());
        update.setMillFormed(state.isMillFormed());
        update.setGameOver(state.isGameOver());
        
        // Broadcast to the game-specific topic
        messagingTemplate.convertAndSend("/topic/game/" + gameId, update);
    }
}
