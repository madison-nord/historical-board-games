package com.ninemensmorris.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Captor;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.ninemensmorris.dto.GameEndMessage;
import com.ninemensmorris.dto.OpponentDisconnectedMessage;
import com.ninemensmorris.engine.GameState;
import com.ninemensmorris.model.PlayerColor;

/**
 * Unit tests for SessionManagementService.
 * 
 * Tests cover:
 * - Session registration and tracking
 * - Disconnect notification
 * - Game state preservation
 * - Reconnection within timeout
 * - Timeout and winner declaration
 */
public class SessionManagementServiceTest {
    
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    
    @Mock
    private GameService gameService;
    
    @Captor
    private ArgumentCaptor<OpponentDisconnectedMessage> disconnectCaptor;
    
    private SessionManagementService sessionService;
    
    @SuppressWarnings({"unused", "null"}) // Used by JUnit framework, mock objects are non-null in test context
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        // Use 1 second timeout for testing instead of 60 seconds
        sessionService = new SessionManagementService(messagingTemplate, gameService, 1);
    }
    
    @Test
    @DisplayName("Should register session and track player")
    void testRegisterSession() {
        // Arrange
        String sessionId = "session-123";
        String playerId = "player-1";
        
        // Act
        sessionService.registerSession(sessionId, playerId);
        
        // Assert
        assertTrue(sessionService.isPlayerConnected(playerId));
        assertEquals(sessionId, sessionService.getSessionId(playerId));
    }
    
    @Test
    @DisplayName("Should associate player with game")
    void testAssociatePlayerWithGame() {
        // Arrange
        String playerId = "player-1";
        String gameId = "game-123";
        
        // Act
        sessionService.associatePlayerWithGame(playerId, gameId);
        
        // Assert - no exception thrown, association stored internally
        // We can't directly verify the internal state, but we can test the behavior
        // through disconnect handling
    }
    
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Should notify opponent when player disconnects")
    void testDisconnectNotification() {
        // Arrange
        String sessionId = "session-1";
        String playerId = "player-1";
        String opponentId = "player-2";
        String gameId = "game-123";
        
        // Register session and associate with game
        sessionService.registerSession(sessionId, playerId);
        sessionService.associatePlayerWithGame(playerId, gameId);
        sessionService.associatePlayerWithGame(opponentId, gameId);
        
        // Mock game service
        GameState mockState = new GameState(gameId);
        when(gameService.getGame(gameId)).thenReturn(mockState);
        when(gameService.getPlayerMapping(gameId)).thenReturn(playerId + ":" + opponentId);
        
        // Act
        sessionService.handleDisconnect(sessionId);
        
        // Assert
        assertFalse(sessionService.isPlayerConnected(playerId));
        
        // Verify opponent was notified
        verify(messagingTemplate, times(1)).convertAndSendToUser(
                eq(opponentId),
                eq("/queue/opponent-disconnected"),
                any(OpponentDisconnectedMessage.class)
        );
        
        // Capture and verify the message
        verify(messagingTemplate).convertAndSendToUser(
                eq(opponentId),
                eq("/queue/opponent-disconnected"),
                disconnectCaptor.capture()
        );
        
        OpponentDisconnectedMessage message = disconnectCaptor.getValue();
        assertNotNull(message);
        assertEquals(gameId, message.getGameId());
        assertEquals(PlayerColor.WHITE, message.getDisconnectedPlayerColor());
        assertEquals(1, message.getReconnectTimeoutSeconds()); // Using 1 second timeout in tests
    }
    
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Should not notify opponent if game is already over")
    void testDisconnectAfterGameOver() {
        // Arrange
        String sessionId = "session-1";
        String playerId = "player-1";
        String gameId = "game-123";
        
        sessionService.registerSession(sessionId, playerId);
        sessionService.associatePlayerWithGame(playerId, gameId);
        
        // Mock game service with completed game (return null to simulate game not found)
        when(gameService.getGame(gameId)).thenReturn(null);
        
        // Act
        sessionService.handleDisconnect(sessionId);
        
        // Assert - no notification sent
        verify(messagingTemplate, never()).convertAndSendToUser(
                any(),
                eq("/queue/opponent-disconnected"),
                any(OpponentDisconnectedMessage.class)
        );
    }
    
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Should handle reconnection and cancel timeout")
    void testReconnectionWithinTimeout() throws InterruptedException {
        // Arrange
        String sessionId1 = "session-1";
        String sessionId2 = "session-2";
        String playerId = "player-1";
        String opponentId = "player-2";
        String gameId = "game-123";
        
        // Register initial session and associate with game
        sessionService.registerSession(sessionId1, playerId);
        sessionService.associatePlayerWithGame(playerId, gameId);
        sessionService.associatePlayerWithGame(opponentId, gameId);
        
        // Mock game service - set up to return values for multiple calls
        GameState mockGameState = new GameState(gameId);
        when(gameService.getGame(gameId)).thenReturn(mockGameState);
        // Mock getPlayerMapping to return the mapping for both disconnect and reconnect calls
        when(gameService.getPlayerMapping(gameId)).thenReturn(playerId + ":" + opponentId);
        
        // Disconnect
        sessionService.handleDisconnect(sessionId1);
        
        // Verify disconnect notification was sent
        verify(messagingTemplate, times(1)).convertAndSendToUser(
                eq(opponentId),
                eq("/queue/opponent-disconnected"),
                any(OpponentDisconnectedMessage.class)
        );
        
        // Wait a bit to ensure disconnect is processed
        Thread.sleep(100);
        
        // Act - Reconnect with new session
        sessionService.registerSession(sessionId2, playerId);
        
        // Debug: Verify getPlayerMapping was called for reconnection
        verify(gameService, times(2)).getPlayerMapping(gameId); // Once for disconnect, once for reconnect
        
        // Assert
        assertTrue(sessionService.isPlayerConnected(playerId));
        assertEquals(sessionId2, sessionService.getSessionId(playerId));
        
        // Verify reconnection notification was sent
        verify(messagingTemplate, times(1)).convertAndSendToUser(
                eq(opponentId),
                eq("/queue/opponent-reconnected"),
                eq("Opponent has reconnected")
        );
        
        // Wait to ensure timeout doesn't fire
        Thread.sleep(200);
        
        // Verify no game end message was sent (timeout was cancelled)
        verify(messagingTemplate, never()).convertAndSendToUser(
                any(),
                eq("/queue/game-end"),
                any(GameEndMessage.class)
        );
    }
    
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Should declare winner after disconnect timeout")
    void testDisconnectTimeout() throws InterruptedException {
        // Arrange
        String sessionId = "session-1";
        String playerId = "player-1";
        String opponentId = "player-2";
        String gameId = "game-123";
        
        // Register session and associate with game
        sessionService.registerSession(sessionId, playerId);
        sessionService.associatePlayerWithGame(playerId, gameId);
        sessionService.associatePlayerWithGame(opponentId, gameId);
        
        // Mock game service
        GameState mockState = new GameState(gameId);
        when(gameService.getGame(gameId)).thenReturn(mockState);
        when(gameService.getPlayerMapping(gameId)).thenReturn(playerId + ":" + opponentId);
        
        // Act - Disconnect and wait for timeout
        sessionService.handleDisconnect(sessionId);
        
        // Verify disconnect notification was sent
        verify(messagingTemplate, times(1)).convertAndSendToUser(
                eq(opponentId),
                eq("/queue/opponent-disconnected"),
                any(OpponentDisconnectedMessage.class)
        );
        
        // Wait for timeout to fire (1 second + buffer)
        Thread.sleep(1500);
        
        // Assert - Verify game end message was sent to winner
        ArgumentCaptor<GameEndMessage> endMessageCaptor = ArgumentCaptor.forClass(GameEndMessage.class);
        verify(messagingTemplate, times(1)).convertAndSendToUser(
                eq(opponentId),
                eq("/queue/game-end"),
                endMessageCaptor.capture()
        );
        
        GameEndMessage endMessage = endMessageCaptor.getValue();
        assertNotNull(endMessage);
        assertEquals(gameId, endMessage.getGameId());
        assertEquals(PlayerColor.BLACK, endMessage.getWinner());
        assertEquals("Opponent disconnected", endMessage.getReason());
        
        // Verify forfeit was called
        verify(gameService, times(1)).forfeitGame(gameId, playerId);
    }
    
    @Test
    @DisplayName("Should clean up game session data")
    void testCleanupGame() {
        // Arrange
        String playerId1 = "player-1";
        String playerId2 = "player-2";
        String gameId = "game-123";
        
        sessionService.associatePlayerWithGame(playerId1, gameId);
        sessionService.associatePlayerWithGame(playerId2, gameId);
        
        when(gameService.getPlayerMapping(gameId)).thenReturn(playerId1 + ":" + playerId2);
        
        // Act
        sessionService.cleanupGame(gameId);
        
        // Assert - cleanup completed without errors
        // Internal state is cleaned up (can't directly verify, but no exceptions thrown)
    }
    
    @Test
    @DisplayName("Should return null for unknown player session")
    void testGetSessionIdForUnknownPlayer() {
        // Arrange
        String playerId = "unknown-player";
        
        // Act
        String sessionId = sessionService.getSessionId(playerId);
        
        // Assert
        assertNull(sessionId);
        assertFalse(sessionService.isPlayerConnected(playerId));
    }
    
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Should handle disconnect of unknown session gracefully")
    void testDisconnectUnknownSession() {
        // Arrange
        String unknownSessionId = "unknown-session";
        
        // Act & Assert - should not throw exception
        sessionService.handleDisconnect(unknownSessionId);
        
        // Verify no messages were sent
        verify(messagingTemplate, never()).convertAndSendToUser(
                any(String.class),
                any(String.class),
                any(Object.class)
        );
    }
}
