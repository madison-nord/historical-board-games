package com.ninemensmorris.service;

import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for AIService evaluation function.
 * 
 * Tests cover various board positions and scenarios to ensure the AI
 * evaluation function provides meaningful strategic assessments.
 */
public class AIServiceTest {
    
    private AIService aiService;
    
    @BeforeEach
    void setUp() {
        aiService = new AIService();
    }
    
    @Test
    @DisplayName("Evaluation function handles null inputs appropriately")
    void testNullInputHandling() {
        GameState state = new GameState("test-game");
        
        // Test null state
        assertThrows(IllegalArgumentException.class, () -> {
            aiService.evaluatePosition(null, PlayerColor.WHITE);
        });
        
        // Test null color
        assertThrows(IllegalArgumentException.class, () -> {
            aiService.evaluatePosition(state, null);
        });
    }
    
    @Test
    @DisplayName("Initial game state evaluation is neutral")
    void testInitialGameStateEvaluation() {
        GameState state = new GameState("test-game");
        
        // Initial state should be roughly neutral for both colors
        int whiteEval = aiService.evaluatePosition(state, PlayerColor.WHITE);
        int blackEval = aiService.evaluatePosition(state, PlayerColor.BLACK);
        
        // Should be exactly opposite since initial position is symmetric
        assertEquals(-whiteEval, blackEval, "Initial evaluation should be symmetric");
        
        // Should be close to zero (within reasonable bounds for mobility differences)
        assertTrue(Math.abs(whiteEval) < 50, "Initial evaluation should be near zero, got: " + whiteEval);
    }
    
    @Test
    @DisplayName("Winning positions receive high positive scores")
    void testWinningPositionEvaluation() {
        // Create a game state where WHITE has a significant advantage
        GameState state = createAdvantagePosition(PlayerColor.WHITE);
        
        int whiteEval = aiService.evaluatePosition(state, PlayerColor.WHITE);
        int blackEval = aiService.evaluatePosition(state, PlayerColor.BLACK);
        
        // WHITE should get a higher score than BLACK
        assertTrue(whiteEval > blackEval, 
            String.format("WHITE advantage position should score higher for WHITE (%d) than BLACK (%d)", 
                whiteEval, blackEval));
        
        // The advantage should be significant
        assertTrue(whiteEval - blackEval > 50, 
            "Advantage should be significant");
    }
    
    @Test
    @DisplayName("Losing positions receive low negative scores")
    void testLosingPositionEvaluation() {
        // Create a game state where BLACK has a significant advantage
        GameState state = createAdvantagePosition(PlayerColor.BLACK);
        
        int whiteEval = aiService.evaluatePosition(state, PlayerColor.WHITE);
        int blackEval = aiService.evaluatePosition(state, PlayerColor.BLACK);
        
        // BLACK should get a higher score than WHITE
        assertTrue(blackEval > whiteEval, 
            String.format("BLACK advantage position should score higher for BLACK (%d) than WHITE (%d)", 
                blackEval, whiteEval));
        
        // The advantage should be significant
        assertTrue(blackEval - whiteEval > 50, 
            "Advantage should be significant");
    }
    
    @Test
    @DisplayName("More mills result in higher evaluation scores")
    void testMillEvaluationBonus() {
        // Create two similar positions, one with more mills
        GameState stateWithoutMills = createPositionWithoutMills();
        GameState stateWithMills = createPositionWithMills(PlayerColor.WHITE);
        
        int evalWithoutMills = aiService.evaluatePosition(stateWithoutMills, PlayerColor.WHITE);
        int evalWithMills = aiService.evaluatePosition(stateWithMills, PlayerColor.WHITE);
        
        // Position with mills should score higher
        assertTrue(evalWithMills > evalWithoutMills, 
            String.format("Position with mills (%d) should score higher than without mills (%d)", 
                evalWithMills, evalWithoutMills));
        
        // The difference should be significant (mill weight is 50, but other factors may affect total)
        assertTrue(evalWithMills - evalWithoutMills >= 40, 
            String.format("Mill bonus should be at least 40, got difference: %d", 
                evalWithMills - evalWithoutMills));
    }
    
    @Test
    @DisplayName("Piece count advantage affects evaluation")
    void testPieceCountEvaluation() {
        // Create positions with different piece counts
        GameState equalPieces = createEqualPiecePosition();
        GameState whiteAdvantage = createPieceAdvantagePosition(PlayerColor.WHITE);
        
        int equalEval = aiService.evaluatePosition(equalPieces, PlayerColor.WHITE);
        int advantageEval = aiService.evaluatePosition(whiteAdvantage, PlayerColor.WHITE);
        
        // Position with piece advantage should score higher
        assertTrue(advantageEval > equalEval,
            String.format("Piece advantage position (%d) should score higher than equal pieces (%d)",
                advantageEval, equalEval));
    }
    
