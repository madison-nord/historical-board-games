package com.ninemensmorris.service;

import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for GameService.
 * 
 * Tests cover game creation, move handling, AI integration, forfeit functionality,
 * and game cleanup to ensure the service layer works correctly.
 * 
 * Note: These tests use real AIService instances instead of mocks to avoid
 * Java 25 compatibility issues with Mockito/Byte Buddy.
 */
public class GameServiceTest {
    
    private GameService gameService;
    private AIService aiService;
    
    @BeforeEach
    void setUp() {
        aiService = new AIService();
        gameService = new GameService(aiService);
    }
    
    // Game Creation Tests
    
    @Test
    @DisplayName("Create single-player game successfully")
    void testCreateSinglePlayerGame() {
        String player1Id = "human-player";
        
        GameState gameState = gameService.createGame(GameMode.SINGLE_PLAYER, player1Id, null);
        
        assertNotNull(gameState, "Game state should not be null");
        assertNotNull(gameState.getGameId(), "Game ID should not be null");
        assertEquals(GamePhase.PLACEMENT, gameState.getPhase(), "Game should start in placement phase");
        assertEquals(PlayerColor.WHITE, gameState.getCurrentPlayer(), "Game should start with WHITE player");
        assertEquals(GameMode.SINGLE_PLAYER, gameService.getGameMode(gameState.getGameId()));
        assertEquals("human-player:AI", gameService.getPlayerMapping(gameState.getGameId()));
    }
    
    @Test
    @DisplayName("Create local two-player game successfully")
    void testCreateLocalTwoPlayerGame() {
        String player1Id = "player1";
        String player2Id = "player2";
        
        GameState gameState = gameService.createGame(GameMode.LOCAL_TWO_PLAYER, player1Id, player2Id);
        
        assertNotNull(gameState, "Game state should not be null");
        assertNotNull(gameState.getGameId(), "Game ID should not be null");
        assertEquals(GamePhase.PLACEMENT, gameState.getPhase(), "Game should start in placement phase");
        assertEquals(PlayerColor.WHITE, gameState.getCurrentPlayer(), "Game should start with WHITE player");
        assertEquals(GameMode.LOCAL_TWO_PLAYER, gameService.getGameMode(gameState.getGameId()));
        assertEquals("player1:player2", gameService.getPlayerMapping(gameState.getGameId()));
    }
    
    @Test
    @DisplayName("Create online multiplayer game successfully")
    void testCreateOnlineMultiplayerGame() {
        String player1Id = "online-player1";
        String player2Id = "online-player2";
        
        GameState gameState = gameService.createGame(GameMode.ONLINE_MULTIPLAYER, player1Id, player2Id);
        
        assertNotNull(gameState, "Game state should not be null");
        assertNotNull(gameState.getGameId(), "Game ID should not be null");
        assertEquals(GamePhase.PLACEMENT, gameState.getPhase(), "Game should start in placement phase");
        assertEquals(PlayerColor.WHITE, gameState.getCurrentPlayer(), "Game should start with WHITE player");
        assertEquals(GameMode.ONLINE_MULTIPLAYER, gameService.getGameMode(gameState.getGameId()));
        assertEquals("online-player1:online-player2", gameService.getPlayerMapping(gameState.getGameId()));
    }
    
    @Test
    @DisplayName("Reject game creation with null mode")
    void testCreateGameWithNullMode() {
        assertThrows(IllegalArgumentException.class, () -> {
            gameService.createGame(null, "player1", "player2");
        }, "Should throw exception for null game mode");
    }
    
    @Test
    @DisplayName("Reject game creation with null player1 ID")
    void testCreateGameWithNullPlayer1() {
        assertThrows(IllegalArgumentException.class, () -> {
            gameService.createGame(GameMode.SINGLE_PLAYER, null, null);
        }, "Should throw exception for null player1 ID");
    }
    
    @Test
    @DisplayName("Reject game creation with empty player1 ID")
    void testCreateGameWithEmptyPlayer1() {
        assertThrows(IllegalArgumentException.class, () -> {
            gameService.createGame(GameMode.SINGLE_PLAYER, "  ", null);
        }, "Should throw exception for empty player1 ID");
    }
    
