package com.ninemensmorris.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.ninemensmorris.dto.GameStateUpdate;
import com.ninemensmorris.dto.MovePieceMessage;
import com.ninemensmorris.dto.PlacePieceMessage;
import com.ninemensmorris.dto.RemovePieceMessage;
import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.model.GamePhase;
import com.ninemensmorris.model.PlayerColor;
import com.ninemensmorris.service.GameService;

/**
 * Unit tests for GameWebSocketController.
 * 
 * Tests verify that the WebSocket controller:
 * - Handles place piece messages correctly
 * - Handles move piece messages correctly
 * - Handles remove piece messages correctly
 * - Validates moves before applying them
 * - Broadcasts game state updates to both players
 * - Handles errors gracefully
 */
public class GameWebSocketControllerTest {
    
    private GameWebSocketController controller;
    private GameService gameService;
    private SimpMessagingTemplate messagingTemplate;
    
    @BeforeEach
    @SuppressWarnings({"unused", "null"}) // Used by JUnit framework, mock objects are non-null
    void setUp() {
        gameService = mock(GameService.class);
        messagingTemplate = mock(SimpMessagingTemplate.class);
        controller = new GameWebSocketController(gameService, messagingTemplate);
    }
    
    @Test
    @DisplayName("Handle place piece message - valid move")
    @SuppressWarnings("null") // Mock objects are non-null in test context
    void testHandlePlacePieceValid() {
        // Arrange
        PlacePieceMessage message = new PlacePieceMessage();
        message.setGameId("game-123");
        message.setPlayerId("player-1");
        message.setPosition(5);
        message.setPlayerColor(PlayerColor.WHITE);
        
        GameState mockState = mock(GameState.class);
        when(mockState.getCurrentPlayer()).thenReturn(PlayerColor.WHITE);
        when(mockState.getPhase()).thenReturn(GamePhase.PLACEMENT);
        when(mockState.isGameOver()).thenReturn(false);
        when(mockState.isMillFormed()).thenReturn(false);
        when(mockState.getWhitePiecesRemaining()).thenReturn(8);
        when(mockState.getBlackPiecesRemaining()).thenReturn(9);
        
        when(gameService.placePiece("game-123", "player-1", 5)).thenReturn(mockState);
        
        // Act
        controller.handlePlacePiece(message);
        
        // Assert
        verify(gameService).placePiece("game-123", "player-1", 5);
        verify(messagingTemplate).convertAndSend(eq("/topic/game/game-123"), any(GameStateUpdate.class));
    }
    
    @Test
    @DisplayName("Handle place piece message - invalid move throws exception")
    @SuppressWarnings("null") // Mock objects are non-null in test context
    void testHandlePlacePieceInvalid() {
        // Arrange
        PlacePieceMessage message = new PlacePieceMessage();
        message.setGameId("game-123");
        message.setPlayerId("player-1");
        message.setPosition(5);
        message.setPlayerColor(PlayerColor.WHITE);
        
        when(gameService.placePiece("game-123", "player-1", 5))
            .thenThrow(new IllegalArgumentException("Position already occupied"));
        
        // Act & Assert
        Exception exception = assertThrows(IllegalArgumentException.class, () -> controller.handlePlacePiece(message));
        assertNotNull(exception); // Verify exception was thrown
        verify(gameService).placePiece("game-123", "player-1", 5);
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }
    
    @Test
    @DisplayName("Handle move piece message - valid move")
    @SuppressWarnings("null") // Mock objects are non-null in test context
    void testHandleMovePieceValid() {
        // Arrange
        MovePieceMessage message = new MovePieceMessage();
        message.setGameId("game-456");
        message.setPlayerId("player-2");
        message.setFromPosition(3);
        message.setToPosition(7);
        message.setPlayerColor(PlayerColor.BLACK);
        
        GameState mockState = mock(GameState.class);
        when(mockState.getCurrentPlayer()).thenReturn(PlayerColor.BLACK);
        when(mockState.getPhase()).thenReturn(GamePhase.MOVEMENT);
        when(mockState.isGameOver()).thenReturn(false);
        when(mockState.isMillFormed()).thenReturn(false);
        when(mockState.getWhitePiecesRemaining()).thenReturn(7);
        when(mockState.getBlackPiecesRemaining()).thenReturn(8);
        
        when(gameService.movePiece("game-456", "player-2", 3, 7)).thenReturn(mockState);
        
        // Act
        controller.handleMovePiece(message);
        
        // Assert
        verify(gameService).movePiece("game-456", "player-2", 3, 7);
        verify(messagingTemplate).convertAndSend(eq("/topic/game/game-456"), any(GameStateUpdate.class));
    }
    
    @Test
    @DisplayName("Handle remove piece message - valid removal")
    @SuppressWarnings("null") // Mock objects are non-null in test context
    void testHandleRemovePieceValid() {
        // Arrange
        RemovePieceMessage message = new RemovePieceMessage();
        message.setGameId("game-789");
        message.setPlayerId("player-3");
        message.setPosition(12);
        message.setPlayerColor(PlayerColor.WHITE);
        
        GameState mockState = mock(GameState.class);
        when(mockState.getCurrentPlayer()).thenReturn(PlayerColor.WHITE);
        when(mockState.getPhase()).thenReturn(GamePhase.PLACEMENT);
        when(mockState.isGameOver()).thenReturn(false);
        when(mockState.isMillFormed()).thenReturn(false);
        when(mockState.getWhitePiecesRemaining()).thenReturn(9);
        when(mockState.getBlackPiecesRemaining()).thenReturn(8);
        
        when(gameService.removePiece("game-789", "player-3", 12)).thenReturn(mockState);
        
        // Act
        controller.handleRemovePiece(message);
        
        // Assert
        verify(gameService).removePiece("game-789", "player-3", 12);
        verify(messagingTemplate).convertAndSend(eq("/topic/game/game-789"), any(GameStateUpdate.class));
    }
    
    @Test
    @DisplayName("Broadcast game state update with correct data")
    @SuppressWarnings("null") // Mock objects are non-null in test context
    void testBroadcastGameStateUpdate() {
        // Arrange
        PlacePieceMessage message = new PlacePieceMessage();
        message.setGameId("game-abc");
        message.setPlayerId("player-1");
        message.setPosition(0);
        message.setPlayerColor(PlayerColor.WHITE);
        
        GameState mockState = mock(GameState.class);
        when(mockState.getCurrentPlayer()).thenReturn(PlayerColor.BLACK);
        when(mockState.getPhase()).thenReturn(GamePhase.PLACEMENT);
        when(mockState.isGameOver()).thenReturn(false);
        when(mockState.isMillFormed()).thenReturn(true);
        when(mockState.getWhitePiecesRemaining()).thenReturn(8);
        when(mockState.getBlackPiecesRemaining()).thenReturn(9);
        
        when(gameService.placePiece("game-abc", "player-1", 0)).thenReturn(mockState);
        
        // Act
        controller.handlePlacePiece(message);
        
        // Assert
        ArgumentCaptor<GameStateUpdate> captor = ArgumentCaptor.forClass(GameStateUpdate.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/game/game-abc"), captor.capture());
        
        GameStateUpdate update = captor.getValue();
        assertEquals("game-abc", update.getGameId());
        assertEquals(PlayerColor.BLACK, update.getCurrentPlayer());
        assertEquals("PLACEMENT", update.getPhase());
        assertFalse(update.isGameOver());
        assertTrue(update.isMillFormed());
        assertEquals(8, update.getWhitePiecesRemaining());
        assertEquals(9, update.getBlackPiecesRemaining());
    }
}