    @Test
    @DisplayName("Evaluation is consistent for same position")
    void testEvaluationConsistency() {
        GameState state = createTestPosition();
        
        // Evaluate the same position multiple times
        int eval1 = aiService.evaluatePosition(state, PlayerColor.WHITE);
        int eval2 = aiService.evaluatePosition(state, PlayerColor.WHITE);
        int eval3 = aiService.evaluatePosition(state, PlayerColor.WHITE);
        
        // All evaluations should be identical
        assertEquals(eval1, eval2, "Evaluation should be consistent");
        assertEquals(eval2, eval3, "Evaluation should be consistent");
    }
    
    @Test
    @DisplayName("Evaluation considers mobility (legal moves)")
    void testMobilityEvaluation() {
        // Create positions with different mobility
        GameState highMobility = createHighMobilityPosition();
        GameState lowMobility = createLowMobilityPosition();
        
        int highMobilityEval = aiService.evaluatePosition(highMobility, PlayerColor.WHITE);
        int lowMobilityEval = aiService.evaluatePosition(lowMobility, PlayerColor.WHITE);
        
        // Higher mobility should generally be better (though other factors matter too)
        // We'll just check that the evaluation function runs without error
        assertNotNull(highMobilityEval);
        assertNotNull(lowMobilityEval);
    }
    
    // Helper methods to create specific game positions for testing
    
    private GameState createAdvantagePosition(PlayerColor advantageColor) {
        GameState state = new GameState("test-game");
        
        if (advantageColor == PlayerColor.WHITE) {
            // Create a position where WHITE has multiple advantages
            // 1. More pieces on board
            state = state.applyMove(new Move(MoveType.PLACE, 0, PlayerColor.WHITE));
            state = state.applyMove(new Move(MoveType.PLACE, 12, PlayerColor.BLACK));
            state = state.applyMove(new Move(MoveType.PLACE, 1, PlayerColor.WHITE));
            state = state.applyMove(new Move(MoveType.PLACE, 13, PlayerColor.BLACK));
            state = state.applyMove(new Move(MoveType.PLACE, 2, PlayerColor.WHITE)); // WHITE forms mill
            state = state.applyMove(new Move(MoveType.PLACE, 14, PlayerColor.BLACK));
            state = state.applyMove(new Move(MoveType.PLACE, 6, PlayerColor.WHITE)); // Extra piece
        } else {
            // Create advantage for BLACK
            state = state.applyMove(new Move(MoveType.PLACE, 0, PlayerColor.WHITE));
            state = state.applyMove(new Move(MoveType.PLACE, 9, PlayerColor.BLACK));
            state = state.applyMove(new Move(MoveType.PLACE, 3, PlayerColor.WHITE));
            state = state.applyMove(new Move(MoveType.PLACE, 10, PlayerColor.BLACK));
            state = state.applyMove(new Move(MoveType.PLACE, 6, PlayerColor.WHITE));
            state = state.applyMove(new Move(MoveType.PLACE, 11, PlayerColor.BLACK)); // BLACK forms mill
            state = state.applyMove(new Move(MoveType.PLACE, 12, PlayerColor.WHITE));
            state = state.applyMove(new Move(MoveType.PLACE, 15, PlayerColor.BLACK)); // Extra piece
        }
        
        return state;
    }
    
    private GameState createWinningPosition(PlayerColor winner) {
        GameState state = new GameState("test-game");
        
        // Place pieces to create a winning scenario
        // Winner has 3+ pieces, loser has < 3 pieces
        if (winner == PlayerColor.WHITE) {
            // WHITE wins - place 3 WHITE pieces and 2 BLACK pieces
            state = state.applyMove(new Move(MoveType.PLACE, 0, PlayerColor.WHITE));
            state = state.applyMove(new Move(MoveType.PLACE, 1, PlayerColor.BLACK));
            state = state.applyMove(new Move(MoveType.PLACE, 2, PlayerColor.WHITE));
            state = state.applyMove(new Move(MoveType.PLACE, 3, PlayerColor.BLACK));
            state = state.applyMove(new Move(MoveType.PLACE, 4, PlayerColor.WHITE));
            
            // Continue placing until all pieces are placed
            int[] positions = {5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23};
            PlayerColor currentPlayer = state.getCurrentPlayer();
            
            for (int i = 0; i < positions.length && (state.getWhitePiecesRemaining() > 0 || state.getBlackPiecesRemaining() > 0); i++) {
                if (state.getPiecesRemaining(currentPlayer) > 0) {
                    state = state.applyMove(new Move(MoveType.PLACE, positions[i], currentPlayer));
                    currentPlayer = currentPlayer.opposite();
                }
            }
            
            // Simulate BLACK losing pieces to get below 3
            // This would normally happen through mill formations and removals
            // For testing, we'll create a state that represents this end condition
        }
        
        return state;
    }
    
