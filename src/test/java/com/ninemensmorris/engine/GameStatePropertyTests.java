package com.ninemensmorris.engine;

import com.ninemensmorris.model.*;
import net.jqwik.api.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Property-based tests for GameState class using jqwik.
 * These tests validate universal properties that should hold across all valid game states.
 */
public class GameStatePropertyTests {
    
    /**
     * Property 6: Initial Game State
     * Validates: Requirements 1.6
     * 
     * For any newly created game, both players should start with exactly nine pieces
     * to place and an empty board.
     */
    @Property(tries = 100)
    @Label("Property 6: Initial Game State - all new games start with 9 pieces per player")
    void testInitialGameState(@ForAll("gameIds") String gameId) {
        GameState gameState = new GameState(gameId);
        
        // Both players should start with 9 pieces remaining
        assertEquals(9, gameState.getWhitePiecesRemaining(), 
            "White player should start with 9 pieces remaining");
        assertEquals(9, gameState.getBlackPiecesRemaining(), 
            "Black player should start with 9 pieces remaining");
        
        // Both players should start with 0 pieces on board
        assertEquals(0, gameState.getWhitePiecesOnBoard(), 
            "White player should start with 0 pieces on board");
        assertEquals(0, gameState.getBlackPiecesOnBoard(), 
            "Black player should start with 0 pieces on board");
        
        // Game should start in PLACEMENT phase
        assertEquals(GamePhase.PLACEMENT, gameState.getPhase(), 
            "Game should start in PLACEMENT phase");
        
        // WHITE should be the first player
        assertEquals(PlayerColor.WHITE, gameState.getCurrentPlayer(), 
            "WHITE should be the first player");
        
        // Game should be in progress
        assertEquals(GameStatus.IN_PROGRESS, gameState.getStatus(), 
            "Game should start in IN_PROGRESS status");
        
        // No winner initially
        assertNull(gameState.getWinner(), 
            "Game should not have a winner initially");
        
        // No mill should be formed initially
        assertFalse(gameState.isMillFormed(), 
            "No mill should be formed initially");
        
        // Move history should be empty
        assertTrue(gameState.getMoveHistory().isEmpty(), 
            "Move history should be empty initially");
        
        // Board should be empty (all positions should be empty)
        Board board = gameState.getBoard();
        for (int i = 0; i < 24; i++) {
            assertTrue(board.isPositionEmpty(i), 
                "Position " + i + " should be empty initially");
        }
        
        // Game should not be over
        assertFalse(gameState.isGameOver(), 
            "Game should not be over initially");
    }
    
    /**
     * Provides arbitrary game IDs for testing.
     */
    @Provide
    Arbitrary<String> gameIds() {
        return Arbitraries.strings()
            .withCharRange('a', 'z')
            .withCharRange('A', 'Z')
            .withCharRange('0', '9')
            .withChars('-', '_')
            .ofMinLength(1)
            .ofMaxLength(50);
    }
}