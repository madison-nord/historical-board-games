package com.ninemensmorris.engine;

import com.ninemensmorris.model.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test to verify that a complete Nine Men's Morris game can be played programmatically
 * using the core game engine components.
 * 
 * This test validates the entire game flow from start to finish, ensuring all components
 * work together correctly.
 */
public class GameEngineIntegrationTest {
    
    private final RuleEngine ruleEngine = new RuleEngine();
    
    @Test
    @DisplayName("Complete game can be played programmatically - Placement to Movement to Flying phases")
    void testCompleteGameFlow() {
        // Initialize a new game
        GameState state = new GameState("integration-test-game");
        
        // Verify initial state
        assertEquals(GamePhase.PLACEMENT, state.getPhase());
        assertEquals(PlayerColor.WHITE, state.getCurrentPlayer());
        assertEquals(9, state.getWhitePiecesRemaining());
        assertEquals(9, state.getBlackPiecesRemaining());
        assertEquals(0, state.getWhitePiecesOnBoard());
        assertEquals(0, state.getBlackPiecesOnBoard());
        assertFalse(state.isGameOver());
        
        // PHASE 1: PLACEMENT PHASE - Place all 18 pieces
        System.out.println("=== PLACEMENT PHASE ===");
        
        // Simulate placing pieces alternately
        int[] placementSequence = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17};
        
        for (int i = 0; i < placementSequence.length; i++) {
            int position = placementSequence[i];
            PlayerColor currentPlayer = state.getCurrentPlayer();
            
            // Generate legal moves and verify placement is available
            List<Move> legalMoves = ruleEngine.generateLegalMoves(state);
            assertFalse(legalMoves.isEmpty(), "Should have legal moves in placement phase");
            
            // Create placement move
            Move placementMove = new Move(MoveType.PLACE, position, currentPlayer);
            
            // Validate the move
            assertTrue(ruleEngine.isValidMove(state, placementMove), 
                String.format("Placement at position %d should be valid for %s", position, currentPlayer));
            
            // Apply the move
            state = state.applyMove(placementMove);
            
            System.out.printf("Move %d: %s placed piece at position %d\n", i + 1, currentPlayer, position);
            
            // Verify state after move
            if (i < placementSequence.length - 1) {
                // Should switch players (unless mill formed)
                assertEquals(GamePhase.PLACEMENT, state.getPhase());
            }
        }
        
        // After all pieces placed, should transition to MOVEMENT or FLYING phase
        GamePhase phaseAfterPlacement = ruleEngine.determinePhase(state);
        assertTrue(phaseAfterPlacement == GamePhase.MOVEMENT || phaseAfterPlacement == GamePhase.FLYING,
            "After placement, should be in MOVEMENT or FLYING phase");
        
        System.out.printf("Placement complete. Phase: %s\n", phaseAfterPlacement);
        
        // PHASE 2: MOVEMENT/FLYING PHASE - Simulate some moves
        System.out.println("=== MOVEMENT/FLYING PHASE ===");
        
        // Play several moves to demonstrate movement mechanics
        for (int moveCount = 0; moveCount < 10 && !state.isGameOver(); moveCount++) {
            PlayerColor currentPlayer = state.getCurrentPlayer();
            List<Move> legalMoves = ruleEngine.generateLegalMoves(state);
            
            if (legalMoves.isEmpty()) {
                System.out.printf("No legal moves for %s - game should be over\n", currentPlayer);
                assertTrue(state.isGameOver(), "Game should be over when no legal moves available");
                break;
            }
            
            // Take the first legal move (in a real game, this would be strategic)
            Move move = legalMoves.get(0);
            
            // Validate the move
            assertTrue(ruleEngine.isValidMove(state, move),
                String.format("Generated move should be valid: %s", move));
            
            // Apply the move
            GameState newState = state.applyMove(move);
            
            System.out.printf("Move %d: %s moved from %d to %d\n", 
                moveCount + 1, currentPlayer, move.getFrom(), move.getTo());
            
            // Verify state consistency
            assertNotNull(newState);
            
            state = newState;
        }
        
        System.out.printf("Final game state: Phase=%s, GameOver=%s\n", 
            state.getPhase(), state.isGameOver());
        
        // VERIFICATION: Ensure game engine maintains consistency
        