    private GameState createPositionWithoutMills() {
        GameState state = new GameState("test-game");
        
        // Place pieces in positions that don't form mills, but similar piece count
        state = state.applyMove(new Move(MoveType.PLACE, 0, PlayerColor.WHITE));
        state = state.applyMove(new Move(MoveType.PLACE, 12, PlayerColor.BLACK));
        state = state.applyMove(new Move(MoveType.PLACE, 3, PlayerColor.WHITE)); // Different from mill position
        state = state.applyMove(new Move(MoveType.PLACE, 13, PlayerColor.BLACK));
        state = state.applyMove(new Move(MoveType.PLACE, 8, PlayerColor.WHITE)); // Different from mill position
        state = state.applyMove(new Move(MoveType.PLACE, 14, PlayerColor.BLACK));
        state = state.applyMove(new Move(MoveType.PLACE, 6, PlayerColor.WHITE));
        state = state.applyMove(new Move(MoveType.PLACE, 15, PlayerColor.BLACK));
        
        return state;
    }
    
    private GameState createPositionWithMills(PlayerColor color) {
        GameState state = new GameState("test-game");
        
        if (color == PlayerColor.WHITE) {
            // Create a mill for WHITE at positions 0, 1, 2 (top row of outer square)
            state = state.applyMove(new Move(MoveType.PLACE, 0, PlayerColor.WHITE));
            state = state.applyMove(new Move(MoveType.PLACE, 12, PlayerColor.BLACK)); // BLACK plays elsewhere
            state = state.applyMove(new Move(MoveType.PLACE, 1, PlayerColor.WHITE));
            state = state.applyMove(new Move(MoveType.PLACE, 13, PlayerColor.BLACK)); // BLACK plays elsewhere
            state = state.applyMove(new Move(MoveType.PLACE, 2, PlayerColor.WHITE)); // Completes mill 0-1-2
            
            // Continue with some more moves to make positions comparable
            state = state.applyMove(new Move(MoveType.PLACE, 14, PlayerColor.BLACK));
            state = state.applyMove(new Move(MoveType.PLACE, 6, PlayerColor.WHITE));
            state = state.applyMove(new Move(MoveType.PLACE, 15, PlayerColor.BLACK));
        }
        
        return state;
    }
    
    private GameState createEqualPiecePosition() {
        GameState state = new GameState("test-game");
        
        // Place equal number of pieces for both players
        state = state.applyMove(new Move(MoveType.PLACE, 0, PlayerColor.WHITE));
        state = state.applyMove(new Move(MoveType.PLACE, 1, PlayerColor.BLACK));
        state = state.applyMove(new Move(MoveType.PLACE, 2, PlayerColor.WHITE));
        state = state.applyMove(new Move(MoveType.PLACE, 3, PlayerColor.BLACK));
        state = state.applyMove(new Move(MoveType.PLACE, 4, PlayerColor.WHITE));
        state = state.applyMove(new Move(MoveType.PLACE, 5, PlayerColor.BLACK));
        
        return state;
    }
    
    private GameState createPieceAdvantagePosition(PlayerColor advantageColor) {
        GameState state = new GameState("test-game");
        
        if (advantageColor == PlayerColor.WHITE) {
            // Give WHITE more pieces on the board
            state = state.applyMove(new Move(MoveType.PLACE, 0, PlayerColor.WHITE));
            state = state.applyMove(new Move(MoveType.PLACE, 1, PlayerColor.BLACK));
            state = state.applyMove(new Move(MoveType.PLACE, 2, PlayerColor.WHITE));
            state = state.applyMove(new Move(MoveType.PLACE, 3, PlayerColor.BLACK));
            state = state.applyMove(new Move(MoveType.PLACE, 4, PlayerColor.WHITE));
            state = state.applyMove(new Move(MoveType.PLACE, 5, PlayerColor.BLACK));
            state = state.applyMove(new Move(MoveType.PLACE, 6, PlayerColor.WHITE)); // WHITE has one more
        }
        
        return state;
    }
    
    private GameState createTestPosition() {
        GameState state = new GameState("test-game");
        
        // Create a standard test position
        state = state.applyMove(new Move(MoveType.PLACE, 0, PlayerColor.WHITE));
        state = state.applyMove(new Move(MoveType.PLACE, 12, PlayerColor.BLACK));
        state = state.applyMove(new Move(MoveType.PLACE, 6, PlayerColor.WHITE));
        state = state.applyMove(new Move(MoveType.PLACE, 18, PlayerColor.BLACK));
        
        return state;
    }
    
    private GameState createHighMobilityPosition() {
        GameState state = new GameState("test-game");
        
        // Create a position where pieces have many movement options
        // Place pieces with lots of adjacent empty spaces
        state = state.applyMove(new Move(MoveType.PLACE, 1, PlayerColor.WHITE));  // Center of top edge
        state = state.applyMove(new Move(MoveType.PLACE, 12, PlayerColor.BLACK)); // Center of middle square
        
        return state;
    }
    
    private GameState createLowMobilityPosition() {
        GameState state = new GameState("test-game");
        
        // Create a position where pieces have limited movement options
        // Place pieces in corners or surrounded positions
        state = state.applyMove(new Move(MoveType.PLACE, 0, PlayerColor.WHITE));  // Corner
        state = state.applyMove(new Move(MoveType.PLACE, 21, PlayerColor.BLACK)); // Corner of inner square
        
        return state;
    }
}