    @Test
    @DisplayName("Reject single-player game with non-null player2 ID")
    void testCreateSinglePlayerGameWithPlayer2() {
        assertThrows(IllegalArgumentException.class, () -> {
            gameService.createGame(GameMode.SINGLE_PLAYER, "player1", "player2");
        }, "Should throw exception when player2 ID is provided for single-player mode");
    }
    
    @Test
    @DisplayName("Reject multiplayer game with null player2 ID")
    void testCreateMultiplayerGameWithNullPlayer2() {
        assertThrows(IllegalArgumentException.class, () -> {
            gameService.createGame(GameMode.LOCAL_TWO_PLAYER, "player1", null);
        }, "Should throw exception when player2 ID is null for multiplayer mode");
    }
    
    @Test
    @DisplayName("Reject multiplayer game with same player IDs")
    void testCreateMultiplayerGameWithSamePlayerIds() {
        assertThrows(IllegalArgumentException.class, () -> {
            gameService.createGame(GameMode.LOCAL_TWO_PLAYER, "player1", "player1");
        }, "Should throw exception when both players have the same ID");
    }
    
    // Game Retrieval Tests
    
    @Test
    @DisplayName("Retrieve existing game successfully")
    void testGetExistingGame() {
        GameState createdGame = gameService.createGame(GameMode.SINGLE_PLAYER, "player1", null);
        String gameId = createdGame.getGameId();
        
        GameState retrievedGame = gameService.getGame(gameId);
        
        assertNotNull(retrievedGame, "Retrieved game should not be null");
        assertEquals(gameId, retrievedGame.getGameId(), "Game IDs should match");
        assertEquals(createdGame.getPhase(), retrievedGame.getPhase(), "Game phases should match");
    }
    
    @Test
    @DisplayName("Return null for non-existent game")
    void testGetNonExistentGame() {
        GameState retrievedGame = gameService.getGame("non-existent-id");
        
        assertNull(retrievedGame, "Should return null for non-existent game");
    }
    
    @Test
    @DisplayName("Reject game retrieval with null ID")
    void testGetGameWithNullId() {
        assertThrows(IllegalArgumentException.class, () -> {
            gameService.getGame(null);
        }, "Should throw exception for null game ID");
    }
    
    @Test
    @DisplayName("Reject game retrieval with empty ID")
    void testGetGameWithEmptyId() {
        assertThrows(IllegalArgumentException.class, () -> {
            gameService.getGame("  ");
        }, "Should throw exception for empty game ID");
    }
    
    // Move Application Tests
    
    @Test
    @DisplayName("Apply valid move successfully")
    void testMakeValidMove() {
        GameState game = gameService.createGame(GameMode.SINGLE_PLAYER, "player1", null);
        String gameId = game.getGameId();
        Move validMove = new Move(MoveType.PLACE, 0, PlayerColor.WHITE);
        
        GameState updatedGame = gameService.makeMove(gameId, validMove);
        
        assertNotNull(updatedGame, "Updated game should not be null");
        assertEquals(gameId, updatedGame.getGameId(), "Game ID should remain the same");
        assertEquals(PlayerColor.BLACK, updatedGame.getCurrentPlayer(), "Current player should switch to BLACK");
        assertFalse(updatedGame.getBoard().isPositionEmpty(0), "Position 0 should now be occupied");
    }
    
    @Test
    @DisplayName("Reject move on non-existent game")
    void testMakeMoveOnNonExistentGame() {
        Move move = new Move(MoveType.PLACE, 0, PlayerColor.WHITE);
        
        assertThrows(IllegalStateException.class, () -> {
            gameService.makeMove("non-existent-id", move);
        }, "Should throw exception for non-existent game");
    }
    
    @Test
    @DisplayName("Reject invalid move")
    void testMakeInvalidMove() {
        GameState game = gameService.createGame(GameMode.SINGLE_PLAYER, "player1", null);
        String gameId = game.getGameId();
        
        // Try to place a piece for the wrong player
        Move invalidMove = new Move(MoveType.PLACE, 0, PlayerColor.BLACK);
        
        assertThrows(IllegalStateException.class, () -> {
            gameService.makeMove(gameId, invalidMove);
        }, "Should throw exception for invalid move");
    }
    
