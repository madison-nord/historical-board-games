package com.ninemensmorris.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.ninemensmorris.dto.GameStartMessage;
import com.ninemensmorris.model.PlayerColor;

/**
 * Unit tests for MatchmakingService.
 * 
 * Tests verify:
 * - Queue join and leave operations
 * - Player pairing logic
 * - Disconnect handling
 * - Game creation and notification
 */
public class MatchmakingServiceTest {
    
    private MatchmakingService matchmakingService;
    private SimpMessagingTemplate messagingTemplate;
    
    @BeforeEach
    @SuppressWarnings("unused") // Used by JUnit framework
    void setUp() {
        messagingTemplate = mock(SimpMessagingTemplate.class);
        matchmakingService = new MatchmakingService(messagingTemplate);
    }
    
    @Test
    @DisplayName("Join queue adds player to queue")
    void testJoinQueue() {
        // Act
        matchmakingService.joinQueue("player1", "session1");
        
        // Assert
        assertEquals(1, matchmakingService.getQueueSize(), 
                "Queue should have 1 player after join");
    }
    
    @Test
    @DisplayName("Leave queue removes player from queue")
    void testLeaveQueue() {
        // Arrange
        matchmakingService.joinQueue("player1", "session1");
        
        // Act
        matchmakingService.leaveQueue("player1");
        
        // Assert
        assertEquals(0, matchmakingService.getQueueSize(), 
                "Queue should be empty after leave");
    }
    
    @Test
    @DisplayName("Two players are automatically paired")
    @SuppressWarnings("null") // Mock verify calls are non-null in test context
    void testTwoPlayersArePaired() {
        // Act
        matchmakingService.joinQueue("player1", "session1");
        matchmakingService.joinQueue("player2", "session2");
        
        // Assert - Both players should receive game start notifications
        verify(messagingTemplate, times(2)).convertAndSendToUser(
                anyString(),
                eq("/queue/game-start"),
                any(GameStartMessage.class)
        );
        
        // Queue should be empty after pairing
        assertEquals(0, matchmakingService.getQueueSize(), 
                "Queue should be empty after pairing");
    }
    
    @Test
    @DisplayName("Players receive different colors")
    @SuppressWarnings("null") // Mock verify calls are non-null in test context
    void testPlayersReceiveDifferentColors() {
        // Act
        matchmakingService.joinQueue("player1", "session1");
        matchmakingService.joinQueue("player2", "session2");
        
        // Capture the messages sent to both players
        ArgumentCaptor<GameStartMessage> messageCaptor = ArgumentCaptor.forClass(GameStartMessage.class);
        verify(messagingTemplate, times(2)).convertAndSendToUser(
                anyString(),
                eq("/queue/game-start"),
                messageCaptor.capture()
        );
        
        // Get the two messages
        var messages = messageCaptor.getAllValues();
        assertEquals(2, messages.size(), "Should have sent 2 messages");
        
        // Extract colors from both messages
        GameStartMessage msg1 = messages.get(0);
        GameStartMessage msg2 = messages.get(1);
        
        // One player should be WHITE, the other BLACK
        boolean hasWhite = msg1.getPlayer1Color() == PlayerColor.WHITE || msg1.getPlayer2Color() == PlayerColor.WHITE ||
                          msg2.getPlayer1Color() == PlayerColor.WHITE || msg2.getPlayer2Color() == PlayerColor.WHITE;
        boolean hasBlack = msg1.getPlayer1Color() == PlayerColor.BLACK || msg1.getPlayer2Color() == PlayerColor.BLACK ||
                          msg2.getPlayer1Color() == PlayerColor.BLACK || msg2.getPlayer2Color() == PlayerColor.BLACK;
        
        assertTrue(hasWhite, "One player should be WHITE");
        assertTrue(hasBlack, "One player should be BLACK");
    }
    
    @Test
    @DisplayName("Both players receive the same game ID")
    @SuppressWarnings("null") // Mock verify calls are non-null in test context
    void testBothPlayersReceiveSameGameId() {
        // Act
        matchmakingService.joinQueue("player1", "session1");
        matchmakingService.joinQueue("player2", "session2");
        
        // Capture the messages sent to both players
        ArgumentCaptor<GameStartMessage> messageCaptor = ArgumentCaptor.forClass(GameStartMessage.class);
        verify(messagingTemplate, times(2)).convertAndSendToUser(
                anyString(),
                eq("/queue/game-start"),
                messageCaptor.capture()
        );
        
        // Get the two messages
        var messages = messageCaptor.getAllValues();
        assertEquals(2, messages.size(), "Should have sent 2 messages");
        
        // Both messages should have the same game ID
        String gameId1 = messages.get(0).getGameId();
        String gameId2 = messages.get(1).getGameId();
        
        assertNotNull(gameId1, "Game ID should not be null");
        assertNotNull(gameId2, "Game ID should not be null");
        assertEquals(gameId1, gameId2, "Both players should receive the same game ID");
    }
    
    @Test
    @DisplayName("Disconnect removes player from queue")
    void testDisconnectRemovesPlayerFromQueue() {
        // Arrange
        matchmakingService.joinQueue("player1", "session1");
        
        // Act
        matchmakingService.handleDisconnect("player1");
        
        // Assert
        assertEquals(0, matchmakingService.getQueueSize(), 
                "Queue should be empty after disconnect");
    }
    
    @Test
    @DisplayName("Disconnect of non-queued player does not cause error")
    void testDisconnectOfNonQueuedPlayer() {
        // Act & Assert - Should not throw exception
        assertDoesNotThrow(() -> matchmakingService.handleDisconnect("nonexistent"),
                "Disconnect of non-queued player should not throw exception");
    }
    
    @Test
    @DisplayName("Leave queue of non-queued player does not cause error")
    void testLeaveQueueOfNonQueuedPlayer() {
        // Act & Assert - Should not throw exception
        assertDoesNotThrow(() -> matchmakingService.leaveQueue("nonexistent"),
                "Leave queue of non-queued player should not throw exception");
    }
    
    @Test
    @DisplayName("Multiple pairs can be matched simultaneously")
    @SuppressWarnings("null") // Mock verify calls are non-null in test context
    void testMultiplePairsMatched() {
        // Act - Add 4 players
        matchmakingService.joinQueue("player1", "session1");
        matchmakingService.joinQueue("player2", "session2");
        matchmakingService.joinQueue("player3", "session3");
        matchmakingService.joinQueue("player4", "session4");
        
        // Assert - All 4 players should be matched (2 pairs)
        verify(messagingTemplate, times(4)).convertAndSendToUser(
                anyString(),
                eq("/queue/game-start"),
                any(GameStartMessage.class)
        );
        
        // Queue should be empty
        assertEquals(0, matchmakingService.getQueueSize(), 
                "Queue should be empty after matching 2 pairs");
    }
    
    @Test
    @DisplayName("Odd number of players leaves one in queue")
    @SuppressWarnings("null") // Mock verify calls are non-null in test context
    void testOddNumberOfPlayers() {
        // Act - Add 3 players
        matchmakingService.joinQueue("player1", "session1");
        matchmakingService.joinQueue("player2", "session2");
        matchmakingService.joinQueue("player3", "session3");
        
        // Assert - Only 2 players should be matched
        verify(messagingTemplate, times(2)).convertAndSendToUser(
                anyString(),
                eq("/queue/game-start"),
                any(GameStartMessage.class)
        );
        
        // One player should remain in queue
        assertEquals(1, matchmakingService.getQueueSize(), 
                "One player should remain in queue");
    }
}
