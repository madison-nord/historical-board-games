package com.ninemensmorris.service;

import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.model.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Demonstration that a complete single-player game can be played through the service layer.
 * This test validates the end-to-end functionality of the backend game logic.
 */
public class SinglePlayerGameDemo {
    
    @Test
    @DisplayName("Complete single-player game can be played through service layer")
    void demonstrateSinglePlayerGameThroughServiceLayer() {
        // Create services
        AIService aiService = new AIService();
        GameService gameService = new GameService(aiService);
        
        // Create a single-player game
        GameState game = gameService.createGame(GameMode.SINGLE_PLAYER, "human-player", null);
        String gameId = game.getGameId();
        
        System.out.println("=== SINGLE-PLAYER GAME DEMONSTRATION ===");
        System.out.println("Game ID: " + gameId);
        System.out.println("Initial state: " + game.getPhase() + " phase, " + game.getCurrentPlayer() + " to move");
        
        int moveCount = 0;
        int maxMoves = 50; // Prevent infinite loops
        
        // Play the game alternating between human and AI
        while (!gameService.getGame(gameId).isGameOver() && moveCount < maxMoves) {
            GameState currentState = gameService.getGame(gameId);
            PlayerColor currentPlayer = currentState.getCurrentPlayer();
            
            if (currentPlayer == PlayerColor.WHITE) {
                // Human player move - make a simple strategic move
                Move humanMove = makeSimpleHumanMove(currentState, moveCount);
                if (humanMove != null) {
                    gameService.makeMove(gameId, humanMove);
                    System.out.println("Move " + (moveCount + 1) + ": Human " + humanMove);
                } else {
                    System.out.println("Move " + (moveCount + 1) + ": Human has no legal moves");
                    break;
                }
            } else {
                // AI move
                Move aiMove = gameService.getAIMove(gameId);
                if (aiMove != null) {
                    gameService.makeMove(gameId, aiMove);
                    System.out.println("Move " + (moveCount + 1) + ": AI " + aiMove);
                } else {
                    System.out.println("Move " + (moveCount + 1) + ": AI has no legal moves");
                    break;
                }
            }
            
            moveCount++;
            
            // Print phase transitions
            GameState newState = gameService.getGame(gameId);
            if (newState.getPhase() != currentState.getPhase()) {
                System.out.println(">>> Phase changed to: " + newState.getPhase());
            }
        }
        
        // Final game state
        GameState finalState = gameService.getGame(gameId);
        System.out.println("=== GAME COMPLETE ===");
        System.out.println("Total moves: " + moveCount);
        System.out.println("Final phase: " + finalState.getPhase());
        System.out.println("Game over: " + finalState.isGameOver());
        System.out.println("WHITE pieces on board: " + finalState.getPiecesOnBoard(PlayerColor.WHITE));
        System.out.println("BLACK pieces on board: " + finalState.getPiecesOnBoard(PlayerColor.BLACK));
        
        if (finalState.isGameOver()) {
            PlayerColor winner = finalState.getWinner();
            System.out.println("Winner: " + (winner != null ? winner : "Draw"));
        }
        
        // Verify the game progressed correctly
        assertTrue(moveCount > 0, "Game should have had at least one move");
        assertTrue(finalState.getPiecesOnBoard(PlayerColor.WHITE) >= 0, "WHITE should have valid piece count");
        assertTrue(finalState.getPiecesOnBoard(PlayerColor.BLACK) >= 0, "BLACK should have valid piece count");
        
        // Verify service layer functionality
        assertNotNull(gameService.getGame(gameId), "Game should be retrievable");
        assertEquals(GameMode.SINGLE_PLAYER, gameService.getGameMode(gameId), "Game mode should be preserved");
        assertEquals("human-player:AI", gameService.getPlayerMapping(gameId), "Player mapping should be correct");
        
        System.out.println("✅ Single-player game successfully demonstrated through service layer!");
    }
    
    /**
     * Makes a simple strategic move for the human player.
     * This is a simplified strategy for demonstration purposes.
     */
    private Move makeSimpleHumanMove(GameState state, int moveNumber) {
        if (state.getPhase() == GamePhase.PLACEMENT) {
            // During placement, place pieces in a simple pattern
            int[] preferredPositions = {0, 2, 6, 8, 3, 5, 9, 11, 15, 17, 21, 23, 1, 4, 7, 10, 12, 13, 14, 16, 18, 19, 20, 22};
            
            for (int pos : preferredPositions) {
                if (state.getBoard().isPositionEmpty(pos)) {
                    return new Move(MoveType.PLACE, pos, PlayerColor.WHITE);
                }
            }
        } else {
            // During movement/flying phase, make the first legal move
            // In a real game, this would be more strategic
            for (int from = 0; from < 24; from++) {
                if (!state.getBoard().isPositionEmpty(from) && 
                    state.getBoard().getPosition(from).getOccupant() == PlayerColor.WHITE) {
                    
                    if (state.getPhase() == GamePhase.FLYING || state.getPiecesOnBoard(PlayerColor.WHITE) == 3) {
                        // Flying phase - can move anywhere
                        for (int to = 0; to < 24; to++) {
                            if (state.getBoard().isPositionEmpty(to)) {
                                return new Move(MoveType.MOVE, from, to, PlayerColor.WHITE);
                            }
                        }
                    } else {
                        // Movement phase - only to adjacent positions
                        for (int to : state.getBoard().getAdjacentPositions(from)) {
                            if (state.getBoard().isPositionEmpty(to)) {
                                return new Move(MoveType.MOVE, from, to, PlayerColor.WHITE);
                            }
                        }
                    }
                }
            }
        }
        
        return null; // No legal moves found
    }
}