    @Test
    @DisplayName("Reject move with null parameters")
    void testMakeMoveWithNullParameters() {
        GameState game = gameService.createGame(GameMode.SINGLE_PLAYER, "player1", null);
        String gameId = game.getGameId();
        
        // Test null game ID
        assertThrows(IllegalArgumentException.class, () -> {
            gameService.makeMove(null, new Move(MoveType.PLACE, 0, PlayerColor.WHITE));
        }, "Should throw exception for null game ID");
        
        // Test null move
        assertThrows(IllegalArgumentException.class, () -> {
            gameService.makeMove(gameId, null);
        }, "Should throw exception for null move");
    }
    
    // AI Integration Tests
    
    @Test
    @DisplayName("Get AI move for single-player game")
    void testGetAIMoveForSinglePlayerGame() {
        // Create game and make first move to set up AI's turn
        GameState game = gameService.createGame(GameMode.SINGLE_PLAYER, "player1", null);
        String gameId = game.getGameId();
        gameService.makeMove(gameId, new Move(MoveType.PLACE, 0, PlayerColor.WHITE));
        
        // Get AI move
        Move aiMove = gameService.getAIMove(gameId);
        
        assertNotNull(aiMove, "AI move should not be null");
        assertEquals(MoveType.PLACE, aiMove.getType(), "AI should make a placement move");
        assertEquals(PlayerColor.BLACK, aiMove.getPlayer(), "AI should play as BLACK");
        assertTrue(aiMove.getTo() >= 0 && aiMove.getTo() < 24, "AI move should be to a valid position");
        assertNotEquals(0, aiMove.getTo(), "AI should not place on occupied position");
    }
    
    @Test
    @DisplayName("Reject AI move request for non-single-player game")
    void testGetAIMoveForNonSinglePlayerGame() {
        GameState game = gameService.createGame(GameMode.LOCAL_TWO_PLAYER, "player1", "player2");
        String gameId = game.getGameId();
        
        assertThrows(IllegalStateException.class, () -> {
            gameService.getAIMove(gameId);
        }, "Should throw exception for non-single-player game");
    }
    
    @Test
    @DisplayName("Reject AI move request when it's not AI's turn")
    void testGetAIMoveWhenNotAITurn() {
        GameState game = gameService.createGame(GameMode.SINGLE_PLAYER, "player1", null);
        String gameId = game.getGameId();
        
        // It's WHITE's turn (human player), not AI's turn
        assertThrows(IllegalStateException.class, () -> {
            gameService.getAIMove(gameId);
        }, "Should throw exception when it's not AI's turn");
    }
    
    @Test
    @DisplayName("AI integration works end-to-end")
    void testAIIntegrationEndToEnd() {
        // Create single-player game
        GameState game = gameService.createGame(GameMode.SINGLE_PLAYER, "player1", null);
        String gameId = game.getGameId();
        
        // Make several moves alternating between human and AI
        for (int i = 0; i < 6; i++) {
            GameState currentState = gameService.getGame(gameId);
            
            if (currentState.getCurrentPlayer() == PlayerColor.WHITE) {
                // Human player move
                Move humanMove = new Move(MoveType.PLACE, i * 2, PlayerColor.WHITE);
                gameService.makeMove(gameId, humanMove);
            } else {
                // AI move
                Move aiMove = gameService.getAIMove(gameId);
                assertNotNull(aiMove, "AI should provide a move");
                gameService.makeMove(gameId, aiMove);
            }
        }
        
        // Verify game progressed correctly
        GameState finalState = gameService.getGame(gameId);
        assertTrue(finalState.getPiecesOnBoard(PlayerColor.WHITE) >= 3, "WHITE should have placed pieces");
        assertTrue(finalState.getPiecesOnBoard(PlayerColor.BLACK) >= 3, "BLACK (AI) should have placed pieces");
    }
    
    // Forfeit Tests
    
    @Test
    @DisplayName("Forfeit game successfully")
    void testForfeitGame() {
        GameState game = gameService.createGame(GameMode.LOCAL_TWO_PLAYER, "player1", "player2");
        String gameId = game.getGameId();
        
        GameState forfeitedGame = gameService.forfeitGame(gameId, "player1");
        
        assertNotNull(forfeitedGame, "Forfeited game should not be null");
        assertEquals(gameId, forfeitedGame.getGameId(), "Game ID should remain the same");
    }
    
