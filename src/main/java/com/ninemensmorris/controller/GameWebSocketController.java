package com.ninemensmorris.controller;

import org.springframework.lang.NonNull;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.ninemensmorris.dto.GameEndMessage;
import com.ninemensmorris.dto.GameStateUpdate;
import com.ninemensmorris.dto.MovePieceMessage;
import com.ninemensmorris.dto.PlacePieceMessage;
import com.ninemensmorris.dto.RemovePieceMessage;
import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.model.PlayerColor;
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
     * Broadcasts the current game state to both players in the game.
     * Uses convertAndSendToUser to send to each player's user queue.
     * 
     * @param gameId the game ID
     * @param state the current game state
     */
    private void broadcastGameState(String gameId, GameState state) {
        GameStateUpdate update = new GameStateUpdate();
        update.setGameId(gameId);
        update.setCurrentPlayer(state.getCurrentPlayer());
        update.setPhase(state.getPhase().name());
        update.setWhitePiecesRemaining(state.getWhitePiecesRemaining());
        update.setBlackPiecesRemaining(state.getBlackPiecesRemaining());
        update.setWhitePiecesOnBoard(state.getWhitePiecesOnBoard());
        update.setBlackPiecesOnBoard(state.getBlackPiecesOnBoard());
        update.setMillFormed(state.isMillFormed());
        update.setGameOver(state.isGameOver());
        update.setWinner(state.getWinner());
        
        // Serialize board state as array of PlayerColor (null for empty)
        com.ninemensmorris.model.PlayerColor[] boardArray = new com.ninemensmorris.model.PlayerColor[24];
        for (int i = 0; i < 24; i++) {
            boardArray[i] = state.getBoard().getPosition(i).getOccupant();
        }
        update.setBoard(boardArray);
        
        // Send to each player via their user queue
        String playerMapping = gameService.getPlayerMapping(gameId);
        if (playerMapping != null) {
            String[] parts = playerMapping.split(":");
            if (parts.length == 2) {
                messagingTemplate.convertAndSendToUser(parts[0], "/queue/game-state", update);
                messagingTemplate.convertAndSendToUser(parts[1], "/queue/game-state", update);
                
                // Also send a GameEndMessage when the game is over
                if (state.isGameOver()) {
                    PlayerColor winner = state.getWinner();
                    String reason = determineGameEndReason(state);
                    GameEndMessage endMessage = new GameEndMessage(gameId, winner, reason);
                    messagingTemplate.convertAndSendToUser(parts[0], "/queue/game-end", endMessage);
                    messagingTemplate.convertAndSendToUser(parts[1], "/queue/game-end", endMessage);
                }
            }
        }
    }
    
    /**
     * Determines the reason the game ended based on the game state.
     * 
     * @param state the final game state
     * @return a human-readable reason for the game ending
     */
    private String determineGameEndReason(GameState state) {
        if (state.getWhitePiecesOnBoard() < 3) {
            return "White has fewer than 3 pieces";
        }
        if (state.getBlackPiecesOnBoard() < 3) {
            return "Black has fewer than 3 pieces";
        }
        return "No legal moves available";
    }
}