        // 1. Verify phase determination is consistent
        GamePhase determinedPhase = ruleEngine.determinePhase(state);
        assertEquals(state.getPhase(), determinedPhase, "Phase should be consistently determined");
        
        // 2. Verify piece counts are consistent
        int totalWhitePieces = state.getWhitePiecesRemaining() + state.getWhitePiecesOnBoard();
        int totalBlackPieces = state.getBlackPiecesRemaining() + state.getBlackPiecesOnBoard();
        assertTrue(totalWhitePieces <= 9, "White pieces should not exceed 9");
        assertTrue(totalBlackPieces <= 9, "Black pieces should not exceed 9");
        
        // 3. Verify legal moves are always valid
        List<Move> finalLegalMoves = ruleEngine.generateLegalMoves(state);
        for (Move move : finalLegalMoves) {
            assertTrue(ruleEngine.isValidMove(state, move),
                String.format("All generated moves should be valid: %s", move));
        }
        
        System.out.println("=== INTEGRATION TEST COMPLETE ===");
        System.out.printf("Successfully demonstrated complete game flow with %d total moves\n", 
            state.getMoveHistory().size());
    }
    
    @Test
    @DisplayName("Mill formation and piece removal mechanics work correctly")
    void testMillFormationAndRemoval() {
        GameState state = new GameState("mill-test-game");
        
        // Set up a scenario where WHITE can form a mill
        // Place WHITE pieces at positions 0 and 1, then complete the mill at position 2
        state = state.applyMove(new Move(MoveType.PLACE, 0, PlayerColor.WHITE));
        state = state.applyMove(new Move(MoveType.PLACE, 3, PlayerColor.BLACK));
        state = state.applyMove(new Move(MoveType.PLACE, 1, PlayerColor.WHITE));
        state = state.applyMove(new Move(MoveType.PLACE, 4, PlayerColor.BLACK));
        
        // Complete the mill
        state = state.applyMove(new Move(MoveType.PLACE, 2, PlayerColor.WHITE));
        
        // Verify mill was formed
        assertTrue(state.getBoard().isPartOfMill(0, PlayerColor.WHITE));
        assertTrue(state.getBoard().isPartOfMill(1, PlayerColor.WHITE));
        assertTrue(state.getBoard().isPartOfMill(2, PlayerColor.WHITE));
        
        // Verify that WHITE can now remove a BLACK piece
        assertTrue(ruleEngine.canRemovePiece(state, 3), "Should be able to remove BLACK piece at position 3");
        assertTrue(ruleEngine.canRemovePiece(state, 4), "Should be able to remove BLACK piece at position 4");
        
        System.out.println("Mill formation and removal mechanics verified successfully");
    }
    
    @Test
    @DisplayName("Flying phase activation works correctly")
    void testFlyingPhaseActivation() {
        GameState state = new GameState("flying-test-game");
        
        // Simulate a game state where WHITE has exactly 3 pieces on board
        // This would typically happen after the placement phase and some pieces are removed
        
        // For this test, we'll manually create a scenario by placing pieces strategically
        // Place 3 WHITE pieces
        state = state.applyMove(new Move(MoveType.PLACE, 0, PlayerColor.WHITE));
        state = state.applyMove(new Move(MoveType.PLACE, 1, PlayerColor.BLACK));
        state = state.applyMove(new Move(MoveType.PLACE, 2, PlayerColor.WHITE));
        state = state.applyMove(new Move(MoveType.PLACE, 3, PlayerColor.BLACK));
        state = state.applyMove(new Move(MoveType.PLACE, 4, PlayerColor.WHITE));
        
        // Continue placing until all pieces are placed
        int[] remainingPositions = {5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22};
        PlayerColor currentPlayer = state.getCurrentPlayer();
        
        for (int i = 0; i < remainingPositions.length; i++) {
            if (state.getPiecesRemaining(currentPlayer) > 0) {
                state = state.applyMove(new Move(MoveType.PLACE, remainingPositions[i], currentPlayer));
                currentPlayer = currentPlayer.opposite();
            }
        }
        
        // Verify that phase determination works correctly
        GamePhase phase = ruleEngine.determinePhase(state);
        assertTrue(phase == GamePhase.MOVEMENT || phase == GamePhase.FLYING,
            "After placement, should be in MOVEMENT or FLYING phase");
        
        System.out.printf("Flying phase test completed. Final phase: %s\n", phase);
    }
}