    @Test
    @DisplayName("Reject forfeit for non-existent game")
    void testForfeitNonExistentGame() {
        assertThrows(IllegalStateException.class, () -> {
            gameService.forfeitGame("non-existent-id", "player1");
        }, "Should throw exception for non-existent game");
    }
    
    @Test
    @DisplayName("Reject forfeit for player not in game")
    void testForfeitByNonParticipant() {
        GameState game = gameService.createGame(GameMode.LOCAL_TWO_PLAYER, "player1", "player2");
        String gameId = game.getGameId();
        
        assertThrows(IllegalStateException.class, () -> {
            gameService.forfeitGame(gameId, "player3");
        }, "Should throw exception for player not in game");
    }
    
    @Test
    @DisplayName("Reject forfeit with null parameters")
    void testForfeitWithNullParameters() {
        GameState game = gameService.createGame(GameMode.LOCAL_TWO_PLAYER, "player1", "player2");
        String gameId = game.getGameId();
        
        // Test null game ID
        assertThrows(IllegalArgumentException.class, () -> {
            gameService.forfeitGame(null, "player1");
        }, "Should throw exception for null game ID");
        
        // Test null player ID
        assertThrows(IllegalArgumentException.class, () -> {
            gameService.forfeitGame(gameId, null);
        }, "Should throw exception for null player ID");
    }
    
    // Game Cleanup Tests
    
    @Test
    @DisplayName("Cleanup completed games")
    void testCleanupCompletedGames() {
        // Create a game and simulate completion
        GameState game = gameService.createGame(GameMode.SINGLE_PLAYER, "player1", null);
        String gameId = game.getGameId();
        
        // Initially should have 1 active game
        assertEquals(1, gameService.getActiveGameCount(), "Should have 1 active game");
        
        // For this test, we can't easily simulate a completed game without
        // playing through the entire game, so we'll test the method runs without error
        int cleanedUp = gameService.cleanupCompletedGames();
        
        // Since our game is not completed, nothing should be cleaned up
        assertEquals(0, cleanedUp, "Should not clean up active games");
        assertEquals(1, gameService.getActiveGameCount(), "Should still have 1 active game");
    }
    
    @Test
    @DisplayName("Get active game count")
    void testGetActiveGameCount() {
        assertEquals(0, gameService.getActiveGameCount(), "Should start with 0 active games");
        
        gameService.createGame(GameMode.SINGLE_PLAYER, "player1", null);
        assertEquals(1, gameService.getActiveGameCount(), "Should have 1 active game");
        
        gameService.createGame(GameMode.LOCAL_TWO_PLAYER, "player2", "player3");
        assertEquals(2, gameService.getActiveGameCount(), "Should have 2 active games");
    }
    
    // Utility Method Tests
    
    @Test
    @DisplayName("Get game mode for existing game")
    void testGetGameMode() {
        GameState game = gameService.createGame(GameMode.ONLINE_MULTIPLAYER, "player1", "player2");
        String gameId = game.getGameId();
        
        GameMode mode = gameService.getGameMode(gameId);
        
        assertEquals(GameMode.ONLINE_MULTIPLAYER, mode, "Should return correct game mode");
    }
    
    @Test
    @DisplayName("Get null game mode for non-existent game")
    void testGetGameModeForNonExistentGame() {
        GameMode mode = gameService.getGameMode("non-existent-id");
        
        assertNull(mode, "Should return null for non-existent game");
    }
    
    @Test
    @DisplayName("Get player mapping for existing game")
    void testGetPlayerMapping() {
        GameState game = gameService.createGame(GameMode.LOCAL_TWO_PLAYER, "alice", "bob");
        String gameId = game.getGameId();
        
        String mapping = gameService.getPlayerMapping(gameId);
        
        assertEquals("alice:bob", mapping, "Should return correct player mapping");
    }
    
    @Test
    @DisplayName("Get null player mapping for non-existent game")
    void testGetPlayerMappingForNonExistentGame() {
        String mapping = gameService.getPlayerMapping("non-existent-id");
        
        assertNull(mapping, "Should return null for non-existent game");
    }
}