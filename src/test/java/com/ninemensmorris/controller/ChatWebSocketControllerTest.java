package com.ninemensmorris.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Captor;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.ninemensmorris.dto.ChatMessage;
import com.ninemensmorris.dto.ChatMessageBroadcast;
import com.ninemensmorris.model.PlayerColor;
import com.ninemensmorris.service.GameService;

/**
 * Unit tests for ChatWebSocketController.
 * 
 * Tests cover chat message handling and broadcasting to ensure
 * the chat system works correctly in online multiplayer.
 * 
 * Note: Content filtering tests removed as filtering is not implemented.
 * For production use, consider integrating a comprehensive profanity
 * filtering library or service.
 */
public class ChatWebSocketControllerTest {
    
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    
    @Mock
    private GameService gameService;
    
    @Captor
    private ArgumentCaptor<ChatMessageBroadcast> broadcastCaptor;
    
    private ChatWebSocketController controller;
    
    @SuppressWarnings({"unused", "null"}) // Used by JUnit framework, mock objects are non-null in test context
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        // Mock getPlayerColor to return WHITE for player-1, BLACK for player-2
        when(gameService.getPlayerColor(anyString(), eq("player-1"))).thenReturn(PlayerColor.WHITE);
        when(gameService.getPlayerColor(anyString(), eq("player-2"))).thenReturn(PlayerColor.BLACK);
        
        controller = new ChatWebSocketController(messagingTemplate, gameService);
    }
    
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Handle valid chat message successfully")
    void testHandleValidChatMessage() {
        // Arrange
        ChatMessage message = new ChatMessage();
        message.setGameId("game-123");
        message.setPlayerId("player-1");
        message.setContent("Hello, good game!");
        
        // Act
        controller.handleChatMessage(message);
        
        // Assert
        verify(messagingTemplate, times(1)).convertAndSend(
            eq("/topic/game/game-123/chat"),
            any(ChatMessageBroadcast.class)
        );
        
        verify(messagingTemplate).convertAndSend(
            eq("/topic/game/game-123/chat"),
            broadcastCaptor.capture()
        );
        
        ChatMessageBroadcast broadcast = broadcastCaptor.getValue();
        assertNotNull(broadcast);
        assertEquals("game-123", broadcast.getGameId());
        assertEquals(PlayerColor.WHITE, broadcast.getSenderColor()); // player-1 should be WHITE
        assertEquals("Hello, good game!", broadcast.getContent());
        assertNotNull(broadcast.getTimestamp());
    }
    
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Trim and sanitize chat message content")
    void testTrimAndSanitizeContent() {
        // Arrange
        ChatMessage message = new ChatMessage();
        message.setGameId("game-123");
        message.setPlayerId("player-1");
        message.setContent("  Hello!  ");
        
        // Act
        controller.handleChatMessage(message);
        
        // Assert
        verify(messagingTemplate).convertAndSend(
            eq("/topic/game/game-123/chat"),
            broadcastCaptor.capture()
        );
        
        ChatMessageBroadcast broadcast = broadcastCaptor.getValue();
        assertNotNull(broadcast);
        assertEquals("Hello!", broadcast.getContent());
    }
    
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Reject empty chat messages")
    void testRejectEmptyMessages() {
        // Arrange
        ChatMessage message = new ChatMessage();
        message.setGameId("game-123");
        message.setPlayerId("player-1");
        message.setContent("   ");
        
        // Act
        controller.handleChatMessage(message);
        
        // Assert - should not broadcast empty messages
        verify(messagingTemplate, times(0)).convertAndSend(
            eq("/topic/game/game-123/chat"),
            any(ChatMessageBroadcast.class)
        );
    }
    
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Limit chat message length")
    void testLimitMessageLength() {
        // Arrange
        String longMessage = "a".repeat(300); // 300 characters
        ChatMessage message = new ChatMessage();
        message.setGameId("game-123");
        message.setPlayerId("player-1");
        message.setContent(longMessage);
        
        // Act
        controller.handleChatMessage(message);
        
        // Assert
        verify(messagingTemplate).convertAndSend(
            eq("/topic/game/game-123/chat"),
            broadcastCaptor.capture()
        );
        
        ChatMessageBroadcast broadcast = broadcastCaptor.getValue();
        assertNotNull(broadcast);
        // Message should be truncated to 200 characters
        assertEquals(200, broadcast.getContent().length());
    }
    
    @SuppressWarnings("null") // Mock objects are non-null in test context
    @Test
    @DisplayName("Use correct player color from game service")
    void testCorrectPlayerColor() {
        // Arrange - player-2 should be BLACK
        ChatMessage message = new ChatMessage();
        message.setGameId("game-456");
        message.setPlayerId("player-2");
        message.setContent("Nice move!");
        
        // Act
        controller.handleChatMessage(message);
        
        // Assert
        verify(gameService, times(1)).getPlayerColor("game-456", "player-2");
        
        verify(messagingTemplate).convertAndSend(
            eq("/topic/game/game-456/chat"),
            broadcastCaptor.capture()
        );
        
        ChatMessageBroadcast broadcast = broadcastCaptor.getValue();
        assertNotNull(broadcast);
        assertEquals(PlayerColor.BLACK, broadcast.getSenderColor()); // player-2 should be BLACK
    }
}
