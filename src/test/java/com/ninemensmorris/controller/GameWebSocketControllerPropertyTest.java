package com.ninemensmorris.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Captor;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.ninemensmorris.dto.GameStateUpdate;
import com.ninemensmorris.dto.PlacePieceMessage;
import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.service.GameService;

import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.constraints.IntRange;

/**
 * Property-based tests for GameWebSocketController.
 * 
 * These tests validate correctness properties for WebSocket game state synchronization.
 */
public class GameWebSocketControllerPropertyTest {
    
    @Mock
    private GameService gameService;
    
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    
    @Captor
    private ArgumentCaptor<GameStateUpdate> updateCaptor;
    
    private GameWebSocketController controller;
    
    /**
     * Property 14: Game State Synchronization
     * 
     * For any valid move made in an online multiplayer game, both players should
     * receive a game state update containing the same board state and game phase.
     * 
     * Validates: Requirements 5.3
     */
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Property(tries = 100)
    void property14_gameStateSynchronization_bothPlayersReceiveIdenticalUpdates(
            @ForAll @IntRange(min = 0, max = 23) int position) {
        
        // Arrange
        MockitoAnnotations.openMocks(this);
        controller = new GameWebSocketController(gameService, messagingTemplate);
        
        String gameId = "game-test-123";
        String playerId = "player-1";
        
        // Create a real game state (immutable)
        GameState mockState = new GameState(gameId);
        
        when(gameService.placePiece(eq(gameId), eq(playerId), eq(position)))
            .thenReturn(mockState);
        
        PlacePieceMessage message = new PlacePieceMessage();
        message.setGameId(gameId);
        message.setPlayerId(playerId);
        message.setPosition(position);
        
        // Act
        controller.handlePlacePiece(message);
        
        // Assert - verify broadcast was called
        verify(messagingTemplate, times(1)).convertAndSend(
            eq("/topic/game/" + gameId),
            any(GameStateUpdate.class)
        );
        
        // Capture the broadcast message
        verify(messagingTemplate).convertAndSend(
            eq("/topic/game/" + gameId),
            updateCaptor.capture()
        );
        
        GameStateUpdate update = updateCaptor.getValue();
        
        // Verify the update contains the correct game state
        assertNotNull(update, "Game state update should not be null");
        assertEquals(gameId, update.getGameId(), "Game ID should match");
        assertEquals(mockState.getCurrentPlayer(), update.getCurrentPlayer(), "Current player should match");
        assertEquals(mockState.getPhase().name(), update.getPhase(), "Phase should match");
        assertEquals(mockState.getWhitePiecesRemaining(), update.getWhitePiecesRemaining(), "White pieces remaining should match");
        assertEquals(mockState.getBlackPiecesRemaining(), update.getBlackPiecesRemaining(), "Black pieces remaining should match");
        assertEquals(mockState.isMillFormed(), update.isMillFormed(), "Mill formed flag should match");
        assertEquals(mockState.isGameOver(), update.isGameOver(), "Game over flag should match");
    }
}
